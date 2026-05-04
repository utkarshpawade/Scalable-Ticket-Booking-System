'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listBookings, type LocalBooking } from '@/lib/localStore';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<LocalBooking[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setBookings(listBookings());
    sync();
    setHydrated(true);
    window.addEventListener('cinebook:bookings', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cinebook:bookings', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="font-display text-4xl font-bold text-white md:text-5xl">
          My <span className="gradient-text">Bookings</span>
        </h1>
        <p className="text-slate-400">
          Tickets you have purchased or that are awaiting payment.
        </p>
      </header>

      {!hydrated ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-brand-500" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-16 text-center">
          <div className="mb-4 text-5xl">🎟️</div>
          <h3 className="font-display text-xl font-semibold text-white">No bookings yet</h3>
          <p className="mt-2 text-sm text-slate-400">
            Pick a movie and grab some seats — your tickets will show up here.
          </p>
          <Link
            href="/movies"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110"
          >
            Browse movies →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => (
            <li
              key={b.bookingId}
              className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-gradient-to-r from-slate-900/80 to-slate-900/40 p-5 transition hover:border-white/15 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-4">
                {b.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.posterUrl}
                    alt={b.movieTitle ?? 'Movie'}
                    className="h-20 w-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-14 items-center justify-center rounded-lg bg-slate-800 text-2xl">
                    🎞️
                  </div>
                )}
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">
                    {b.movieTitle ?? 'Movie'}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Showtime {b.showtimeId}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Seats: <span className="font-medium text-white">{b.seatIds.join(', ')}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(b.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 md:flex-col md:items-end">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    b.status === 'CONFIRMED'
                      ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30'
                      : b.status === 'PENDING_PAYMENT'
                        ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30'
                        : 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30'
                  }`}
                >
                  {b.status === 'CONFIRMED'
                    ? 'Confirmed'
                    : b.status === 'PENDING_PAYMENT'
                      ? 'Awaiting payment'
                      : 'Cancelled'}
                </span>
                <span className="font-display text-lg font-bold text-white">
                  ${b.amount.toFixed(2)}
                </span>
                <Link
                  href={
                    b.status === 'PENDING_PAYMENT'
                      ? `/payment/${b.bookingId}`
                      : `/bookings/${b.bookingId}`
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  {b.status === 'PENDING_PAYMENT' ? 'Pay now →' : 'View details →'}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
