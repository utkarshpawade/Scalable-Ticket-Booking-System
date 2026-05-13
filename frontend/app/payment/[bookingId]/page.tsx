'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Mono, Poster } from '@/components/ui';
import {
  getBooking,
  getUser,
  updateBooking,
  type LocalBooking,
} from '@/lib/localStore';
import { confirmBooking } from '@/lib/api';

type Method = 'card' | 'upi' | 'wallet';
type Stage = 'idle' | 'locking' | 'paying' | 'confirming' | 'done';

const STAGES: Array<{ key: Exclude<Stage, 'idle' | 'done'>; label: string; sub: string }> = [
  { key: 'locking',    label: 'Lock seats',       sub: 'seat-service / Redis' },
  { key: 'paying',     label: 'Process payment',  sub: 'payment gateway' },
  { key: 'confirming', label: 'Commit booking',   sub: 'booking-service / saga' },
];

const stageIdx = (s: Stage): number =>
  ({ idle: -1, locking: 0, paying: 1, confirming: 2, done: 3 })[s];

function FormField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <div>
      <Mono
        className="mb-1.5 block text-[10px] uppercase tracking-[0.2em]"
        style={{ color: 'var(--fg-faint)' }}
      >
        {label}
      </Mono>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded-sharp border px-3 py-2.5 font-mono text-sm outline-none"
        style={{
          borderColor: 'var(--line)',
          background: 'transparent',
          color: 'var(--fg)',
        }}
      />
    </div>
  );
}

