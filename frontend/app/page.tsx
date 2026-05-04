import MovieCard from '@/components/MovieCard';
import { getMovies, type Movie } from '@/lib/api';
import { MOCK_MOVIES, GENRES } from '@/lib/mockData';

async function fetchMoviesSafe(): Promise<{ items: Movie[]; fromMock: boolean }> {
  try {
    const data = await getMovies({ limit: 12 });
    if (!data.items?.length) return { items: MOCK_MOVIES, fromMock: true };
    return { items: data.items, fromMock: false };
  } catch {
    return { items: MOCK_MOVIES, fromMock: true };
  }
}

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { items, fromMock } = await fetchMoviesSafe();
  const featured = items[0];
  const trending = items.slice(1, 6);
  const rest = items;

  return (
    <div className="space-y-20">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden rounded-3xl">
        {/* Background image */}
        <div className="absolute inset-0">
          {featured?.posterUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featured.posterUrl}
              alt=""
              aria-hidden
              className="h-full w-full object-cover opacity-30 blur-sm"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
        </div>

        {/* Animated blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-brand-500/30 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative grid gap-10 px-8 py-16 md:grid-cols-[1.2fr_1fr] md:px-14 md:py-20">
          <div className="fade-up max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-200 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Now Booking · Live Seats
            </span>

            <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] text-white md:text-6xl">
              Your next favorite<br />
              film, <span className="gradient-text">one tap away.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
              Pick your perfect seat, watch it lock instantly for everyone else,
              and pay with confidence. Powered by a distributed saga and
              Redis Redlock — so you never get double-booked.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#movies"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:shadow-brand-500/60 hover:brightness-110"
              >
                Browse Movies
                <span className="transition group-hover:translate-x-1">→</span>
              </a>
              <a
                href="/bookings"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 backdrop-blur transition hover:border-white/30 hover:bg-white/10"
              >
                My Bookings
              </a>
            </div>

            {/* Stats */}
            <div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                { v: '2.4M+', l: 'Tickets booked' },
                { v: '1,200', l: 'Theaters' },
                { v: '0',     l: 'Double-bookings' },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-2xl font-bold text-white">{s.v}</div>
                  <div className="text-xs uppercase tracking-wider text-slate-400">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured poster */}
          {featured && (
            <div className="fade-up hidden md:block" style={{ animationDelay: '0.15s' }}>
              <div className="relative mx-auto max-w-xs">
                <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-brand-500/30 via-purple-500/20 to-pink-500/30 blur-2xl" />
                <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-brand-500/20 animate-float">
                  {featured.posterUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featured.posterUrl} alt={featured.title} className="h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5">
                    <div className="text-xs uppercase tracking-widest text-brand-300">Featured</div>
                    <div className="mt-1 font-display text-xl font-bold text-white">{featured.title}</div>
                    <div className="mt-0.5 text-xs text-slate-300">
                      {(featured.genres ?? []).slice(0, 2).join(' · ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {fromMock && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-700/40 bg-slate-800/30 px-4 py-2.5 text-xs text-slate-400 backdrop-blur">
          <span>🎭</span>
          <span>
            Demo mode — showing sample catalog. Boot the catalog service to see live titles.
          </span>
        </div>
      )}

      {/* ---------- Genre pills ---------- */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs uppercase tracking-widest text-slate-400">Browse by genre</span>
          {GENRES.map((g, i) => (
            <button
              key={g}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                i === 0
                  ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg shadow-brand-500/25'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:bg-white/10 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* ---------- Trending strip ---------- */}
      {trending.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-white md:text-3xl">🔥 Trending this week</h2>
              <p className="mt-1 text-sm text-slate-400">The films everyone's booking right now.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {trending.map((m, i) => (
              <div key={m._id} className="fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                <MovieCard
                  id={m._id}
                  title={m.title}
                  genres={m.genres ?? []}
                  rating={m.rating}
                  durationMin={m.durationMin}
                  posterUrl={m.posterUrl}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Full grid ---------- */}
      <section id="movies" className="space-y-5">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">🎬 Now Showing</h2>
            <p className="mt-1 text-sm text-slate-400">Pick a film and grab your seats.</p>
          </div>
          <a href="#" className="text-sm font-medium text-brand-400 hover:text-brand-300">
            View all →
          </a>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {rest.map((m, i) => (
            <div key={m._id} className="fade-up" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
              <MovieCard
                id={m._id}
                title={m.title}
                genres={m.genres ?? []}
                rating={m.rating}
                durationMin={m.durationMin}
                posterUrl={m.posterUrl}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Feature band ---------- */}
      <section className="grid gap-5 md:grid-cols-3">
        {[
          { icon: '⚡', title: 'Real-time seats',      desc: 'Watch seats lock live across every device. No stale grids, ever.' },
          { icon: '🔒', title: 'No double-bookings',    desc: 'Redlock + Saga orchestration guarantees exactly one winner per seat.' },
          { icon: '💳', title: 'Safe rollbacks',        desc: 'If payment fails, your lock is auto-released. No ghost holds.' },
        ].map((f) => (
          <div
            key={f.title}
            className="glass group rounded-2xl p-6 transition hover:-translate-y-1 hover:border-white/20"
          >
            <div className="mb-3 text-3xl transition group-hover:scale-110">{f.icon}</div>
            <h3 className="font-display text-lg font-semibold text-white">{f.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
