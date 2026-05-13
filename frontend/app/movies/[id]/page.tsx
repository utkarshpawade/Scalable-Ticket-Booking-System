'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SeatMap, { type Seat } from '@/components/SeatMap';
import CheckoutPanel from '@/components/CheckoutPanel';
import { Divider, Mono, Poster, Tag } from '@/components/ui';
import { getMovie, type Movie } from '@/lib/api';
import { findMockMovie } from '@/lib/mockData';

interface Showtime {
  _id: string;
  startsAt: string;
  format?: string;
  language?: string;
  basePrice?: number;
}

interface MovieDetail {
  movie: Movie;
  showtimes: Showtime[];
}

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
      { _id: `showtime-${id}-1`, startsAt: new Date(Date.now() + 3 * 3600_000).toISOString(), format: 'IMAX',  language: 'English', basePrice: 480 },
      { _id: `showtime-${id}-2`, startsAt: new Date(Date.now() + 6 * 3600_000).toISOString(), format: '2D',    language: 'English', basePrice: 280 },
      { _id: `showtime-${id}-3`, startsAt: new Date(Date.now() + 9 * 3600_000).toISOString(), format: 'Dolby', language: 'Hindi',   basePrice: 380 },
    ],
  };
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS   = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function MovieDetailPage({ params }: { params: { id: string } }) {
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromMock, setFromMock] = useState(false);
  const [activeShowtimeId, setActiveShowtimeId] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [dateIdx, setDateIdx] = useState(0);
  const [format, setFormat] = useState('All');
  const [language, setLanguage] = useState('All');

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

  useEffect(() => {
    setSelectedSeats([]);
  }, [activeShowtimeId]);

  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return { day: DAYS[d.getDay()], date: d.getDate(), month: MONTHS[d.getMonth()] };
    });
  }, []);

  const showtimes = detail?.showtimes ?? [];
  const formats = useMemo(
    () => ['All', ...Array.from(new Set(showtimes.map((s) => s.format).filter(Boolean) as string[]))],
    [showtimes],
  );
  const langs = useMemo(
    () => ['All', ...Array.from(new Set(showtimes.map((s) => s.language).filter(Boolean) as string[]))],
    [showtimes],
  );

  const filteredShowtimes = showtimes.filter((s) => {
    if (format !== 'All' && s.format !== format) return false;
    if (language !== 'All' && s.language !== language) return false;
    return true;
  });

  if (loading || !detail || !activeShowtimeId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: 'var(--line)', borderTopColor: 'var(--accent)' }}
        />
      </div>
    );
  }

  const { movie } = detail;

  return (
    <div className="space-y-10 screen-enter">
      <Link
        href="/movies"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em]"
        style={{ color: 'var(--fg-soft)' }}
      >
        ← All films
      </Link>

      {fromMock && (
        <div
          className="rounded-sharp px-4 py-2.5 font-mono text-[11px]"
          style={{
            border: '1px solid var(--line)',
            color: 'var(--fg-faint)',
            background: 'var(--bg-soft)',
          }}
        >
          Demo mode — showing sample movie data. Booking flow below works end-to-end.
        </div>
      )}

      {/* ---------- Hero ---------- */}
      <div
        className="grid gap-10"
        style={{ gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr)' }}
      >
        <div
          className="overflow-hidden rounded-sharp"
          style={{ aspectRatio: '2/3' }}
        >
          <Poster
            movie={{
              id: movie._id,
              title: movie.title,
              genres: movie.genres ?? [],
              posterUrl: movie.posterUrl,
            }}
            className="h-full w-full"
            big
          />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {(movie.genres ?? []).map((g) => (
                <Tag key={g}>{g}</Tag>
              ))}
              <Tag accent>IMAX</Tag>
            </div>
            <h1
              className="mb-2 font-display italic font-bold"
              style={{
                fontSize: 'clamp(40px, 5vw, 72px)',
                lineHeight: 0.95,
                letterSpacing: '-0.02em',
                color: 'var(--fg)',
              }}
            >
              {movie.title}
            </h1>
            {movie.description && (
              <p
                className="mt-6"
                style={{
                  fontSize: 17,
                  lineHeight: 1.55,
                  color: 'var(--fg-soft)',
                  maxWidth: '60ch',
                }}
              >
                {movie.description}
              </p>
            )}
          </div>

          <div
            className="mt-8 grid grid-cols-2 gap-6 pt-6 md:grid-cols-4"
            style={{ borderTop: '1px solid var(--line)' }}
          >
            <div>
              <Mono
                className="block text-[10px] uppercase tracking-[0.2em]"
                style={{ color: 'var(--fg-faint)' }}
              >
                Runtime
              </Mono>
              <Mono
                className="mt-1 block text-sm"
                style={{ color: 'var(--fg)' }}
              >
                {movie.durationMin
                  ? `${Math.floor(movie.durationMin / 60)}h ${movie.durationMin % 60}m`
                  : '—'}
              </Mono>
            </div>
            <div>
              <Mono
                className="block text-[10px] uppercase tracking-[0.2em]"
                style={{ color: 'var(--fg-faint)' }}
              >
                Rating
              </Mono>
              <Mono
                className="mt-1 block text-sm"
                style={{ color: 'var(--accent)' }}
              >
                ★ {movie.rating?.toFixed(1) ?? '—'} / 10
              </Mono>
            </div>
            <div>
              <Mono
                className="block text-[10px] uppercase tracking-[0.2em]"
                style={{ color: 'var(--fg-faint)' }}
              >
                Release
              </Mono>
              <Mono
                className="mt-1 block text-sm"
                style={{ color: 'var(--fg)' }}
              >
                {movie.releaseDate
                  ? new Date(movie.releaseDate).toLocaleDateString()
                  : '—'}
              </Mono>
            </div>
            <div>
              <Mono
                className="block text-[10px] uppercase tracking-[0.2em]"
                style={{ color: 'var(--fg-faint)' }}
              >
                Genres
              </Mono>
              <div className="mt-1 text-sm" style={{ color: 'var(--fg)' }}>
                {(movie.genres ?? []).slice(0, 2).join(', ') || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Divider label="Pick a showtime" />

      {/* ---------- Date strip ---------- */}
      <div>
        <Mono
          className="mb-3 block text-[10px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--fg-faint)' }}
        >
          Date
        </Mono>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((d, i) => {
            const active = i === dateIdx;
            return (
              <button
                key={i}
                onClick={() => setDateIdx(i)}
                className="rounded-sharp border px-4 py-3 text-center font-mono"
                style={{
                  minWidth: 80,
                  borderColor: 'var(--line)',
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--bg)' : 'var(--fg)',
                }}
              >
                <div className="text-[10px] tracking-[0.15em] opacity-80">
                  {d.day}
                </div>
                <div className="my-1 text-2xl font-bold">{d.date}</div>
                <div className="text-[10px] tracking-[0.15em] opacity-80">
                  {d.month}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- Format + language ---------- */}
      <div className="flex flex-wrap gap-6">
        <div>
          <Mono
            className="mb-2 block text-[10px] uppercase tracking-[0.3em]"
            style={{ color: 'var(--fg-faint)' }}
          >
            Format
          </Mono>
          <div className="flex flex-wrap gap-2">
            {formats.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className="rounded-full border px-3 py-1.5 font-mono text-xs tracking-[0.05em]"
                style={{
                  borderColor: 'var(--line)',
                  background: format === f ? 'var(--fg)' : 'transparent',
                  color: format === f ? 'var(--bg)' : 'var(--fg-soft)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Mono
            className="mb-2 block text-[10px] uppercase tracking-[0.3em]"
            style={{ color: 'var(--fg-faint)' }}
          >
            Language
          </Mono>
          <div className="flex flex-wrap gap-2">
            {langs.map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className="rounded-full border px-3 py-1.5 font-mono text-xs tracking-[0.05em]"
                style={{
                  borderColor: 'var(--line)',
                  background: language === l ? 'var(--fg)' : 'transparent',
                  color: language === l ? 'var(--bg)' : 'var(--fg-soft)',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Showtime buttons ---------- */}
      <div
        className="rounded-sharp p-6"
        style={{ border: '1px solid var(--line)', background: 'var(--card)' }}
      >
        <div className="mb-4 flex items-start justify-between gap-6">
          <div>
            <div
              className="font-display italic font-semibold"
              style={{ fontSize: 22, color: 'var(--fg)' }}
            >
              Grand Central IMAX
            </div>
            <Mono
              className="mt-1 block text-xs"
              style={{ color: 'var(--fg-soft)' }}
            >
              Bandra West, Mumbai · 2.4 km
            </Mono>
          </div>
          <div className="hidden flex-wrap justify-end gap-1.5 md:flex">
            <Tag>IMAX</Tag>
            <Tag>Dolby</Tag>
            <Tag>Recliner</Tag>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filteredShowtimes.map((s) => {
            const when = new Date(s.startsAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const active = s._id === activeShowtimeId;
            return (
              <button
                key={s._id}
                onClick={() => setActiveShowtimeId(s._id)}
                className="rounded-sharp border px-4 py-2.5 text-left transition-colors"
                style={{
                  minWidth: 96,
                  borderColor: active ? 'var(--accent)' : 'var(--line)',
                  background: active ? 'color-mix(in oklch, var(--accent) 10%, transparent)' : 'transparent',
                }}
              >
                <Mono
                  className="block text-[15px] font-semibold"
                  style={{ color: active ? 'var(--accent)' : 'var(--fg)' }}
                >
                  {when}
                </Mono>
                <Mono
                  className="mt-0.5 block text-[9px] tracking-[0.1em] opacity-70"
                  style={{ color: active ? 'var(--accent)' : 'var(--fg-soft)' }}
                >
                  {s.format ?? '2D'}
                  {s.basePrice ? ` · ₹${s.basePrice}` : ''}
                </Mono>
              </button>
            );
          })}
          {filteredShowtimes.length === 0 && (
            <Mono className="text-xs" style={{ color: 'var(--fg-faint)' }}>
              No showtimes match these filters.
            </Mono>
          )}
        </div>
      </div>

      <Divider label="Choose your seats" />

      {/* ---------- Seats + checkout ---------- */}
      <section
        className="grid gap-8"
        style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 340px)' }}
      >
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
