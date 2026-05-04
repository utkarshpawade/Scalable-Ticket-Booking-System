'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { setUser } from '@/lib/localStore';

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    // Demo auth: accept any non-empty credentials and persist locally.
    // Real backend integration would call POST /users/login here.
    setTimeout(() => {
      const name = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || 'Friend';
      setUser({
        userId: 'user_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email,
      });
      router.push(next);
    }, 400);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/40 p-8 shadow-2xl">
        <h1 className="font-display text-3xl font-bold text-white">
          Welcome <span className="gradient-text">back</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to view your bookings and pick up where you left off.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
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
              autoComplete="current-password"
              required
              placeholder="••••••••"
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
              'Sign in'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href={`/signup${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-brand-300 hover:text-brand-200">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
