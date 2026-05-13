'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, setUser, type AuthUser } from '@/lib/localStore';

export default function NavAuth() {
  const router = useRouter();
  const [user, setLocalUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setLocalUser(getUser());
    sync();
    window.addEventListener('cinebook:auth', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cinebook:auth', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/signin"
          className="hidden px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.15em] sm:inline-block"
          style={{ color: 'var(--fg-soft)' }}
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-sharp px-3.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          Get started
        </Link>
      </div>
    );
  }

  const initial = user.name?.[0]?.toUpperCase() ?? user.email[0]?.toUpperCase() ?? '?';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-sharp border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors"
        style={{
          borderColor: 'var(--line)',
          color: 'var(--fg-soft)',
          background: 'transparent',
        }}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          {initial}
        </span>
        <span className="hidden max-w-[120px] truncate sm:block">
          {user.name || user.email}
        </span>
        <span style={{ color: 'var(--fg-faint)' }}>▾</span>
      </button>

      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-sharp border shadow-2xl"
          style={{
            borderColor: 'var(--line)',
            background: 'var(--card)',
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
            <p className="text-sm" style={{ color: 'var(--fg)' }}>
              {user.name || 'Account'}
            </p>
            <p
              className="mt-0.5 truncate font-mono text-[11px]"
              style={{ color: 'var(--fg-faint)' }}
            >
              {user.email}
            </p>
          </div>
          <Link
            href="/bookings"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors hover:opacity-80"
            style={{ color: 'var(--fg-soft)' }}
          >
            My bookings
          </Link>
          <button
            onClick={() => {
              setUser(null);
              setOpen(false);
              router.push('/');
            }}
            className="block w-full px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.15em] transition-opacity hover:opacity-80"
            style={{
              borderTop: '1px solid var(--line)',
              color: 'var(--accent)',
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
