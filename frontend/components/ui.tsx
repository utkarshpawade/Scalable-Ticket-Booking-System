import type { CSSProperties, ReactNode } from 'react';

export const Mono = ({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) => (
  <span className={`font-mono ${className}`} style={style}>
    {children}
  </span>
);

export const Pill = ({
  children,
  active,
  onClick,
  mono = true,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  mono?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-all ${
      mono ? 'font-mono tracking-[0.05em]' : ''
    }`}
    style={{
      borderColor: 'var(--line)',
      background: active ? 'var(--fg)' : 'transparent',
      color: active ? 'var(--bg)' : 'var(--fg-soft)',
    }}
  >
    {children}
  </button>
);

export const Tag = ({
  children,
  accent,
  mono = true,
}: {
  children: ReactNode;
  accent?: boolean;
  mono?: boolean;
}) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-sharp border px-2 py-[3px] text-[10px] uppercase tracking-[0.1em] ${
      mono ? 'font-mono' : ''
    }`}
    style={{
      borderColor: accent ? 'var(--accent)' : 'var(--line)',
      color: accent ? 'var(--accent)' : 'var(--fg-soft)',
      background: accent
        ? 'color-mix(in oklch, var(--accent) 8%, transparent)'
        : 'transparent',
    }}
  >
    {children}
  </span>
);

export const Divider = ({ label }: { label?: string }) => (
  <div
    className="flex items-center gap-3"
    style={{ color: 'var(--fg-faint)' }}
  >
    <div className="h-px flex-1" style={{ background: 'var(--line)' }} />
    {label && (
      <Mono className="text-[10px] uppercase tracking-[0.2em]">{label}</Mono>
    )}
    <div className="h-px flex-1" style={{ background: 'var(--line)' }} />
  </div>
);

/**
 * Hashing helper for deterministic poster art.
 */
function seedHash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h * 31 + seed.charCodeAt(i)) >>> 0);
  return h;
}

export interface PosterMovie {
  id: string;
  title: string;
  genres: string[];
  cert?: string;
  year?: number;
  posterUrl?: string;
  accent?: string;
  seed?: string;
}

/**
 * Striped editorial poster — uses a real posterUrl when present; otherwise
 * renders a deterministic gradient placeholder seeded by the movie id.
 */
export const Poster = ({
  movie,
  className = '',
  big = false,
}: {
  movie: PosterMovie;
  className?: string;
  big?: boolean;
}) => {
  const seed = movie.seed ?? movie.id ?? movie.title ?? 'reel';
  const h = seedHash(seed);
  const hue = h % 360;
  const angle = (h % 60) - 30;
  const stripeW = 6 + (h % 8);
  const accent = movie.accent ?? `oklch(0.72 0.14 ${hue})`;

  if (movie.posterUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, transparent 40%, color-mix(in oklch, var(--bg) 90%, transparent) 100%)',
          }}
        />
        <div className="absolute inset-0 flex items-end p-3">
          <div>
            <div
              className="font-mono text-[9px] uppercase tracking-[0.25em] opacity-80"
              style={{ color: 'var(--fg-soft)' }}
            >
              {movie.genres[0]}
            </div>
            <div
              className={`font-display italic font-bold ${big ? 'text-2xl' : 'text-sm'}`}
              style={{
                lineHeight: 1.05,
                color: 'white',
                textShadow: '0 1px 16px rgba(0,0,0,0.6)',
              }}
            >
              {movie.title}
            </div>
          </div>
        </div>
        {(movie.cert || movie.year) && (
          <div
            className="absolute right-2 top-2 font-mono text-[9px] uppercase tracking-widest"
            style={{ color: 'white', opacity: 0.7 }}
          >
            {[movie.cert, movie.year].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(${135 + angle}deg, oklch(0.18 0.04 ${hue}), oklch(0.10 0.02 ${hue}))`,
      }}
    >
      <div
        className="absolute inset-0 mix-blend-screen opacity-40"
        style={{
          backgroundImage: `repeating-linear-gradient(${angle}deg, ${accent} 0 1px, transparent 1px ${stripeW}px)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at ${30 + (h % 40)}% ${20 + (h % 60)}%, ${accent}, transparent 60%)`,
        }}
      />
      <div className="absolute inset-0 flex items-end p-3">
        <div>
          <div
            className="font-mono text-[9px] uppercase tracking-[0.25em] opacity-60"
            style={{ color: 'white' }}
          >
            {movie.genres[0]}
          </div>
          <div
            className={`font-display italic font-bold ${big ? 'text-2xl' : 'text-sm'}`}
            style={{
              lineHeight: 1.05,
              color: 'white',
              textShadow: '0 1px 16px rgba(0,0,0,0.6)',
            }}
          >
            {movie.title}
          </div>
        </div>
      </div>
      {(movie.cert || movie.year) && (
        <div
          className="absolute right-2 top-2 font-mono text-[9px] uppercase tracking-widest opacity-50"
          style={{ color: 'white' }}
        >
          {[movie.cert, movie.year].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>
  );
};

export const Marquee = ({ now }: { now: string }) => (
  <div
    className="flex items-center justify-between px-6 py-2 font-mono text-[11px] tracking-[0.08em]"
    style={{
      borderBottom: '1px solid var(--line)',
      color: 'var(--fg-faint)',
    }}
  >
    <div className="flex items-center gap-4">
      <span style={{ color: 'var(--accent)' }}>● LIVE</span>
      <span className="hidden sm:inline">NOW SHOWING · 47 SCREENS · MUMBAI</span>
    </div>
    <div>{now}</div>
  </div>
);
