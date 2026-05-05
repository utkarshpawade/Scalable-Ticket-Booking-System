import { Channel } from 'amqplib';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

type SagaStep = 'CREATE' | 'LOCK' | 'PAY' | 'CONFIRM';

interface BookingCmd {
  userId: string;
  showtimeId: string;
  seatIds: string[];
  amount: number;
  idempotencyKey: string;
}

export interface BookingStartResult {
  bookingId: string;
  lockToken: string;
  expiresAt: number;
}

/**
 * Orchestration-based Saga. Each forward step has a paired compensation.
 * State persisted on every transition so a crashed orchestrator can be
 * resumed by the recovery worker.
 *
 * Two-phase: `start()` locks seats and returns a PENDING booking; the
 * caller (frontend after simulated payment) drives `confirm()` to commit
 * the seats from `seat:lock:*` to `seat:sold:*`. Lock TTL bounds abandonment.
 */
export class BookingSaga {
  constructor(
    private readonly db: Pool,
    private readonly mq: Channel,
  ) {}

  async start(cmd: BookingCmd): Promise<BookingStartResult> {
    const bookingId = await this.createPending(cmd);
    await this.recordStep(bookingId, 'CREATE');

    try {
      const lock = await this.requestSeatLock(bookingId, cmd);
      if (!lock.success) throw new SagaError('SEATS_UNAVAILABLE', 'LOCK');
      await this.persistLock(bookingId, lock.lockToken!);
      await this.recordStep(bookingId, 'LOCK');

      return {
        bookingId,
        lockToken: lock.lockToken!,
        expiresAt: lock.expiresAt ?? Date.now() + 10 * 60 * 1000,
      };
    } catch (err) {
      await this.compensate(bookingId, err as SagaError);
      throw err;
    }
  }

  async confirm(bookingId: string, userId: string): Promise<void> {
    const booking = await this.loadBooking(bookingId);
    if (!booking) throw new SagaError('NOT_FOUND', 'CONFIRM');
    if (booking.user_id !== userId) throw new SagaError('FORBIDDEN', 'CONFIRM');
    if (booking.status === 'CONFIRMED') return;
    if (booking.status !== 'SEATS_LOCKED') {
      throw new SagaError(`CANNOT_CONFIRM_FROM_${booking.status}`, 'CONFIRM');
    }

    // Commit is fire-and-forget on the bus; seat-service flips lock→sold and
    // broadcasts SOLD to all socket clients in the showtime room.
    await this.emit('seat.commit.requested', {
      bookingId,
      showtimeId: booking.showtime_id,
      seatIds: booking.seat_ids,
      lockToken: booking.lock_token,
    });

    await this.db.query(
      `UPDATE bookings
         SET status='CONFIRMED', updated_at=NOW()
         WHERE id=$1 AND status='SEATS_LOCKED'`,
      [bookingId],
    );
    await this.recordStep(bookingId, 'CONFIRM');
    await this.emit('booking.confirmed', {
      bookingId,
      userId: booking.user_id,
      showtimeId: booking.showtime_id,
      seatIds: booking.seat_ids,
    });
  }

  private async compensate(bookingId: string, err: SagaError) {
    const booking = await this.loadBooking(bookingId);
    const completed: SagaStep[] = booking.saga_state?.completed ?? [];

    for (const step of [...completed].reverse()) {
      try {
        if (step === 'LOCK' && booking.lock_token) {
          await this.emit('seat.release.requested', {
            bookingId,
            lockToken: booking.lock_token,
            seatIds: booking.seat_ids,
            showtimeId: booking.showtime_id,
          });
        }
        if (step === 'PAY') {
          await this.emit('payment.refund.requested', { bookingId });
        }
      } catch (compErr) {
        await this.logCompensationFailure(bookingId, step, compErr);
      }
    }

    await this.db.query(
      `UPDATE bookings SET status='FAILED',
         saga_state = saga_state || $2::jsonb, updated_at=NOW()
       WHERE id=$1`,
      [bookingId, JSON.stringify({ failedStep: err.step, reason: err.message })],
    );
    await this.emit('booking.failed', { bookingId, reason: err.message });
  }

