'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookTicket } from '@/lib/api';
import {
  getUser,
  saveBooking,
  type AuthUser,
} from '@/lib/localStore';
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

  useEffect(() => {
    const sync = () => setLocalUser(getUser());
    sync();
    window.addEventListener('cinebook:auth', sync);
    return () => window.removeEventListener('cinebook:auth', sync);
  }, []);

  const subtotal = selectedSeats.reduce((a, s) => a + s.price, 0);
  const fees = selectedSeats.length > 0 ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + fees;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

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
    <aside className="sticky top-24 flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Order Summary</h3>
        {movieTitle && (
          <p className="mt-0.5 text-sm text-slate-400">{movieTitle}</p>
        )}
      </div>

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
        onClick={proceed}
        disabled={selectedSeats.length === 0 || submitting}
        className="flex w-full items-center justify-center rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Locking seats…
          </span>
        ) : !user ? (
          <>Sign in to continue</>
        ) : (
          <>Proceed to Payment →</>
        )}
      </button>

      <p className="text-center text-[11px] text-slate-500">
        Seats are locked for 10 minutes during checkout.
      </p>

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
                {toast.kind === 'success' ? 'Almost there' : 'Booking failed'}
              </p>
              <p className="mt-0.5 text-xs opacity-90">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
