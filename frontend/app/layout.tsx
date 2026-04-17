import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'CineBook — Real-time Movie Ticket Booking',
  description: 'Pick seats live. Pay securely. Zero double-bookings.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {/* ---------- Navigation ---------- */}
        <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-purple-500 to-pink-500 text-lg shadow-lg shadow-brand-500/30 transition group-hover:scale-110 group-hover:rotate-3">
                <span className="text-white">🎬</span>
                <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 opacity-0 blur-md transition group-hover:opacity-60" />
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                Cine<span className="gradient-text">Book</span>
              </span>
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              {[
                { href: '/',         label: 'Home' },
                { href: '/movies',   label: 'Movies' },
                { href: '/theaters', label: 'Theaters' },
                { href: '/bookings', label: 'My Bookings' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="relative text-sm font-medium text-slate-300 transition hover:text-white"
                >
                  {l.label}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-brand-400 to-purple-400 transition-all hover:w-full" />
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button className="hidden rounded-lg border border-slate-700/70 bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 sm:block">
                Sign In
              </button>
              <button className="relative rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:shadow-brand-500/50 hover:brightness-110">
                Get Started
              </button>
            </div>
          </nav>
        </header>

        {/* ---------- Main ---------- */}
        <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>

        {/* ---------- Footer ---------- */}
        <footer className="mt-20 border-t border-white/5">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4">
            <div>
              <div className="font-display text-lg font-bold text-white">
                Cine<span className="gradient-text">Book</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Real-time seat selection, powered by a distributed saga and Redis Redlock.
              </p>
            </div>
            {[
              { t: 'Product',  items: ['Movies', 'Theaters', 'Gift Cards', 'Promotions'] },
              { t: 'Company',  items: ['About', 'Careers', 'Press', 'Contact'] },
              { t: 'Legal',    items: ['Privacy', 'Terms', 'Refunds', 'Cookies'] },
            ].map((col) => (
              <div key={col.t}>
                <h4 className="text-sm font-semibold text-white">{col.t}</h4>
                <ul className="mt-3 space-y-2 text-sm text-slate-400">
                  {col.items.map((i) => (
                    <li key={i}>
                      <Link href="#" className="hover:text-white">
                        {i}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 py-5 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} CineBook · Built on a scalable microservices architecture
          </div>
        </footer>
      </body>
    </html>
  );
}
