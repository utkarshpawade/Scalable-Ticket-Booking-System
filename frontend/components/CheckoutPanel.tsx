'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookTicket } from '@/lib/api';
import type { Seat } from './SeatMap';

interface CheckoutPanelProps {
  showtimeId: string;
  movieTitle?: string;
  selectedSeats: Seat[];
  userId?: string;
}

type Toast =
  | { kind: 'success'; message: string; bookingId?: string }
  | { kind: 'error'; message: string }
  | null;

export default function CheckoutPanel({
  showtimeId,
  movieTitle,
  selectedSeats,
  userId = 'user_123',
}: CheckoutPanelProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const subtotal = selectedSeats.reduce((a, s) => a + s.price, 0);
  const fees = selectedSeats.length > 0 ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + fees;

  // Auto-dismiss toast after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const confirm = async () => {
    if (selectedSeats.length === 0 || submitting) return;
    setSubmitting(true);
    setToast(null);

    const seatIds = selectedSeats.map((s) => s.id).sort();
    // Stable idempotency key so double-clicks can't create two bookings
    // for the same seat batch.
    const idempotencyKey = `${userId}:${showtimeId}:${seatIds.join(',')}:${Date.now()}`;

    try {
      const { bookingId } = await bookTicket({
        userId,
        showtimeId,
        seatIds,
        amount: total,
        idempotencyKey,
      });
      setToast({
        kind: 'success',
        message: 'Booking confirmed! Redirecting…',
        bookingId,
      });
      setTimeout(() => router.push(`/bookings/${bookingId}`), 900);
    } catch (err: any) {
      // Saga failure = compensations already released the lock server-side.
      const msg =
        err?.response?.data?.error ??
        err?.message ??
        'Booking failed — your seats have been released.';
      setToast({ kind: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside className="sticky top-24 flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Order Summary</h3>
        {movieTitle && (
          <p className="mt-0.5 text-sm text-slate-400">{movieTitle}</p>
        )}
      </div>

      {/* Selected seats */}
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Seats ({selectedSeats.length})
        </p>
        {selectedSeats.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">
            Pick one or more seats from the map to continue.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {selectedSeats.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-600/20 px-3 py-1 text-sm text-brand-100"
              >
                <span className="font-semibold">{s.id}</span>
                <span className="text-xs text-brand-200/80">
                  ${s.price.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Totals */}
      <div className="space-y-1.5 border-t border-slate-800 pt-4 text-sm">
        <div className="flex justify-between text-slate-300">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Service fees (5%)</span>
          <span>${fees.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-slate-800 pt-2 text-base font-semibold text-white">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={confirm}
        disabled={selectedSeats.length === 0 || submitting}
        className="flex w-full items-center justify-center rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Processing…
          </span>
        ) : (
          <>Confirm Booking & Pay</>
        )}
      </button>

      <p className="text-center text-[11px] text-slate-500">
        Seats are locked for 10 minutes during checkout.
      </p>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`pointer-events-none fixed right-6 top-24 z-50 max-w-xs rounded-lg px-4 py-3 text-sm shadow-xl ${
            toast.kind === 'success'
              ? 'border border-emerald-500/50 bg-emerald-900/80 text-emerald-100'
              : 'border border-red-500/50 bg-red-900/80 text-red-100'
          }`}
        >
          <div className="flex items-start gap-2">
            <span>{toast.kind === 'success' ? '✅' : '⚠️'}</span>
            <div>
              <p className="font-medium">
                {toast.kind === 'success' ? 'Success' : 'Booking failed'}
              </p>
              <p className="mt-0.5 text-xs opacity-90">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
