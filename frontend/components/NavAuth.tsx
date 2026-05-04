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
      <div className="flex items-center gap-3">
        <Link
          href="/signin"
          className="hidden rounded-lg border border-slate-700/70 bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 sm:block"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="relative rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:shadow-brand-500/50 hover:brightness-110"
        >
          Get Started
        </Link>
      </div>
    );
  }

  const initial = user.name?.[0]?.toUpperCase() ?? user.email[0]?.toUpperCase() ?? '?';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/50 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-xs font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[120px] truncate sm:block">{user.name || user.email}</span>
        <span className="text-slate-400">▾</span>
      </button>

      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur"
        >
          <div className="border-b border-white/5 px-4 py-3">
            <p className="text-sm font-semibold text-white">{user.name || 'Account'}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <Link
            href="/bookings"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5"
          >
            My Bookings
          </Link>
          <button
            onClick={() => {
              setUser(null);
              setOpen(false);
              router.push('/');
            }}
            className="block w-full border-t border-white/5 px-4 py-2.5 text-left text-sm text-rose-300 hover:bg-rose-500/10"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
