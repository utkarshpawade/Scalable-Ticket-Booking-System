// Shared poster + UI primitives. Posters are striped SVG placeholders with
// titles overlaid — keeps the prototype self-contained without invented art.

const Poster = ({ movie, className = '', big = false }) => {
  const accent = movie.accent;
  const seed = movie.poster;
  // deterministic stripe pattern from seed
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const angle = (h % 60) - 30;
  const stripeW = 6 + (h % 8);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(${135 + angle}deg, oklch(0.18 0.04 ${(h % 360)}), oklch(0.10 0.02 ${(h % 360)}))`,
      }}
    >
      <div
        className="absolute inset-0 opacity-40 mix-blend-screen"
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
            className="text-[9px] uppercase tracking-[0.25em] opacity-60"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {movie.genres[0]}
          </div>
          <div
            className={big ? 'text-2xl' : 'text-sm'}
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 700,
              fontStyle: 'italic',
              lineHeight: 1.05,
              color: 'white',
              textShadow: '0 1px 16px rgba(0,0,0,0.6)',
            }}
          >
            {movie.title}
          </div>
        </div>
      </div>
      <div
        className="absolute right-2 top-2 text-[9px] uppercase tracking-widest opacity-50"
        style={{ fontFamily: 'JetBrains Mono, monospace', color: 'white' }}
      >
        {movie.cert} · {movie.year}
      </div>
    </div>
  );
};

const Mono = ({ children, className = '', style = {} }) => (
  <span
    className={className}
    style={{ fontFamily: 'JetBrains Mono, monospace', ...style }}
  >
    {children}
  </span>
);

const Pill = ({ children, active, onClick, mono }) => (
  <button
    onClick={onClick}
    className="transition-all"
    style={{
      padding: '6px 12px',
      borderRadius: '999px',
      fontSize: '12px',
      fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
      letterSpacing: mono ? '0.05em' : '0',
      border: '1px solid var(--line)',
      background: active ? 'var(--fg)' : 'transparent',
      color: active ? 'var(--bg)' : 'var(--fg-soft)',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </button>
);

const Tag = ({ children, accent, mono }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--line)'}`,
      color: accent ? 'var(--accent)' : 'var(--fg-soft)',
      background: accent ? 'color-mix(in oklch, var(--accent) 8%, transparent)' : 'transparent',
    }}
  >
    {children}
  </span>
);

const Divider = ({ label }) => (
  <div className="flex items-center gap-3" style={{ color: 'var(--fg-faint)' }}>
    <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    {label && (
      <Mono className="text-[10px] uppercase tracking-[0.2em]">{label}</Mono>
    )}
    <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
  </div>
);

// Top-of-screen banner with a marquee-style cinema strip.
const Marquee = ({ now }) => (
  <div
    className="flex items-center justify-between px-6 py-2"
    style={{
      borderBottom: '1px solid var(--line)',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: 'var(--fg-faint)',
      letterSpacing: '0.08em',
    }}
  >
    <div className="flex items-center gap-4">
      <span style={{ color: 'var(--accent)' }}>● LIVE</span>
      <span>NOW SHOWING · 47 SCREENS · MUMBAI</span>
    </div>
    <div className="flex items-center gap-4">
      <span>{now}</span>
    </div>
  </div>
);

Object.assign(window, { Poster, Mono, Pill, Tag, Divider, Marquee });
