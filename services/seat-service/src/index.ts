import express, { Request, Response } from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import Redis from 'ioredis';
import amqp from 'amqplib';
import { SeatLockService } from './SeatLockService';

const PORT = Number(process.env.PORT ?? 4003);
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';

async function main() {
  const app = express();
  app.use(express.json());

  const redis = new Redis(REDIS_URL);
  const seatLock = new SeatLockService(redis);

  const server = http.createServer(app);
  const io = new IOServer(server, {
    cors: { origin: '*' },
    path: '/socket.io',
  });

  // Per-showtime rooms so broadcasts are scoped.
  io.on('connection', (socket) => {
    socket.on('join:showtime', (showtimeId: string) => {
      socket.join(`showtime:${showtimeId}`);
    });
    socket.on('leave:showtime', (showtimeId: string) => {
      socket.leave(`showtime:${showtimeId}`);
    });
  });

  const broadcast = (
    showtimeId: string,
    seatIds: string[],
    status: 'LOCKED' | 'AVAILABLE' | 'SOLD',
  ) => {
    io.to(`showtime:${showtimeId}`).emit('seat_status_changed', {
      showtimeId,
      seatIds,
      status,
      at: Date.now(),
    });
  };

  // RabbitMQ: consume saga commands.
  const conn = await amqp.connect(RABBITMQ_URL);
  const ch = await conn.createChannel();
  await ch.assertExchange('booking.events', 'topic', { durable: true });

  const q = await ch.assertQueue('seat.commands', { durable: true });
  await ch.bindQueue(q.queue, 'booking.events', 'seat.lock.requested');
  await ch.bindQueue(q.queue, 'booking.events', 'seat.release.requested');
  await ch.bindQueue(q.queue, 'booking.events', 'seat.commit.requested');

  ch.consume(q.queue, async (msg) => {
    if (!msg) return;
    const routingKey = msg.fields.routingKey;
    const body = JSON.parse(msg.content.toString());
    const reply = (payload: object, key: string) => {
      if (msg.properties.replyTo) {
        ch.publish('booking.events', key, Buffer.from(JSON.stringify(payload)), {
          correlationId: msg.properties.correlationId,
        });
      }
    };

    try {
      if (routingKey === 'seat.lock.requested') {
        const r = await seatLock.acquireSeats(body.showtimeId, body.seatIds, body.userId);
        if (r.success) {
          broadcast(body.showtimeId, body.seatIds, 'LOCKED');
          reply({ success: true, bookingId: body.bookingId, lockToken: r.lockToken, expiresAt: r.expiresAt }, 'seat.lock.succeeded');
        } else {
          reply({ success: false, bookingId: body.bookingId, conflictingSeatIds: r.conflictingSeats, reason: 'SEATS_TAKEN' }, 'seat.lock.failed');
        }
      } else if (routingKey === 'seat.release.requested') {
        await seatLock.releaseSeats(body.showtimeId, body.seatIds, body.lockToken);
        broadcast(body.showtimeId, body.seatIds, 'AVAILABLE');
      } else if (routingKey === 'seat.commit.requested') {
        const ok = await seatLock.commitSeats(body.showtimeId, body.seatIds, body.lockToken);
        if (ok) broadcast(body.showtimeId, body.seatIds, 'SOLD');
      }
      ch.ack(msg);
    } catch (err) {
      console.error('[seat-service] consume error', err);
      ch.nack(msg, false, false);
    }
  });

  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  app.get('/showtimes/:id/seats', async (req: Request, res: Response) => {
    const showtimeId = req.params.id;
    const lockKeys = await redis.keys(`seat:lock:${showtimeId}:*`);
    const soldKeys = await redis.keys(`seat:sold:${showtimeId}:*`);
    const locked = lockKeys.map((k) => k.split(':').pop()!);
    const sold = soldKeys.map((k) => k.split(':').pop()!);
    res.json({ showtimeId, locked, sold });
  });

  app.post('/showtimes/:id/lock', async (req: Request, res: Response) => {
    const { seatIds, userId } = req.body;
    const r = await seatLock.acquireSeats(req.params.id, seatIds, userId);
    if (!r.success) return res.status(409).json(r);
    broadcast(req.params.id, seatIds, 'LOCKED');
    res.json(r);
  });

  app.post('/showtimes/:id/release', async (req: Request, res: Response) => {
    const { seatIds, lockToken } = req.body;
    await seatLock.releaseSeats(req.params.id, seatIds, lockToken);
    broadcast(req.params.id, seatIds, 'AVAILABLE');
    res.json({ ok: true });
  });

  server.listen(PORT, () => console.log(`[seat-service] :${PORT}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
