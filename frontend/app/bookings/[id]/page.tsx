'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Mono, Poster } from '@/components/ui';
import { getBooking, type LocalBooking } from '@/lib/localStore';

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <Mono
        className="block text-[10px] uppercase tracking-[0.2em]"
        style={{ color: 'var(--fg-faint)' }}
      >
        {label}
      </Mono>
      <div
        className="mt-1"
        style={{
          fontFamily: mono ? '"JetBrains Mono", monospace' : 'inherit',
          fontSize: 14,
          color: 'var(--fg)',
          fontWeight: mono ? 500 : 400,
        }}
      >
        {value}
      </div>
    </div>
  );
}

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
        <span
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{
            borderColor: 'var(--line)',
            borderTopColor: 'var(--accent)',
          }}
        />
      </div>
    );
  }

  if (booking === null) {
    return (
      <div
        className="rounded-sharp p-16 text-center"
        style={{ border: '1px solid var(--line)', background: 'var(--card)' }}
      >
        <Mono
          className="mb-3 block text-[10px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--accent)' }}
        >
          Not found
        </Mono>
        <h3
          className="font-display italic font-bold"
          style={{ fontSize: 32, color: 'var(--fg)' }}
        >
          We can&apos;t locate that booking.
        </h3>
        <Mono
          className="mt-2 block text-xs"
          style={{ color: 'var(--fg-soft)' }}
        >
          {params.id}
        </Mono>
        <Link
          href="/bookings"
          className="mt-6 inline-flex rounded-sharp px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          Back to my bookings
        </Link>
      </div>
    );
  }

  const isConfirmed = booking.status === 'CONFIRMED';

  return (
    <div className="space-y-10 screen-enter">
      <div className="text-center">
        <div
          className="mx-auto mb-6 flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background:
              'color-mix(in oklch, var(--accent) 15%, transparent)',
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
            fontSize: 28,
          }}
        >
          {isConfirmed ? '✓' : '◷'}
        </div>
        <Mono
          className="mb-3 block text-[10px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--accent)' }}
        >
          {isConfirmed ? 'Booking confirmed' : 'Awaiting payment'}
        </Mono>
        <h1
          className="font-display italic font-bold"
          style={{ fontSize: 56, lineHeight: 1, color: 'var(--fg)' }}
        >
          {isConfirmed
            ? 'See you at the screen.'
            : 'Finish payment to lock your seats.'}
        </h1>
        <Mono
          className="mt-3 block text-xs"
          style={{ color: 'var(--fg-soft)' }}
        >
          Booking ID · {booking.bookingId}
        </Mono>
      </div>

      {/* Ticket */}
      <div
        className="relative mx-auto"
        style={{
          maxWidth: 720,
          border: '1px solid var(--line)',
          background: 'var(--card)',
          borderRadius: 2,
        }}
      >
        {/* Perforated divider */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '70%',
            height: 0,
            borderTop: '1px dashed var(--line)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -8,
            top: 'calc(70% - 8px)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--bg)',
            border: '1px solid var(--line)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: -8,
            top: 'calc(70% - 8px)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--bg)',
            border: '1px solid var(--line)',
          }}
        />

        <div
          className="grid gap-6 p-8"
          style={{ gridTemplateColumns: '120px 1fr' }}
        >
          <div
            className="overflow-hidden rounded-sharp"
            style={{ aspectRatio: '2/3' }}
          >
            <Poster
              movie={{
                id: booking.movieId ?? booking.bookingId,
                title: booking.movieTitle ?? 'Movie',
                genres: [],
                posterUrl: booking.posterUrl,
              }}
              className="h-full w-full"
            />
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <h2
                className="font-display italic font-bold"
                style={{ fontSize: 36, color: 'var(--fg)', lineHeight: 0.95 }}
              >
                {booking.movieTitle ?? 'Movie'}
              </h2>
              <Mono
                className="mt-2 block text-[10px] uppercase tracking-[0.2em]"
                style={{ color: 'var(--fg-soft)' }}
              >
                Booked · {new Date(booking.createdAt).toLocaleDateString()}
              </Mono>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Showtime" value={booking.showtimeId.slice(-8)} mono />
              <Field label="Screen" value="Screen 4" />
              <Field
                label="Booked"
                value={new Date(booking.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                mono
              />
            </div>
          </div>
        </div>

        <div
          className="grid gap-6 px-8 pb-8 pt-6"
          style={{ gridTemplateColumns: '1fr auto' }}
        >
          <div className="grid grid-cols-3 gap-6">
            <Field
              label="Seats"
              value={booking.seatIds.join(', ')}
              mono
            />
            <Field label="Status" value={isConfirmed ? 'Confirmed' : 'Pending'} />
            <Field
              label="Total paid"
              value={`₹${booking.amount.toLocaleString('en-IN')}`}
              mono
            />
          </div>
          {/* Faux QR */}
          <div
            className="relative"
            style={{
              width: 96,
              height: 96,
              background: `repeating-linear-gradient(0deg, var(--fg) 0 4px, transparent 4px 7px),
                           repeating-linear-gradient(90deg, var(--fg) 0 4px, transparent 4px 7px)`,
              border: '1px solid var(--line)',
              borderRadius: 2,
              opacity: 0.85,
            }}
          >
            <div
              style={{ position: 'absolute', inset: 12, background: 'var(--card)' }}
            />
            <div
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                width: 14,
                height: 14,
                border: '3px solid var(--fg)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 14,
                height: 14,
                border: '3px solid var(--fg)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                left: 6,
                width: 14,
                height: 14,
                border: '3px solid var(--fg)',
              }}
            />
          </div>
        </div>
      </div>

      <div className="text-center">
        {isConfirmed ? (
          <Link
            href="/movies"
            className="inline-flex rounded-sharp border px-6 py-3 font-mono text-[11px] uppercase tracking-[0.15em]"
            style={{ borderColor: 'var(--line)', color: 'var(--fg)' }}
          >
            Book another →
          </Link>
        ) : (
          <Link
            href={`/payment/${booking.bookingId}`}
            className="inline-flex rounded-sharp px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.15em]"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            Continue to payment →
          </Link>
        )}
      </div>
    </div>
  );
}
