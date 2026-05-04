'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getBooking, type LocalBooking } from '@/lib/localStore';

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const [booking, setBooking] = useState<LocalBooking | null | undefined>(undefined);

  useEffect(() => {
    const sync = () => setBooking(getBooking(params.id) ?? null);
    sync();
    window.addEventListener('cinebook:bookings', sync);
    return () => window.removeEventListener('cinebook:bookings', sync);
  }, [params.id]);

  if (booking === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-brand-500" />
      </div>
    );
  }

  if (booking === null) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/5 p-16 text-center">
        <div className="mb-4 text-5xl">🤔</div>
        <h3 className="font-display text-xl font-semibold text-white">
          Booking not found
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          We couldn&apos;t find booking <code>{params.id}</code> in your account.
        </p>
        <Link
          href="/bookings"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110"
        >
          Back to my bookings
        </Link>
      </div>
    );
  }

  const isConfirmed = booking.status === 'CONFIRMED';

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <nav className="text-sm text-slate-400">
        <Link href="/bookings" className="hover:text-white">My Bookings</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{booking.bookingId}</span>
      </nav>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/40 shadow-2xl">
        <div
          className={`px-8 py-6 text-center ${
            isConfirmed
              ? 'bg-gradient-to-r from-emerald-600/30 via-emerald-500/20 to-emerald-700/30'
              : 'bg-gradient-to-r from-amber-600/30 via-amber-500/20 to-amber-700/30'
          }`}
        >
          <div className="text-5xl">{isConfirmed ? '✅' : '⏳'}</div>
          <h1 className="mt-3 font-display text-3xl font-bold text-white">
            {isConfirmed ? 'Booking confirmed' : 'Awaiting payment'}
          </h1>
          <p className="mt-1 text-sm text-slate-200">
            {isConfirmed
              ? 'See you at the movies — show this ticket at the entrance.'
              : 'Finish payment to lock in your seats.'}
          </p>
        </div>

        <div className="space-y-5 p-8">
          <div className="flex items-start gap-4">
            {booking.posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={booking.posterUrl} alt="" className="h-28 w-20 rounded-lg object-cover" />
            ) : (
              <div className="flex h-28 w-20 items-center justify-center rounded-lg bg-slate-800 text-3xl">🎞️</div>
            )}
            <div>
              <h2 className="font-display text-xl font-semibold text-white">
                {booking.movieTitle ?? 'Movie'}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Showtime <span className="text-slate-200">{booking.showtimeId}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Booked {new Date(booking.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Booking ID</p>
              <p className="mt-1 font-mono text-sm text-white">{booking.bookingId}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Total paid</p>
              <p className="mt-1 font-display text-lg font-bold text-white">
                ${booking.amount.toFixed(2)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-wider text-slate-400">Seats</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {booking.seatIds.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-brand-500/40 bg-brand-600/20 px-3 py-1 text-sm font-semibold text-brand-100"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {isConfirmed ? (
            <div className="flex justify-center rounded-xl border border-white/10 bg-white/5 p-6">
              <div
                className="h-32 w-32 bg-white"
                style={{
                  background:
                    'repeating-linear-gradient(0deg, #fff, #fff 4px, #000 4px, #000 8px), repeating-linear-gradient(90deg, transparent, transparent 6px, #fff 6px, #fff 10px)',
                  backgroundBlendMode: 'multiply',
                }}
                aria-label="QR code"
              />
            </div>
          ) : (
            <Link
              href={`/payment/${booking.bookingId}`}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-110"
            >
              Continue to payment →
            </Link>
          )}
        </div>
      </div>

      <div className="text-center">
        <Link href="/movies" className="text-sm text-slate-400 hover:text-white">
          Book another movie →
        </Link>
      </div>
    </div>
  );
}
