'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Mono, Poster } from '@/components/ui';
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
      <header className="space-y-2">
        <Mono
          className="text-[10px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--fg-faint)' }}
        >
          Your tickets
        </Mono>
        <h1
          className="font-display italic font-bold"
          style={{
            fontSize: 'clamp(40px, 5vw, 64px)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: 'var(--fg)',
          }}
        >
          My bookings
        </h1>
      </header>

      {!hydrated ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2"
            style={{
              borderColor: 'var(--line)',
              borderTopColor: 'var(--accent)',
            }}
          />
        </div>
      ) : bookings.length === 0 ? (
        <div
          className="rounded-sharp p-16 text-center"
          style={{ border: '1px solid var(--line)', background: 'var(--card)' }}
        >
          <Mono
            className="mb-3 block text-[10px] uppercase tracking-[0.3em]"
            style={{ color: 'var(--accent)' }}
          >
            Nothing here yet
          </Mono>
          <h3
            className="font-display italic font-bold"
            style={{ fontSize: 32, color: 'var(--fg)' }}
          >
            Pick a film and grab some seats.
          </h3>
          <p className="mt-2 text-sm" style={{ color: 'var(--fg-soft)' }}>
            Your tickets will show up here.
          </p>
          <Link
            href="/movies"
            className="mt-6 inline-flex rounded-sharp px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.15em]"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            Browse films →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => (
            <li
              key={b.bookingId}
              className="flex flex-col gap-4 rounded-sharp p-5 md:flex-row md:items-center md:justify-between"
              style={{
                border: '1px solid var(--line)',
                background: 'var(--card)',
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="shrink-0 overflow-hidden rounded-sharp"
                  style={{ width: 56, aspectRatio: '2/3' }}
                >
                  <Poster
                    movie={{
                      id: b.movieId ?? b.bookingId,
                      title: b.movieTitle ?? 'Movie',
                      genres: [],
                      posterUrl: b.posterUrl,
                    }}
                    className="h-full w-full"
                  />
                </div>
                <div>
                  <h3
                    className="font-display italic font-semibold"
                    style={{ fontSize: 20, color: 'var(--fg)', lineHeight: 1.1 }}
                  >
                    {b.movieTitle ?? 'Movie'}
                  </h3>
                  <Mono
                    className="mt-1 block text-[10px] uppercase tracking-[0.15em]"
                    style={{ color: 'var(--fg-faint)' }}
                  >
                    Showtime · {b.showtimeId}
                  </Mono>
                  <Mono
                    className="mt-2 block text-xs"
                    style={{ color: 'var(--fg-soft)' }}
                  >
                    Seats: {b.seatIds.join(', ')}
                  </Mono>
                  <Mono
                    className="mt-0.5 block text-[10px]"
                    style={{ color: 'var(--fg-faint)' }}
                  >
                    {new Date(b.createdAt).toLocaleString()}
                  </Mono>
                </div>
              </div>

              <div className="flex items-center gap-4 md:flex-col md:items-end">
                <Mono
                  className="rounded-sharp border px-3 py-1 text-[10px] uppercase tracking-[0.15em]"
                  style={{
                    borderColor:
                      b.status === 'CONFIRMED'
                        ? 'var(--accent)'
                        : b.status === 'PENDING_PAYMENT'
                          ? 'var(--fg-soft)'
                          : 'oklch(0.65 0.18 25)',
                    color:
                      b.status === 'CONFIRMED'
                        ? 'var(--accent)'
                        : b.status === 'PENDING_PAYMENT'
                          ? 'var(--fg-soft)'
                          : 'oklch(0.85 0.15 25)',
                  }}
                >
                  {b.status === 'CONFIRMED'
                    ? 'Confirmed'
                    : b.status === 'PENDING_PAYMENT'
                      ? 'Awaiting payment'
                      : 'Cancelled'}
                </Mono>
                <Mono
                  className="font-display"
                  style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg)' }}
                >
                  ₹{b.amount.toLocaleString('en-IN')}
                </Mono>
                <Link
                  href={
                    b.status === 'PENDING_PAYMENT'
                      ? `/payment/${b.bookingId}`
                      : `/bookings/${b.bookingId}`
                  }
                  className="rounded-sharp border px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em]"
                  style={{
                    borderColor: 'var(--line)',
                    color: 'var(--fg)',
                  }}
                >
                  {b.status === 'PENDING_PAYMENT' ? 'Pay now →' : 'View ticket →'}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
