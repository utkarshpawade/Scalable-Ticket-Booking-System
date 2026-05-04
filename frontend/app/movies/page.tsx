'use client';

import { useEffect, useMemo, useState } from 'react';
import MovieCard from '@/components/MovieCard';
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
        /* fall back to mocks */
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
      <header className="space-y-3">
        <h1 className="font-display text-4xl font-bold text-white md:text-5xl">
          All <span className="gradient-text">Movies</span>
        </h1>
        <p className="text-slate-400">
          Browse the full catalog and grab seats for tonight.
        </p>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search by title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500 md:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                g === genre
                  ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg shadow-brand-500/25'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:bg-white/10 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {fromMock && !loading && (
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 px-4 py-2.5 text-xs text-slate-400">
          Demo mode — showing sample catalog. Boot the catalog service to see live data.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-16 text-center text-slate-400">
          No movies match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((m, i) => (
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
      )}
    </div>
  );
}
