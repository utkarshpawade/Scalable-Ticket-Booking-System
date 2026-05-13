'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Mono } from '@/components/ui';
import { setUser, setAuthToken } from '@/lib/localStore';
import { signUp } from '@/lib/api';

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
    try {
      const { token, user } = await signUp({
        name: name.trim(),
        email,
        password,
      });
      setAuthToken(token);
      setUser({ userId: user.userId, name: user.name, email: user.email });
      router.push(next);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Sign up failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md screen-enter">
      <div
        className="rounded-sharp p-8"
        style={{ border: '1px solid var(--line)', background: 'var(--card)' }}
      >
        <Mono
          className="mb-3 block text-[10px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--accent)' }}
        >
          Get started
        </Mono>
        <h1
          className="font-display italic font-bold"
          style={{
            fontSize: 'clamp(36px, 4vw, 48px)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: 'var(--fg)',
          }}
        >
          Create account
        </h1>
        <p
          className="mt-3 text-sm leading-relaxed"
          style={{ color: 'var(--fg-soft)' }}
        >
          Book seats, save favorites, and track tickets.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <Mono
              className="mb-1.5 block text-[10px] uppercase tracking-[0.2em]"
              style={{ color: 'var(--fg-faint)' }}
            >
              Full name
            </Mono>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              placeholder="Alex Morgan"
              className="w-full rounded-sharp border px-3 py-2.5 font-mono text-sm outline-none"
              style={{
                borderColor: 'var(--line)',
                background: 'transparent',
                color: 'var(--fg)',
              }}
            />
          </div>
          <div>
            <Mono
              className="mb-1.5 block text-[10px] uppercase tracking-[0.2em]"
              style={{ color: 'var(--fg-faint)' }}
            >
              Email
            </Mono>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-sharp border px-3 py-2.5 font-mono text-sm outline-none"
              style={{
                borderColor: 'var(--line)',
                background: 'transparent',
                color: 'var(--fg)',
              }}
            />
          </div>
          <div>
            <Mono
              className="mb-1.5 block text-[10px] uppercase tracking-[0.2em]"
              style={{ color: 'var(--fg-faint)' }}
            >
              Password
            </Mono>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              placeholder="At least 6 characters"
              className="w-full rounded-sharp border px-3 py-2.5 font-mono text-sm outline-none"
              style={{
                borderColor: 'var(--line)',
                background: 'transparent',
                color: 'var(--fg)',
              }}
            />
          </div>

          {error && (
            <div
              className="rounded-sharp px-3 py-2 font-mono text-[11px]"
              style={{
                border: '1px solid oklch(0.65 0.18 25)',
                color: 'oklch(0.85 0.15 25)',
                background:
                  'color-mix(in oklch, oklch(0.65 0.18 25) 8%, transparent)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-sharp px-4 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.15em] disabled:cursor-not-allowed disabled:opacity-70"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            {loading ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2"
                style={{
                  borderColor: 'color-mix(in oklch, var(--bg) 40%, transparent)',
                  borderTopColor: 'var(--bg)',
                }}
              />
            ) : (
              'Create account →'
            )}
          </button>
        </form>

        <p
          className="mt-6 text-center font-mono text-[11px]"
          style={{ color: 'var(--fg-soft)' }}
        >
          Already have an account?{' '}
          <Link
            href={`/signin${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
            style={{ color: 'var(--accent)' }}
          >
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
