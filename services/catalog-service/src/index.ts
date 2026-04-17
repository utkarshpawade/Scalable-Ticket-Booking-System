import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { MovieModel, ShowtimeModel } from './models/Movie';

const PORT      = Number(process.env.PORT ?? 4002);
const MONGO_URL = process.env.MONGO_URL ?? 'mongodb://localhost:27017/catalog';
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const CACHE_TTL = Number(process.env.CACHE_TTL_SEC ?? 60);

async function main() {
  const app = express();
  app.use(express.json());

  await mongoose.connect(MONGO_URL);
  mongoose.connection.on('error', (e) => console.error('[mongo]', e));

  const redis = new Redis(REDIS_URL);
  redis.on('error', (e) => console.error('[redis]', e));

  const cacheKey = (parts: (string | number)[]) => `catalog:${parts.join(':')}`;

  async function cached<T>(key: string, ttl: number, loader: () => Promise<T>): Promise<T> {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
    const fresh = await loader();
    redis.set(key, JSON.stringify(fresh), 'EX', ttl).catch(() => {});
    return fresh;
  }

  async function invalidate(pattern: string) {
    let cursor = '0';
    do {
      const [next, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
      cursor = next;
      if (batch.length) await redis.del(...batch);
    } while (cursor !== '0');
  }

  const wrap =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
    (req: Request, res: Response, next: NextFunction) =>
      fn(req, res, next).catch(next);

  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  app.get(
    '/movies',
    wrap(async (req, res) => {
      const page   = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
      const limit  = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
      const genre  = (req.query.genre  as string | undefined)?.trim();
      const search = (req.query.search as string | undefined)?.trim();
      const status = (req.query.status as string | undefined)?.trim() ?? 'now_showing';

      const key = cacheKey(['movies', status, genre ?? '-', search ?? '-', page, limit]);

      const data = await cached(key, CACHE_TTL, async () => {
        const filter: Record<string, unknown> = { status };
        if (genre)  filter.genres = genre;
        if (search) filter.$text  = { $search: search };

        const [items, total] = await Promise.all([
          MovieModel.find(filter)
            .sort({ releaseDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
          MovieModel.countDocuments(filter),
        ]);
        return { items, total, page, limit };
      });

      res.json(data);
    }),
  );

  app.get(
    '/movies/:id',
    wrap(async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'bad id' });

      const data = await cached(cacheKey(['movie', id]), CACHE_TTL, async () => {
        const movie = await MovieModel.findById(id).lean();
        if (!movie) return null;
        const showtimes = await ShowtimeModel.find({
          movieId: id,
          startsAt: { $gte: new Date() },
        })
          .sort({ startsAt: 1 })
          .limit(50)
          .lean();
        return { movie, showtimes };
      });

      if (!data) return res.status(404).json({ error: 'not found' });
      res.json(data);
    }),
  );

  app.get(
    '/showtimes/:id',
    wrap(async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'bad id' });

      const showtime = await cached(cacheKey(['showtime', id]), CACHE_TTL, async () =>
        ShowtimeModel.findById(id).lean(),
      );
      if (!showtime) return res.status(404).json({ error: 'not found' });
      res.json(showtime);
    }),
  );

  app.post(
    '/admin/movies',
    wrap(async (req, res) => {
      const created = await MovieModel.create(req.body);
      await invalidate(cacheKey(['movies', '*']));
      res.status(201).json(created);
    }),
  );

  app.put(
    '/admin/movies/:id',
    wrap(async (req, res) => {
      const updated = await MovieModel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated) return res.status(404).json({ error: 'not found' });
      await Promise.all([
        invalidate(cacheKey(['movies', '*'])),
        invalidate(cacheKey(['movie', req.params.id])),
      ]);
      res.json(updated);
    }),
  );

  app.post(
    '/admin/showtimes',
    wrap(async (req, res) => {
      const st = await ShowtimeModel.create(req.body);
      await invalidate(cacheKey(['movie', String(st.movieId)]));
      res.status(201).json(st);
    }),
  );

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[catalog-service]', err);
    res.status(500).json({ error: err.message });
  });

  app.listen(PORT, () => console.log(`[catalog-service] :${PORT}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
