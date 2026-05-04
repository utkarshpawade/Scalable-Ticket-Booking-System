'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { setUser } from '@/lib/localStore';

function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setUser({
        userId: 'user_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: name.trim(),
        email,
      });
      router.push(next);
    }, 500);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/40 p-8 shadow-2xl">
        <h1 className="font-display text-3xl font-bold text-white">
          Get <span className="gradient-text">started</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Create an account to book seats, save favorites, and track tickets.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              placeholder="Alex Morgan"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href={`/signin${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-brand-300 hover:text-brand-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
