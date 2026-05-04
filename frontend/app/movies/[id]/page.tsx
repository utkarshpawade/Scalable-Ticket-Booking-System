'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SeatMap, { type Seat } from '@/components/SeatMap';
import CheckoutPanel from '@/components/CheckoutPanel';
import { getMovie, type Movie } from '@/lib/api';
import { findMockMovie } from '@/lib/mockData';

interface MovieDetail {
  movie: Movie;
  showtimes: Array<{
    _id: string;
    startsAt: string;
    format?: string;
    language?: string;
    basePrice?: number;
  }>;
}

// Fallback used when catalog service is unreachable.
const mockDetail = (id: string): MovieDetail => {
  const movie =
    findMockMovie(id) ?? {
      _id: id,
      title: 'Quantum Drift',
      genres: ['Sci-Fi', 'Action'],
      durationMin: 142,
      rating: 8.4,
      posterUrl: 'https://picsum.photos/seed/quantum/600/900',
      description:
        'When a deep-space navigator discovers a tear in the fabric of time, she must race across colliding timelines to save her crew — and herself.',
      releaseDate: new Date().toISOString(),
    };
  return {
    movie,
    showtimes: [
      { _id: `showtime-${id}-1`, startsAt: new Date(Date.now() + 3 * 3600_000).toISOString(), format: 'IMAX', language: 'English', basePrice: 350 },
      { _id: `showtime-${id}-2`, startsAt: new Date(Date.now() + 6 * 3600_000).toISOString(), format: '2D',   language: 'English', basePrice: 250 },
      { _id: `showtime-${id}-3`, startsAt: new Date(Date.now() + 9 * 3600_000).toISOString(), format: '3D',   language: 'English', basePrice: 320 },
    ],
  };
};

export default function MovieDetailPage({ params }: { params: { id: string } }) {
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromMock, setFromMock] = useState(false);
  const [activeShowtimeId, setActiveShowtimeId] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = (await getMovie(params.id)) as MovieDetail;
        if (cancelled) return;
        if (!data?.movie) throw new Error('empty');
        setDetail(data);
        setActiveShowtimeId(data.showtimes?.[0]?._id ?? `showtime-${params.id}-1`);
        setFromMock(false);
      } catch {
        if (cancelled) return;
        const m = mockDetail(params.id);
        setDetail(m);
        setActiveShowtimeId(m.showtimes[0]._id);
        setFromMock(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [params.id]);

  // Reset seat selection whenever the user switches showtimes.
  useEffect(() => {
    setSelectedSeats([]);
  }, [activeShowtimeId]);

  if (loading || !detail || !activeShowtimeId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-brand-500" />
      </div>
    );
  }

  const { movie, showtimes } = detail;

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-400">
        <Link href="/" className="hover:text-white">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{movie.title}</span>
      </nav>

      {fromMock && (
        <div className="rounded-md border border-slate-700/40 bg-slate-800/30 px-4 py-2 text-xs text-slate-400">
          🎭 Demo mode — showing sample movie data. Booking flow below works end-to-end.
        </div>
      )}

      {/* Hero */}
      <section className="grid gap-8 md:grid-cols-[220px_1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-800">
          {movie.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center text-5xl">🎞️</div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {movie.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            {(movie.genres ?? []).map((g) => (
              <span
                key={g}
                className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300"
              >
                {g}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-300">
            {typeof movie.rating === 'number' && (
              <span>⭐ <strong className="text-white">{movie.rating.toFixed(1)}</strong>/10</span>
            )}
            {movie.durationMin && <span>⏱ {movie.durationMin} min</span>}
            {movie.releaseDate && (
              <span>📅 {new Date(movie.releaseDate).toLocaleDateString()}</span>
            )}
          </div>

          {movie.description && (
            <p className="max-w-2xl text-slate-300">{movie.description}</p>
          )}

          {/* Showtime picker */}
          <div className="mt-2">
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
              Choose a showtime
            </p>
            <div className="flex flex-wrap gap-2">
              {showtimes.map((st) => {
                const active = st._id === activeShowtimeId;
                const when = new Date(st.startsAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <button
                    key={st._id}
                    onClick={() => setActiveShowtimeId(st._id)}
                    className={`rounded-md border px-4 py-2 text-sm transition ${
                      active
                        ? 'border-brand-500 bg-brand-600/20 text-white'
                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span className="font-medium">{when}</span>
                    {st.format && (
                      <span className="ml-2 text-xs text-slate-400">{st.format}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Seat map + checkout */}
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <SeatMap
          movieId={movie._id}
          showtimeId={activeShowtimeId}
          onSelectionChange={setSelectedSeats}
        />
        <CheckoutPanel
          showtimeId={activeShowtimeId}
          movieId={movie._id}
          movieTitle={movie.title}
          posterUrl={movie.posterUrl}
          selectedSeats={selectedSeats}
        />
      </section>
    </div>
  );
}
