import type { Metadata } from 'next';
import Link from 'next/link';
import NavAuth from '@/components/NavAuth';
import TopMarquee from '@/components/TopMarquee';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reel Room — Ticket Booking',
  description: 'Pick seats live. Pay securely. Zero double-bookings.',
};

const NAV_LINKS = [
  { href: '/movies',   label: 'Films' },
  { href: '/theaters', label: 'Theaters' },
  { href: '/bookings', label: 'Bookings' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body data-theme="dark">
        <TopMarquee />

        {/* ---------- Nav ---------- */}
        <header
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          <Link href="/" className="flex items-baseline gap-3">
            <span
              className="font-display italic font-bold"
              style={{ fontSize: 26, color: 'var(--fg)', letterSpacing: '-0.02em' }}
            >
              Reel Room
            </span>
            <span
              className="hidden font-mono text-[10px] uppercase tracking-[0.3em] sm:inline"
              style={{ color: 'var(--fg-faint)' }}
            >
              est. 2026
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors"
                style={{
                  color: 'var(--fg-soft)',
                  borderBottom: '1px solid transparent',
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <NavAuth />
        </header>

        {/* ---------- Main ---------- */}
        <main
          className="mx-auto px-6 pb-20 pt-12"
          style={{ maxWidth: 1280 }}
        >
          {children}
        </main>

        {/* ---------- Footer ---------- */}
        <footer
          className="mt-12 px-6 py-8"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <div
            className="mx-auto flex items-center justify-between gap-4"
            style={{ maxWidth: 1280 }}
          >
            <span
              className="font-mono text-[10px] uppercase tracking-[0.3em]"
              style={{ color: 'var(--fg-faint)' }}
            >
              Reel Room · A scalable booking platform
            </span>
            <span
              className="hidden font-mono text-[10px] uppercase tracking-[0.3em] sm:inline"
              style={{ color: 'var(--fg-faint)' }}
            >
              Saga · Redlock · Socket.io
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
