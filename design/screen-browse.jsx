// Browse / home screen — editorial-cinema feel.

const BrowseScreen = ({ tweaks, onPick }) => {
  const [genre, setGenre] = React.useState('All');
  const [lang, setLang] = React.useState('All');
  const movies = window.MOVIES;
  const featured = movies[0];
  const filtered = movies.filter((m) => {
    if (genre !== 'All' && !m.genres.includes(genre)) return false;
    if (lang !== 'All' && !m.languages.includes(lang)) return false;
    return true;
  });

  const trending = filtered.slice(1, 5);
  const all = filtered;

  return (
    <div className="space-y-12">
      {/* Editorial hero */}
      <section
        className="relative overflow-hidden"
        style={{
          border: '1px solid var(--line)',
          borderRadius: '4px',
        }}
      >
        <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', minHeight: 480 }}>
          <div className="p-10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <Mono className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--fg-faint)' }}>
                Feature presentation · Vol. 47
              </Mono>
              <Mono className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--accent)' }}>
                Now booking
              </Mono>
            </div>

            <div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {featured.genres.map((g) => <Tag key={g} mono>{g}</Tag>)}
                <Tag mono accent>{featured.formats[0]}</Tag>
              </div>
              <h1
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontSize: 'clamp(48px, 6vw, 88px)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.02em',
                  color: 'var(--fg)',
                  marginBottom: '16px',
                }}
              >
                {featured.title}
              </h1>
              <p
                style={{
                  fontSize: '17px',
                  lineHeight: 1.5,
                  color: 'var(--fg-soft)',
                  maxWidth: '52ch',
                  textWrap: 'pretty',
                }}
              >
                {featured.synopsis}
              </p>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex flex-wrap gap-8">
                <div>
                  <Mono className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--fg-faint)' }}>Director</Mono>
                  <div className="text-sm mt-1" style={{ color: 'var(--fg)' }}>{featured.director}</div>
                </div>
                <div>
                  <Mono className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--fg-faint)' }}>Runtime</Mono>
                  <Mono className="text-sm mt-1 block" style={{ color: 'var(--fg)' }}>
                    {Math.floor(featured.durationMin / 60)}h {featured.durationMin % 60}m
                  </Mono>
                </div>
                <div>
                  <Mono className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--fg-faint)' }}>Rating</Mono>
                  <Mono className="text-sm mt-1 block" style={{ color: 'var(--accent)' }}>★ {featured.rating}</Mono>
                </div>
              </div>
              <button
                onClick={() => onPick(featured.id)}
                style={{
                  padding: '14px 28px',
                  background: 'var(--accent)',
                  color: 'var(--bg)',
                  border: 'none',
                  borderRadius: '2px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reserve seats →
              </button>
            </div>
          </div>

          <div className="relative">
            <Poster movie={featured} className="absolute inset-0" big />
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Mono className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--fg-faint)' }}>
            Browse · {filtered.length} titles
          </Mono>
          <div className="flex items-center gap-2">
            <Mono className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--fg-faint)' }}>
              {lang}
            </Mono>
            <span style={{ color: 'var(--fg-faint)' }}>/</span>
            <Mono className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--fg-faint)' }}>
              {genre}
            </Mono>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {window.GENRES.map((g) => (
            <Pill key={g} active={genre === g} onClick={() => setGenre(g)} mono>{g}</Pill>
          ))}
          <span style={{ width: 1, background: 'var(--line)', margin: '0 4px' }} />
          {window.LANGUAGES.map((l) => (
            <Pill key={l} active={lang === l} onClick={() => setLang(l)} mono>{l}</Pill>
          ))}
        </div>
      </section>

      {/* Trending — large editorial cards */}
      {trending.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-baseline justify-between">
            <h2
              style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic',
                fontSize: '32px',
                fontWeight: 600,
                color: 'var(--fg)',
              }}
            >
              Trending this week
            </h2>
            <Mono className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--fg-faint)' }}>
              By bookings · last 7 days
            </Mono>
          </div>

          <div className="grid grid-cols-4 gap-5">
            {trending.map((m, i) => (
              <button
                key={m.id}
                onClick={() => onPick(m.id)}
                className="text-left group"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <div className="relative" style={{ aspectRatio: '2/3', borderRadius: '2px', overflow: 'hidden' }}>
                  <Poster movie={m} className="absolute inset-0" />
                  <div
                    className="absolute top-3 left-3"
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontStyle: 'italic',
                      fontSize: '40px',
                      fontWeight: 700,
                      color: 'var(--accent)',
                      opacity: 0.9,
                      lineHeight: 0.8,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <div
                    className="truncate"
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontStyle: 'italic',
                      fontSize: '18px',
                      fontWeight: 600,
                      color: 'var(--fg)',
                    }}
                  >
                    {m.title}
                  </div>
                  <Mono className="text-xs shrink-0" style={{ color: 'var(--accent)' }}>★ {m.rating}</Mono>
                </div>
                <Mono className="text-[10px] uppercase tracking-[0.15em] mt-1 block" style={{ color: 'var(--fg-faint)' }}>
                  {m.genres.join(' · ')} · {Math.floor(m.durationMin / 60)}h{m.durationMin % 60}m
                </Mono>
              </button>
            ))}
          </div>
        </section>
      )}

      <Divider label="Now showing" />

      {/* Full grid */}
      <section className="grid grid-cols-4 gap-5">
        {all.map((m) => (
          <button
            key={m.id}
            onClick={() => onPick(m.id)}
            className="text-left"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: '2px',
              padding: '14px',
              cursor: 'pointer',
              display: 'flex',
              gap: '14px',
            }}
          >
            <div style={{ width: 88, aspectRatio: '2/3', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
              <Poster movie={m} className="h-full w-full" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontStyle: 'italic',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--fg)',
                    lineHeight: 1.1,
                  }}
                >
                  {m.title}
                </div>
                <Mono className="text-[10px] uppercase tracking-[0.15em] mt-1 block" style={{ color: 'var(--fg-faint)' }}>
                  {m.genres.slice(0, 2).join(' · ')}
                </Mono>
              </div>
              <div className="flex items-center justify-between mt-3">
                <Mono className="text-xs" style={{ color: 'var(--fg-soft)' }}>
                  {Math.floor(m.durationMin / 60)}h{m.durationMin % 60}m · {m.cert}
                </Mono>
                <Mono className="text-xs" style={{ color: 'var(--accent)' }}>★ {m.rating}</Mono>
              </div>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
};

window.BrowseScreen = BrowseScreen;