  private async createPending(cmd: BookingCmd): Promise<string> {
    const { rows } = await this.db.query(
      `INSERT INTO bookings(user_id, showtime_id, seat_ids, total_amount,
                            status, idempotency_key, expires_at)
       VALUES($1,$2,$3,$4,'PENDING',$5, NOW() + INTERVAL '10 minutes')
       ON CONFLICT (idempotency_key) DO UPDATE SET updated_at=NOW()
       RETURNING id`,
      [cmd.userId, cmd.showtimeId, cmd.seatIds, cmd.amount, cmd.idempotencyKey],
    );
    return rows[0].id;
  }

  private async requestSeatLock(bookingId: string, cmd: BookingCmd) {
    return this.rpc<{ success: boolean; lockToken?: string; expiresAt?: number }>(
      'seat.lock.requested',
      {
        bookingId,
        showtimeId: cmd.showtimeId,
        seatIds: cmd.seatIds,
        userId: cmd.userId,
        ttlSec: 600,
      },
      'seat.lock.succeeded',
      'seat.lock.failed',
      5_000,
    );
  }

  private async recordStep(id: string, step: SagaStep) {
    await this.db.query(
      `UPDATE bookings
         SET saga_state = jsonb_set(
           COALESCE(saga_state,'{}'::jsonb),
           '{completed}',
           COALESCE(saga_state->'completed','[]'::jsonb) || to_jsonb($2::text)
         ),
         status = CASE $2
           WHEN 'LOCK' THEN 'SEATS_LOCKED'::booking_status
           WHEN 'PAY'  THEN 'PAYMENT_PROCESSING'::booking_status
           ELSE status END,
         updated_at = NOW()
       WHERE id=$1`,
      [id, step],
    );
  }

  private async persistLock(bookingId: string, token: string) {
    await this.db.query(`UPDATE bookings SET lock_token=$2 WHERE id=$1`, [
      bookingId,
      token,
    ]);
  }

  private async loadBooking(id: string) {
    const { rows } = await this.db.query(`SELECT * FROM bookings WHERE id=$1`, [id]);
    return rows[0];
  }

  private async logCompensationFailure(id: string, step: SagaStep, e: unknown) {
    await this.db.query(
      `INSERT INTO saga_compensation_failures(booking_id, step, error, created_at)
       VALUES($1,$2,$3,NOW())`,
      [id, step, String(e)],
    );
  }

  private emit(routingKey: string, payload: object) {
    return this.mq.publish(
      'booking.events',
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true, timestamp: Date.now() },
    );
  }

  private rpc<T>(
    outKey: string,
    payload: object,
    successKey: string,
    failKey: string,
    timeoutMs: number,
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const correlationId = randomUUID();
      const { queue } = await this.mq.assertQueue('', { exclusive: true });
      const timer = setTimeout(() => reject(new SagaError('TIMEOUT', 'RPC')), timeoutMs);

      await this.mq.consume(
        queue,
        (msg) => {
          if (!msg || msg.properties.correlationId !== correlationId) return;
          clearTimeout(timer);
          const body = JSON.parse(msg.content.toString());
          if (msg.fields.routingKey === failKey)
            reject(new SagaError(body.reason ?? 'failed', 'RPC'));
          else resolve(body as T);
        },
        { noAck: true },
      );

      this.mq.publish('booking.events', outKey, Buffer.from(JSON.stringify(payload)), {
        correlationId,
        replyTo: queue,
        persistent: true,
      });
    });
  }
}

class SagaError extends Error {
  constructor(msg: string, public step: SagaStep | 'RPC') {
    super(msg);
  }
}
