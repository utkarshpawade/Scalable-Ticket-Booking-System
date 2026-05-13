import Link from 'next/link';
import MovieCard from '@/components/MovieCard';
import { Divider, Mono, Poster, Tag } from '@/components/ui';
import { getMovies, type Movie } from '@/lib/api';
import { MOCK_MOVIES } from '@/lib/mockData';

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
  const trending = items.slice(1, 5);
  const all = items;

  return (
    <div className="space-y-12">
      {/* ---------- Editorial hero ---------- */}
      <section
        className="relative overflow-hidden rounded-sharp"
        style={{ border: '1px solid var(--line)' }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
            minHeight: 480,
          }}
        >
          <div className="flex flex-col justify-between p-10">
            <div className="flex items-center justify-between">
              <Mono
                className="text-[10px] uppercase tracking-[0.3em]"
                style={{ color: 'var(--fg-faint)' }}
              >
                Feature presentation · Vol. 47
              </Mono>
              <Mono
                className="text-[10px] uppercase tracking-[0.3em]"
                style={{ color: 'var(--accent)' }}
              >
                Now booking
              </Mono>
            </div>

            <div>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {(featured?.genres ?? []).slice(0, 2).map((g) => (
                  <Tag key={g}>{g}</Tag>
                ))}
                <Tag accent>IMAX</Tag>
              </div>
              <h1
                className="mb-4 font-display italic font-bold"
                style={{
                  fontSize: 'clamp(48px, 6vw, 88px)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.02em',
                  color: 'var(--fg)',
                }}
              >
                {featured?.title ?? 'Now showing'}
              </h1>
              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.5,
                  color: 'var(--fg-soft)',
                  maxWidth: '52ch',
                }}
              >
                {featured?.description ??
                  'Pick your perfect seat, watch it lock instantly for everyone else, and pay with confidence — powered by a distributed saga and Redis Redlock.'}
              </p>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex flex-wrap gap-8">
                <div>
                  <Mono
                    className="text-[10px] uppercase tracking-[0.2em]"
                    style={{ color: 'var(--fg-faint)' }}
                  >
                    Runtime
                  </Mono>
                  <Mono
                    className="mt-1 block text-sm"
                    style={{ color: 'var(--fg)' }}
                  >
                    {featured?.durationMin
                      ? `${Math.floor(featured.durationMin / 60)}h ${featured.durationMin % 60}m`
                      : '—'}
                  </Mono>
                </div>
                <div>
                  <Mono
                    className="text-[10px] uppercase tracking-[0.2em]"
                    style={{ color: 'var(--fg-faint)' }}
                  >
                    Rating
                  </Mono>
                  <Mono
                    className="mt-1 block text-sm"
                    style={{ color: 'var(--accent)' }}
                  >
                    ★ {featured?.rating?.toFixed(1) ?? '—'}
                  </Mono>
                </div>
                <div>
                  <Mono
                    className="text-[10px] uppercase tracking-[0.2em]"
                    style={{ color: 'var(--fg-faint)' }}
                  >
                    Genres
                  </Mono>
                  <Mono
                    className="mt-1 block text-sm"
                    style={{ color: 'var(--fg)' }}
                  >
                    {(featured?.genres ?? []).slice(0, 2).join(' · ') || '—'}
                  </Mono>
                </div>
              </div>
              {featured && (
                <Link
                  href={`/movies/${featured._id}`}
                  className="rounded-sharp px-7 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.15em] transition-opacity hover:opacity-90"
                  style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                >
                  Reserve seats →
                </Link>
              )}
            </div>
          </div>

          {featured && (
            <div className="relative hidden md:block">
              <Poster
                movie={{
                  id: featured._id,
                  title: featured.title,
                  genres: featured.genres ?? [],
                  posterUrl: featured.posterUrl,
                }}
                className="absolute inset-0"
                big
              />
            </div>
          )}
        </div>
      </section>

      {fromMock && (
        <div
          className="rounded-sharp px-4 py-2.5 font-mono text-[11px] tracking-[0.05em]"
          style={{
            border: '1px solid var(--line)',
            color: 'var(--fg-faint)',
            background: 'var(--bg-soft)',
          }}
        >
          Demo mode — showing sample catalog. Boot the catalog service to see live titles.
        </div>
      )}

      {/* ---------- Trending ---------- */}
      {trending.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-baseline justify-between">
            <h2
              className="font-display italic font-semibold"
              style={{ fontSize: 32, color: 'var(--fg)' }}
            >
              Trending this week
            </h2>
            <Mono
              className="hidden text-[10px] uppercase tracking-[0.3em] sm:inline"
              style={{ color: 'var(--fg-faint)' }}
            >
              By bookings · last 7 days
            </Mono>
          </div>

          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {trending.map((m, i) => (
              <Link
                key={m._id}
                href={`/movies/${m._id}`}
                className="group block text-left"
              >
                <div
                  className="relative overflow-hidden rounded-sharp"
                  style={{ aspectRatio: '2/3' }}
                >
                  <Poster
                    movie={{
                      id: m._id,
                      title: m.title,
                      genres: m.genres ?? [],
                      posterUrl: m.posterUrl,
                    }}
                    className="absolute inset-0"
                  />
                  <div
                    className="absolute left-3 top-3 font-display italic font-bold"
                    style={{
                      fontSize: 40,
                      lineHeight: 0.8,
                      color: 'var(--accent)',
                      opacity: 0.9,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <div
                    className="truncate font-display italic font-semibold"
                    style={{ fontSize: 18, color: 'var(--fg)' }}
                  >
                    {m.title}
                  </div>
                  {typeof m.rating === 'number' && (
                    <Mono
                      className="shrink-0 text-xs"
                      style={{ color: 'var(--accent)' }}
                    >
                      ★ {m.rating.toFixed(1)}
                    </Mono>
                  )}
                </div>
                <Mono
                  className="mt-1 block text-[10px] uppercase tracking-[0.15em]"
                  style={{ color: 'var(--fg-faint)' }}
                >
                  {(m.genres ?? []).slice(0, 2).join(' · ')}
                  {m.durationMin
                    ? ` · ${Math.floor(m.durationMin / 60)}h${m.durationMin % 60}m`
                    : ''}
                </Mono>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Divider label="Now showing" />

      {/* ---------- Full grid ---------- */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {all.map((m) => (
          <MovieCard
            key={m._id}
            id={m._id}
            title={m.title}
            genres={m.genres ?? []}
            rating={m.rating}
            durationMin={m.durationMin}
            posterUrl={m.posterUrl}
          />
        ))}
      </section>
    </div>
  );
}
