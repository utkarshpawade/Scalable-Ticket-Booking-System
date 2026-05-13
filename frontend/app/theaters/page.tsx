'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Mono, Pill, Tag } from '@/components/ui';
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
      <header className="space-y-2">
        <Mono
          className="text-[10px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--fg-faint)' }}
        >
          Premium screens · IMAX · Dolby · 4DX
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
          Theaters
        </h1>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search theaters or addresses…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-sharp border px-3 py-2.5 font-mono text-sm outline-none md:max-w-sm"
          style={{
            borderColor: 'var(--line)',
            background: 'transparent',
            color: 'var(--fg)',
          }}
        />
        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <Pill key={c} active={c === city} onClick={() => setCity(c)}>
              {c}
            </Pill>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-sharp p-16 text-center font-mono text-sm"
          style={{ border: '1px solid var(--line)', color: 'var(--fg-faint)' }}
        >
          No theaters match your filters.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="overflow-hidden rounded-sharp"
              style={{
                border: '1px solid var(--line)',
                background: 'var(--card)',
              }}
            >
              <div
                className="relative aspect-[16/9]"
                style={{ background: 'var(--bg-soft)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.imageUrl}
                  alt={t.name}
                  className="h-full w-full object-cover opacity-80"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, transparent 40%, var(--card) 100%)',
                  }}
                />
                <div className="absolute bottom-3 left-4 right-4">
                  <Mono
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: 'var(--accent)' }}
                  >
                    {t.city}
                  </Mono>
                  <h3
                    className="mt-1 font-display italic font-bold"
                    style={{ fontSize: 22, color: 'white' }}
                  >
                    {t.name}
                  </h3>
                </div>
              </div>
              <div className="space-y-3 p-5">
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--fg-soft)' }}
                >
                  {t.address}
                </p>
                <Mono
                  className="block text-xs"
                  style={{ color: 'var(--fg-soft)' }}
                >
                  {t.screens} screens
                </Mono>
                <div className="flex flex-wrap gap-1.5">
                  {t.amenities.map((a) => (
                    <Tag key={a}>{a}</Tag>
                  ))}
                </div>
                <Link
                  href="/movies"
                  className="mt-3 block rounded-sharp px-4 py-2.5 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.15em] transition-opacity hover:opacity-90"
                  style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                >
                  View showtimes →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
