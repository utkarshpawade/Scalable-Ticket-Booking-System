'use client';

import { useEffect, useMemo, useState } from 'react';
import MovieCard from '@/components/MovieCard';
import { Mono, Pill } from '@/components/ui';
import { getMovies, type Movie } from '@/lib/api';
import { MOCK_MOVIES, GENRES } from '@/lib/mockData';

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>(MOCK_MOVIES);
  const [loading, setLoading] = useState(true);
  const [fromMock, setFromMock] = useState(true);
  const [genre, setGenre] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMovies({ limit: 50 });
        if (cancelled) return;
        if (data.items?.length) {
          setMovies(data.items);
          setFromMock(false);
        }
      } catch {
        /* keep mocks */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movies.filter((m) => {
      const inGenre = genre === 'All' || (m.genres ?? []).includes(genre);
      const inQuery = !q || m.title.toLowerCase().includes(q);
      return inGenre && inQuery;
    });
  }, [movies, genre, query]);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <Mono
          className="text-[10px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--fg-faint)' }}
        >
          The complete catalogue
        </Mono>
        <h1
          className="font-display italic font-bold"
          style={{
            fontSize: 'clamp(40px, 5vw, 64px)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: 'var(--fg)',
          }}
        >
          All films
        </h1>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search by title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-sharp border px-3 py-2.5 font-mono text-sm outline-none transition-colors md:max-w-sm"
          style={{
            borderColor: 'var(--line)',
            background: 'transparent',
            color: 'var(--fg)',
          }}
        />
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <Pill key={g} active={g === genre} onClick={() => setGenre(g)}>
              {g}
            </Pill>
          ))}
        </div>
      </div>

      {fromMock && !loading && (
        <div
          className="rounded-sharp px-4 py-2.5 font-mono text-[11px]"
          style={{
            border: '1px solid var(--line)',
            color: 'var(--fg-faint)',
            background: 'var(--bg-soft)',
          }}
        >
          Demo mode — showing sample catalog. Boot the catalog service to see live data.
        </div>
      )}

      <div className="flex items-baseline justify-between">
        <Mono
          className="text-[10px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--fg-faint)' }}
        >
          {filtered.length} titles
        </Mono>
        <Mono
          className="text-[10px] uppercase tracking-[0.2em]"
          style={{ color: 'var(--fg-faint)' }}
        >
          {genre}
        </Mono>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-sharp p-16 text-center font-mono text-sm"
          style={{
            border: '1px solid var(--line)',
            color: 'var(--fg-faint)',
          }}
        >
          No films match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
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
        </div>
      )}
    </div>
  );
}
