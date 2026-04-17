import Redis from 'ioredis';
import { randomUUID } from 'crypto';

export interface LockResult {
  success: boolean;
  lockToken?: string;
  expiresAt?: number;
  conflictingSeats?: string[];
}

/**
 * Atomic multi-seat locking via Redlock-style SET NX PX.
 *
 * Invariant: all-or-nothing. If any seat in the batch is already held,
 * every seat acquired in this call is rolled back — never leak partial locks.
 */
export class SeatLockService {
  private readonly TTL_MS = 10 * 60 * 1000; // 10 minutes
  private readonly keyPrefix = 'seat:lock';

  // Compare-and-delete: only release a key if we still own it.
  private readonly RELEASE_LUA = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;

  // Compare-and-extend.
  private readonly EXTEND_LUA = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("PEXPIRE", KEYS[1], ARGV[2])
    else
      return 0
    end
  `;

  constructor(private readonly redis: Redis) {}

  private key(showtimeId: string, seatId: string) {
    return `${this.keyPrefix}:${showtimeId}:${seatId}`;
  }

  async acquireSeats(
    showtimeId: string,
    seatIds: string[],
    userId: string,
  ): Promise<LockResult> {
    const token = `${userId}:${randomUUID()}`;
    const acquired: string[] = [];
    const conflicts: string[] = [];

    // Deterministic ordering avoids cyclic wait between two concurrent bookings
    // racing for the same pair of seats in opposite order (A→B vs B→A).
    const ordered = [...seatIds].sort();

    for (const seatId of ordered) {
      const k = this.key(showtimeId, seatId);
      const res = await this.redis.set(k, token, 'PX', this.TTL_MS, 'NX');
      if (res === 'OK') {
        acquired.push(seatId);
      } else {
        conflicts.push(seatId);
        break;
      }
    }

    if (conflicts.length > 0) {
      await Promise.all(
        acquired.map((s) =>
          this.redis.eval(this.RELEASE_LUA, 1, this.key(showtimeId, s), token),
        ),
      );
      return { success: false, conflictingSeats: conflicts };
    }

    return {
      success: true,
      lockToken: token,
      expiresAt: Date.now() + this.TTL_MS,
    };
  }

  async releaseSeats(
    showtimeId: string,
    seatIds: string[],
    lockToken: string,
  ): Promise<number> {
    const results = await Promise.all(
      seatIds.map((s) =>
        this.redis.eval(
          this.RELEASE_LUA,
          1,
          this.key(showtimeId, s),
          lockToken,
        ) as Promise<number>,
      ),
    );
    return results.reduce((a, b) => a + b, 0);
  }

  async extendLock(
    showtimeId: string,
    seatIds: string[],
    lockToken: string,
    extensionMs = this.TTL_MS,
  ): Promise<boolean> {
    const results = await Promise.all(
      seatIds.map((s) =>
        this.redis.eval(
          this.EXTEND_LUA,
          1,
          this.key(showtimeId, s),
          lockToken,
          extensionMs.toString(),
        ) as Promise<number>,
      ),
    );
    return results.every((r) => r === 1);
  }

  async commitSeats(
    showtimeId: string,
    seatIds: string[],
    lockToken: string,
  ): Promise<boolean> {
    const pipeline = this.redis.multi();
    for (const s of seatIds) pipeline.get(this.key(showtimeId, s));
    const owners = (await pipeline.exec()) ?? [];
    const allOurs = owners.every(([, v]) => v === lockToken);
    if (!allOurs) return false;

    const soldPipeline = this.redis.multi();
    for (const s of seatIds) {
      soldPipeline.set(`seat:sold:${showtimeId}:${s}`, lockToken);
      soldPipeline.del(this.key(showtimeId, s));
    }
    await soldPipeline.exec();
    return true;
  }
}
