'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  getBooking,
  updateBooking,
  type LocalBooking,
} from '@/lib/localStore';

type Method = 'card' | 'upi' | 'netbanking';

export default function PaymentPage({ params }: { params: { bookingId: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<LocalBooking | null | undefined>(undefined);
  const [method, setMethod] = useState<Method>('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // UPI
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    const sync = () => setBooking(getBooking(params.bookingId) ?? null);
    sync();
    window.addEventListener('cinebook:bookings', sync);
    return () => window.removeEventListener('cinebook:bookings', sync);
  }, [params.bookingId]);

  const fees = useMemo(() => {
    if (!booking) return 0;
    return Math.round(booking.amount * 0.05 * 100) / 100;
  }, [booking]);

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
          We couldn&apos;t find that booking. It may have expired or been cancelled.
        </p>
        <Link
          href="/movies"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110"
        >
          Browse movies
        </Link>
      </div>
    );
  }

  if (booking.status === 'CONFIRMED') {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-10 text-center">
        <div className="text-5xl">✅</div>
        <h2 className="mt-3 font-display text-2xl font-bold text-white">
          Already paid
        </h2>
        <p className="mt-1 text-sm text-emerald-100">
          This booking is confirmed.
        </p>
        <Link
          href={`/bookings/${booking.bookingId}`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110"
        >
          View ticket →
        </Link>
      </div>
    );
  }

  const validate = (): string | null => {
    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 12) return 'Enter a valid card number.';
      if (cardName.trim().length < 2) return 'Enter the cardholder name.';
      if (!/^\d{2}\/\d{2}$/.test(expiry)) return 'Expiry must be MM/YY.';
      if (cvv.length < 3) return 'CVV must be at least 3 digits.';
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
    setProcessing(true);
    // Simulated payment gateway round-trip.
    await new Promise((r) => setTimeout(r, 1400));
    updateBooking(booking.bookingId, {
      status: 'CONFIRMED',
      paidAt: new Date().toISOString(),
    });
    router.push(`/bookings/${booking.bookingId}?paid=1`);
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
            Complete <span className="gradient-text">payment</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Your seats are locked while you finish checkout.
          </p>
        </header>

        <div className="flex gap-2">
          {([
            { id: 'card',       label: 'Card',        icon: '💳' },
            { id: 'upi',        label: 'UPI',         icon: '📱' },
            { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
          ] as { id: Method; label: string; icon: string }[]).map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                method === m.id
                  ? 'border-brand-500 bg-brand-600/15 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white'
              }`}
            >
              <span>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={pay}
          className="space-y-4 rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/40 p-6"
        >
          {method === 'card' && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Card number
                </label>
                <input
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                    setCardNumber(digits.replace(/(.{4})/g, '$1 ').trim());
                  }}
                  placeholder="4242 4242 4242 4242"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm tracking-wider text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Cardholder name
                </label>
                <input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="As it appears on the card"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Expiry (MM/YY)
                  </label>
                  <input
                    inputMode="numeric"
                    value={expiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                      setExpiry(v);
                    }}
                    placeholder="08/27"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    CVV
                  </label>
                  <input
                    inputMode="numeric"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
                  />
                </div>
              </div>
            </>
          )}

          {method === 'upi' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                UPI ID
              </label>
              <input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="you@bank"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
              />
              <p className="mt-2 text-xs text-slate-500">
                A request will be sent to your UPI app.
              </p>
            </div>
          )}

          {method === 'netbanking' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Choose your bank
              </label>
              <select className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-brand-500">
                <option>HDFC Bank</option>
                <option>ICICI Bank</option>
                <option>State Bank of India</option>
                <option>Axis Bank</option>
                <option>Kotak Mahindra Bank</option>
              </select>
              <p className="mt-2 text-xs text-slate-500">
                You will be redirected to your bank&apos;s portal to complete payment.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={processing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {processing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Processing payment…
              </>
            ) : (
              <>Pay ${booking.amount.toFixed(2)} →</>
            )}
          </button>

          <p className="text-center text-[11px] text-slate-500">
            🔒 Payments are processed securely. This is a demo gateway — no real charges occur.
          </p>
        </form>
      </div>

      {/* Sidebar: order summary */}
      <aside className="sticky top-24 h-fit rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/40 p-6">
        <h3 className="font-display text-lg font-semibold text-white">Order summary</h3>
        {booking.movieTitle && (
          <p className="mt-1 text-sm text-slate-400">{booking.movieTitle}</p>
        )}

        <div className="mt-4 flex items-start gap-3">
          {booking.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={booking.posterUrl} alt="" className="h-20 w-14 rounded-lg object-cover" />
          ) : (
            <div className="flex h-20 w-14 items-center justify-center rounded-lg bg-slate-800 text-2xl">🎞️</div>
          )}
          <div className="text-sm">
            <p className="text-slate-400">Showtime</p>
            <p className="text-slate-200">{booking.showtimeId}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Seats ({booking.seatIds.length})
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {booking.seatIds.map((id) => (
              <span
                key={id}
                className="rounded-full border border-brand-500/40 bg-brand-600/20 px-3 py-1 text-xs font-semibold text-brand-100"
              >
                {id}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>${(booking.amount - fees).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Service fee</span>
            <span>${fees.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white">
            <span>Total</span>
            <span>${booking.amount.toFixed(2)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