export default function PaymentPage({ params }: { params: { bookingId: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<LocalBooking | null | undefined>(undefined);
  const [method, setMethod] = useState<Method>('upi');
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);

  const [cardNum, setCardNum] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    const sync = () => setBooking(getBooking(params.bookingId) ?? null);
    sync();
    window.addEventListener('cinebook:bookings', sync);
    return () => window.removeEventListener('cinebook:bookings', sync);
  }, [params.bookingId]);

  const fees = useMemo(() => {
    if (!booking) return 0;
    return Math.round((booking.amount * 0.08) / 1.08);
  }, [booking]);
  const subtotal = booking ? booking.amount - fees : 0;

  if (booking === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: 'var(--line)', borderTopColor: 'var(--accent)' }}
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
          Booking not found
        </Mono>
        <h3
          className="font-display italic font-bold"
          style={{ fontSize: 36, color: 'var(--fg)' }}
        >
          We couldn&apos;t locate this ticket.
        </h3>
        <p className="mt-3 text-sm" style={{ color: 'var(--fg-soft)' }}>
          It may have expired or been cancelled.
        </p>
        <Link
          href="/movies"
          className="mt-6 inline-flex rounded-sharp px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          Browse films
        </Link>
      </div>
    );
  }

  if (booking.status === 'CONFIRMED') {
    return (
      <div
        className="mx-auto max-w-md rounded-sharp p-10 text-center"
        style={{
          border: '1px solid var(--accent)',
          background: 'color-mix(in oklch, var(--accent) 8%, transparent)',
        }}
      >
        <Mono
          className="mb-3 block text-[10px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--accent)' }}
        >
          Already paid
        </Mono>
        <h2
          className="font-display italic font-bold"
          style={{ fontSize: 36, color: 'var(--fg)' }}
        >
          This booking is confirmed.
        </h2>
        <Link
          href={`/bookings/${booking.bookingId}`}
          className="mt-6 inline-flex rounded-sharp px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          View ticket →
        </Link>
      </div>
    );
  }

  const validate = (): string | null => {
    if (method === 'card') {
      if (cardNum.replace(/\s/g, '').length < 12) return 'Enter a valid card number.';
      if (cardName.trim().length < 2) return 'Enter the cardholder name.';
      if (!/^\d{2}\s*\/?\s*\d{2}$/.test(cardExp)) return 'Expiry must be MM/YY.';
      if (cardCvv.length < 3) return 'CVV must be at least 3 digits.';
    }
    if (method === 'upi') {
      if (!/^[\w.\-]+@[\w]+$/.test(upiId)) return 'Enter a valid UPI ID (e.g. you@bank).';
    }
    return null;
  };

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setStage('locking');
    await new Promise((r) => setTimeout(r, 1200));
    setStage('paying');
    await new Promise((r) => setTimeout(r, 1400));
    setStage('confirming');

    const user = getUser();
    if (user) {
      try {
        await confirmBooking(booking.bookingId, user.userId);
      } catch (err: any) {
        setStage('idle');
        setError(
          err?.response?.data?.error ??
            'Could not confirm booking. Your seat lock may have expired.',
        );
        return;
      }
    }

    updateBooking(booking.bookingId, {
      status: 'CONFIRMED',
      paidAt: new Date().toISOString(),
    });
    setStage('done');
    router.push(`/bookings/${booking.bookingId}?paid=1`);
  };

  const idx = stageIdx(stage);

  return (
    <div className="space-y-8 screen-enter">
      <Link
        href={`/movies/${booking.movieId ?? ''}`}
        className="inline-flex items-center font-mono text-[11px] uppercase tracking-[0.15em]"
        style={{
          color: 'var(--fg-soft)',
          opacity: stage === 'idle' ? 1 : 0.4,
          pointerEvents: stage === 'idle' ? 'auto' : 'none',
        }}
      >
        ← Back to seats
      </Link>

      <div>
        <Mono
          className="mb-2 block text-[10px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--fg-faint)' }}
        >
          Step 3 of 3
        </Mono>
        <h1
          className="font-display italic font-bold"
          style={{ fontSize: 56, color: 'var(--fg)', lineHeight: 1 }}
        >
          Payment
        </h1>
      </div>

      <div
        className="grid gap-8"
        style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 380px)' }}
      >
        <div className="space-y-6">
          {/* Method picker */}
          <div>
            <Mono
              className="mb-3 block text-[10px] uppercase tracking-[0.3em]"
              style={{ color: 'var(--fg-faint)' }}
            >
              Payment method
            </Mono>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'upi',    label: 'UPI' },
                { id: 'card',   label: 'Card' },
                { id: 'wallet', label: 'Wallet' },
              ] as { id: Method; label: string }[]).map((m) => {
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    disabled={stage !== 'idle'}
                    className="rounded-sharp border px-4 py-4 font-mono text-xs font-semibold uppercase tracking-[0.15em] disabled:cursor-not-allowed"
                    style={{
                      borderColor: active ? 'var(--accent)' : 'var(--line)',
                      background: active
                        ? 'color-mix(in oklch, var(--accent) 8%, transparent)'
                        : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--fg)',
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={pay}
            className="rounded-sharp p-6"
            style={{
              border: '1px solid var(--line)',
              background: 'var(--card)',
            }}
          >
            {method === 'upi' && (
              <div className="space-y-4">
                <FormField
                  label="UPI ID"
                  value={upiId}
                  onChange={setUpiId}
                  placeholder="yourname@bank"
                />
                <Mono
                  className="block text-[10px]"
                  style={{ color: 'var(--fg-faint)' }}
                >
                  You&apos;ll receive a collect request on your UPI app.
                </Mono>
              </div>
            )}
            {method === 'card' && (
              <div className="space-y-4">
                <FormField
                  label="Card number"
                  value={cardNum}
                  onChange={(v) => {
                    const digits = v.replace(/\D/g, '').slice(0, 16);
                    setCardNum(digits.replace(/(.{4})/g, '$1 ').trim());
                  }}
                  placeholder="•••• •••• •••• ••••"
                  inputMode="numeric"
                />
                <FormField
                  label="Name on card"
                  value={cardName}
                  onChange={setCardName}
                  placeholder="As printed"
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Expiry"
                    value={cardExp}
                    onChange={(v) => {
                      let d = v.replace(/\D/g, '').slice(0, 4);
                      if (d.length > 2) d = d.slice(0, 2) + '/' + d.slice(2);
                      setCardExp(d);
                    }}
                    placeholder="MM / YY"
                    inputMode="numeric"
                  />
                  <FormField
                    label="CVV"
                    value={cardCvv}
                    onChange={(v) => setCardCvv(v.replace(/\D/g, '').slice(0, 4))}
                    placeholder="•••"
                    inputMode="numeric"
                  />
                </div>
              </div>
            )}
            {method === 'wallet' && (
              <div className="grid grid-cols-3 gap-2">
                {['Paytm', 'PhonePe', 'Amazon Pay'].map((w) => (
                  <button
                    key={w}
                    type="button"
                    className="rounded-sharp border px-4 py-5 font-mono text-[11px] uppercase tracking-[0.15em]"
                    style={{
                      borderColor: 'var(--line)',
                      background: 'transparent',
                      color: 'var(--fg)',
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div
                className="mt-4 rounded-sharp px-3 py-2 font-mono text-[11px]"
                style={{
                  border: '1px solid oklch(0.65 0.18 25)',
                  color: 'oklch(0.85 0.15 25)',
                  background: 'color-mix(in oklch, oklch(0.65 0.18 25) 8%, transparent)',
                }}
              >
                {error}
              </div>
            )}

            {/* Saga progress */}
            {stage !== 'idle' && (
              <div
                className="mt-6 rounded-sharp p-5"
                style={{
                  border: '1px solid var(--accent)',
                  background:
                    'color-mix(in oklch, var(--accent) 5%, transparent)',
                }}
              >
                <Mono
                  className="mb-4 block text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: 'var(--accent)' }}
                >
                  Saga in progress
                </Mono>
                <div className="space-y-3">
                  {STAGES.map((s, i) => {
                    const done = i < idx || stage === 'done';
                    const active = i === idx && stage !== 'done';
                    return (
                      <div key={s.key} className="flex items-center gap-3">
                        <span
                          className="flex shrink-0 items-center justify-center"
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            border: `1px solid ${done || active ? 'var(--accent)' : 'var(--line)'}`,
                            background: done ? 'var(--accent)' : 'transparent',
                            fontSize: 9,
                            color: 'var(--bg)',
                          }}
                        >
                          {done ? (
                            '✓'
                          ) : active ? (
                            <span
                              className="animate-pulse-dot"
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: 'var(--accent)',
                              }}
                            />
                          ) : null}
                        </span>
                        <div className="flex flex-1 items-baseline justify-between">
                          <Mono
                            className="text-xs uppercase tracking-[0.15em]"
                            style={{
                              color: done || active ? 'var(--fg)' : 'var(--fg-faint)',
                            }}
                          >
                            {s.label}
                          </Mono>
                          <Mono
                            className="text-[10px]"
                            style={{ color: 'var(--fg-faint)' }}
                          >
                            {s.sub}
                          </Mono>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {stage === 'idle' && (
              <button
                type="submit"
                className="mt-6 w-full rounded-sharp px-4 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.15em] transition-opacity hover:opacity-90"
                style={{ background: 'var(--accent)', color: 'var(--bg)' }}
              >
                Pay ₹{booking.amount.toLocaleString('en-IN')}
              </button>
            )}
          </form>
        </div>

        {/* Order summary */}
        <aside
          className="self-start rounded-sharp p-6"
          style={{
            border: '1px solid var(--line)',
            background: 'var(--card)',
          }}
        >
          <Mono
            className="mb-4 block text-[10px] uppercase tracking-[0.3em]"
            style={{ color: 'var(--fg-faint)' }}
          >
            Summary
          </Mono>
          <div className="mb-5 flex gap-3">
            <div
              className="shrink-0 overflow-hidden rounded-sharp"
              style={{ width: 64, aspectRatio: '2/3' }}
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
            <div className="min-w-0">
              <div
                className="font-display italic font-semibold"
                style={{ fontSize: 18, color: 'var(--fg)', lineHeight: 1.1 }}
              >
                {booking.movieTitle ?? 'Movie'}
              </div>
              <Mono
                className="mt-1 block text-[10px] uppercase tracking-[0.15em]"
                style={{ color: 'var(--fg-faint)' }}
              >
                Showtime · {booking.showtimeId.slice(-8)}
              </Mono>
            </div>
          </div>

          <div
            className="space-y-2 py-4"
            style={{ borderTop: '1px solid var(--line)' }}
          >
            <Mono
              className="block text-[10px] uppercase tracking-[0.2em]"
              style={{ color: 'var(--fg-faint)' }}
            >
              {booking.seatIds.length} seats
            </Mono>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {booking.seatIds.map((id) => (
                <Mono
                  key={id}
                  className="rounded-sharp border px-2 py-1 text-[10px]"
                  style={{ borderColor: 'var(--line)', color: 'var(--fg)' }}
                >
                  {id}
                </Mono>
              ))}
            </div>
          </div>

          <div
            className="space-y-2 py-4 text-sm"
            style={{ borderTop: '1px solid var(--line)' }}
          >
            <div className="flex justify-between" style={{ color: 'var(--fg-soft)' }}>
              <span>Subtotal</span>
              <Mono>₹{subtotal.toLocaleString('en-IN')}</Mono>
            </div>
            <div className="flex justify-between" style={{ color: 'var(--fg-faint)' }}>
              <span>Fees</span>
              <Mono>₹{fees.toLocaleString('en-IN')}</Mono>
            </div>
          </div>

          <div
            className="flex items-baseline justify-between py-4"
            style={{ borderTop: '1px solid var(--line)' }}
          >
            <Mono
              className="text-[10px] uppercase tracking-[0.3em]"
              style={{ color: 'var(--fg-faint)' }}
            >
              Total
            </Mono>
            <Mono style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg)' }}>
              ₹{booking.amount.toLocaleString('en-IN')}
            </Mono>
          </div>
        </aside>
      </div>
    </div>
  );
}
