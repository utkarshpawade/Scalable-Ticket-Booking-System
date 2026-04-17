import express from 'express';
import { Pool } from 'pg';
import amqp from 'amqplib';
import { BookingSaga } from './BookingSaga';

const PORT = Number(process.env.PORT ?? 4004);
const POSTGRES_URL = process.env.POSTGRES_URL!;
const RABBITMQ_URL = process.env.RABBITMQ_URL!;

async function main() {
  const app = express();
  app.use(express.json());

  const db = new Pool({ connectionString: POSTGRES_URL, max: 20 });
  await db.query('SELECT 1');

  const conn = await amqp.connect(RABBITMQ_URL);
  const ch = await conn.createChannel();
  await ch.assertExchange('booking.events', 'topic', { durable: true });
  await ch.assertExchange('booking.events.dlx', 'topic', { durable: true });

  const saga = new BookingSaga(db, ch);

  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  app.post('/bookings', async (req, res) => {
    try {
      const { userId, showtimeId, seatIds, amount, idempotencyKey } = req.body;
      if (!userId || !showtimeId || !Array.isArray(seatIds) || !idempotencyKey) {
        return res.status(400).json({ error: 'invalid payload' });
      }
      const result = await saga.execute({
        userId, showtimeId, seatIds, amount, idempotencyKey,
      });
      res.status(201).json(result);
    } catch (err: any) {
      console.error('[booking-service] saga failed', err);
      res.status(409).json({ error: err.message ?? 'booking failed' });
    }
  });

  app.get('/bookings/:id', async (req, res) => {
    const { rows } = await db.query(
      `SELECT id, user_id, showtime_id, seat_ids, total_amount, status,
              payment_ref, created_at, updated_at, expires_at
         FROM bookings WHERE id=$1`,
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  });

  app.get('/users/:uid/bookings', async (req, res) => {
    const { rows } = await db.query(
      `SELECT id, showtime_id, seat_ids, status, total_amount, created_at
         FROM bookings WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [req.params.uid],
    );
    res.json(rows);
  });

  // Recovery worker — expire stuck sagas.
  setInterval(async () => {
    try {
      await db.query(
        `UPDATE bookings SET status='EXPIRED', updated_at=NOW()
           WHERE status IN ('PENDING','SEATS_LOCKED','PAYMENT_PROCESSING')
             AND expires_at < NOW()`,
      );
    } catch (e) { console.error('[recovery]', e); }
  }, 30_000);

  app.listen(PORT, () => console.log(`[booking-service] :${PORT}`));
}

main().catch((e) => { console.error(e); process.exit(1); });
