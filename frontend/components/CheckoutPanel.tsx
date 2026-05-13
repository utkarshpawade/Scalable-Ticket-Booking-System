'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookTicket } from '@/lib/api';
import {
  getUser,
  saveBooking,
  type AuthUser,
} from '@/lib/localStore';
import { Mono } from './ui';
import type { Seat } from './SeatMap';

interface CheckoutPanelProps {
  showtimeId: string;
  movieId?: string;
  movieTitle?: string;
  posterUrl?: string;
  selectedSeats: Seat[];
}

type Toast =
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }
  | null;

const HOLD_DURATION_S = 600;

export default function CheckoutPanel({
  showtimeId,
  movieId,
  movieTitle,
  posterUrl,
  selectedSeats,
}: CheckoutPanelProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [user, setLocalUser] = useState<AuthUser | null>(null);
  const [seconds, setSeconds] = useState(HOLD_DURATION_S);

  useEffect(() => {
    const sync = () => setLocalUser(getUser());
    sync();
    window.addEventListener('cinebook:auth', sync);
    return () => window.removeEventListener('cinebook:auth', sync);
  }, []);

  // Countdown begins as soon as the user picks at least one seat.
  useEffect(() => {
    if (selectedSeats.length === 0) {
      setSeconds(HOLD_DURATION_S);
      return;
    }
    const i = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, [selectedSeats.length]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const subtotal = selectedSeats.reduce((a, s) => a + s.price, 0);
  const fees = selectedSeats.length > 0 ? Math.round(subtotal * 0.08) : 0;
  const total = subtotal + fees;

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const proceed = async () => {
    if (selectedSeats.length === 0 || submitting) return;

    if (!user) {
      const next = encodeURIComponent(window.location.pathname);
      router.push(`/signin?next=${next}`);
      return;
    }

    setSubmitting(true);
    setToast(null);

    const seatIds = selectedSeats.map((s) => s.id).sort();
    const idempotencyKey = `${user.userId}:${showtimeId}:${seatIds.join(',')}:${Date.now()}`;

    let bookingId: string;
    try {
      const res = await bookTicket({
        userId: user.userId,
        showtimeId,
        seatIds,
        amount: total,
        idempotencyKey,
      });
      bookingId = res.bookingId;
    } catch (err: any) {
      setToast({
        kind: 'error',
        message:
          err?.response?.data?.error ??
          'Could not lock seats — please try again.',
      });
      setSubmitting(false);
      return;
    }

    saveBooking({
      bookingId,
      userId: user.userId,
      showtimeId,
      movieId,
      movieTitle,
      posterUrl,
      seatIds,
      amount: total,
      status: 'PENDING_PAYMENT',
      createdAt: new Date().toISOString(),
    });

    setToast({ kind: 'success', message: 'Seats locked! Redirecting to payment…' });
    setTimeout(() => router.push(`/payment/${bookingId}`), 600);
  };

  return (
    <aside
      className="sticky top-6 self-start rounded-sharp"
      style={{
        border: '1px solid var(--line)',
        background: 'var(--card)',
        padding: 24,
      }}
    >
      <div className="mb-5 flex items-center justify-between">
        <Mono
          className="text-[10px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--fg-faint)' }}
        >
          Order
        </Mono>
        {selectedSeats.length > 0 && (
          <Mono
            className="rounded-sharp border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]"
            style={{
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
              background:
                'color-mix(in oklch, var(--accent) 12%, transparent)',
            }}
          >
            ◷ {fmtTime(seconds)}
          </Mono>
        )}
      </div>

      {movieTitle && (
        <div
          className="mb-4 font-display italic font-semibold"
          style={{ fontSize: 18, color: 'var(--fg)', lineHeight: 1.1 }}
        >
          {movieTitle}
        </div>
      )}

      <div className="mb-5">
        <Mono
          className="mb-2 block text-[10px] uppercase tracking-[0.2em]"
          style={{ color: 'var(--fg-faint)' }}
        >
          Seats ({selectedSeats.length})
        </Mono>
        {selectedSeats.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--fg-soft)' }}>
            Pick your seats from the chart.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selectedSeats.map((s) => (
              <span
                key={s.id}
                className="rounded-sharp border px-2 py-1 font-mono text-[11px]"
                style={{
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                }}
              >
                {s.id}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        className="space-y-2 py-4"
        style={{
          borderTop: '1px solid var(--line)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div className="flex justify-between text-sm" style={{ color: 'var(--fg-soft)' }}>
          <span>Subtotal</span>
          <Mono>₹{subtotal.toLocaleString('en-IN')}</Mono>
        </div>
        <div className="flex justify-between text-sm" style={{ color: 'var(--fg-faint)' }}>
          <span>Convenience fee</span>
          <Mono>₹{fees.toLocaleString('en-IN')}</Mono>
        </div>
      </div>

      <div className="flex items-baseline justify-between py-4">
        <Mono
          className="text-[10px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--fg-faint)' }}
        >
          Total
        </Mono>
        <Mono
          style={{ fontSize: 24, fontWeight: 600, color: 'var(--fg)' }}
        >
          ₹{total.toLocaleString('en-IN')}
        </Mono>
      </div>

      <button
        onClick={proceed}
        disabled={selectedSeats.length === 0 || submitting}
        className="w-full rounded-sharp px-4 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.15em] transition-opacity hover:opacity-90 disabled:cursor-not-allowed"
        style={{
          background:
            selectedSeats.length === 0 ? 'var(--line)' : 'var(--accent)',
          color:
            selectedSeats.length === 0 ? 'var(--fg-faint)' : 'var(--bg)',
        }}
      >
        {submitting
          ? 'Locking seats…'
          : !user
            ? 'Sign in to continue →'
            : 'Lock & pay →'}
      </button>

      <Mono
        className="mt-4 block text-center text-[10px]"
        style={{ color: 'var(--fg-faint)', lineHeight: 1.5 }}
      >
        Held for 10 min via Redis Redlock.
        <br />
        No double-bookings, ever.
      </Mono>

      {toast && (
        <div
          role="status"
          className="pointer-events-none fixed right-6 top-24 z-50 max-w-xs rounded-sharp px-4 py-3 font-mono text-[11px] shadow-xl animate-fade-up-toast"
          style={{
            border: `1px solid ${toast.kind === 'success' ? 'var(--accent)' : 'oklch(0.65 0.18 25)'}`,
            color: toast.kind === 'success' ? 'var(--accent)' : 'oklch(0.85 0.15 25)',
            background: 'var(--bg)',
          }}
        >
          {toast.message}
        </div>
      )}
    </aside>
  );
}
