'use client';

import { useMemo, useState } from 'react';
import { MOCK_THEATERS } from '@/lib/mockData';

export default function TheatersPage() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All');

  const cities = useMemo(
    () => ['All', ...Array.from(new Set(MOCK_THEATERS.map((t) => t.city)))],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_THEATERS.filter(
      (t) =>
        (city === 'All' || t.city === city) &&
        (!q ||
          t.name.toLowerCase().includes(q) ||
          t.city.toLowerCase().includes(q) ||
          t.address.toLowerCase().includes(q)),
    );
  }, [query, city]);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="font-display text-4xl font-bold text-white md:text-5xl">
          Our <span className="gradient-text">Theaters</span>
        </h1>
        <p className="text-slate-400">
          Premium screens across major cities — IMAX, 4DX, Dolby Atmos, and more.
        </p>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search theaters or addresses…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500 md:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => setCity(c)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                c === city
                  ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg shadow-brand-500/25'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:bg-white/10 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-16 text-center text-slate-400">
          No theaters match your filters.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, i) => (
            <div
              key={t.id}
              className="fade-up group overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-slate-900/80 to-slate-900/40 shadow-lg shadow-black/40 transition hover:-translate-y-1 hover:border-white/15 hover:shadow-2xl hover:shadow-brand-500/10"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.imageUrl}
                  alt={t.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-80" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-xs uppercase tracking-widest text-brand-300">
                    {t.city}
                  </p>
                  <h3 className="mt-0.5 font-display text-xl font-bold text-white">
                    {t.name}
                  </h3>
                </div>
              </div>
              <div className="space-y-3 p-5">
                <p className="text-sm text-slate-400">{t.address}</p>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span>🎬 {t.screens} screens</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {t.amenities.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-300"
                    >
                      {a}
                    </span>
                  ))}
                </div>
                <a
                  href="/movies"
                  className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110"
                >
                  View showtimes →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
