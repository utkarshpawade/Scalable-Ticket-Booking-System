// Movie detail + showtime picker.

const MovieDetailScreen = ({ movieId, onBack, onPickShowtime }) => {
  const movie = window.MOVIES.find((m) => m.id === movieId);
  const [date, setDate] = React.useState(0); // index
  const [format, setFormat] = React.useState('All');
  const [language, setLanguage] = React.useState('All');

  if (!movie) return null;

  const showtimes = window.makeShowtimes(movie.id);
  const filtered = showtimes.filter((s) => {
    if (format !== 'All' && s.format !== format) return false;
    if (language !== 'All' && s.language !== language) return false;
    return true;
  });

  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      day: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()],
      date: d.getDate(),
      month: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getMonth()],
    });
  }

  const formats = ['All', ...new Set(showtimes.map((s) => s.format))];
  const langs = ['All', ...new Set(showtimes.map((s) => s.language))];

  // Group by theater
  const byTheater = {};
  filtered.forEach((s) => {
    (byTheater[s.theaterId] ??= []).push(s);
  });

  return (
    <div className="space-y-10">
      <button
        onClick={onBack}
        className="flex items-center gap-2"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--fg-soft)',
          cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        ← All films
      </button>

      {/* Hero */}
      <div className="grid gap-10" style={{ gridTemplateColumns: '320px 1fr' }}>
        <div style={{ aspectRatio: '2/3', borderRadius: '2px', overflow: 'hidden' }}>
          <Poster movie={movie} className="h-full w-full" big />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {movie.genres.map((g) => <Tag key={g} mono>{g}</Tag>)}
              {movie.formats.map((f) => <Tag key={f} mono accent>{f}</Tag>)}
            </div>
            <h1
              style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 'clamp(40px, 5vw, 72px)',
                lineHeight: 0.95,
                letterSpacing: '-0.02em',
                color: 'var(--fg)',
                marginBottom: '8px',
              }}
            >
              {movie.title}
            </h1>
            <p
              style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic',
                fontSize: '20px',
                color: 'var(--accent)',
                marginBottom: '24px',
              }}
            >
              "{movie.tagline}"
            </p>
            <p
              style={{
                fontSize: '17px',
                lineHeight: 1.55,
                color: 'var(--fg-soft)',
                maxWidth: '60ch',
                textWrap: 'pretty',
              }}
            >
              {movie.synopsis}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-6 mt-8 pt-6" style={{ borderTop: '1px solid var(--line)' }}>
            <div>
              <Mono className="text-[10px] uppercase tracking-[0.2em] block" style={{ color: 'var(--fg-faint)' }}>Director</Mono>
              <div className="text-sm mt-1" style={{ color: 'var(--fg)' }}>{movie.director}</div>
            </div>
            <div>
              <Mono className="text-[10px] uppercase tracking-[0.2em] block" style={{ color: 'var(--fg-faint)' }}>Cast</Mono>
              <div className="text-sm mt-1" style={{ color: 'var(--fg)' }}>{movie.cast.slice(0, 2).join(', ')}</div>
            </div>
            <div>
              <Mono className="text-[10px] uppercase tracking-[0.2em] block" style={{ color: 'var(--fg-faint)' }}>Runtime</Mono>
              <Mono className="text-sm mt-1 block" style={{ color: 'var(--fg)' }}>
                {Math.floor(movie.durationMin / 60)}h {movie.durationMin % 60}m
              </Mono>
            </div>
            <div>
              <Mono className="text-[10px] uppercase tracking-[0.2em] block" style={{ color: 'var(--fg-faint)' }}>Rating</Mono>
              <Mono className="text-sm mt-1 block" style={{ color: 'var(--accent)' }}>★ {movie.rating} / 10</Mono>
            </div>
          </div>
        </div>
      </div>

      <Divider label="Pick a showtime" />

      {/* Date picker */}
      <div>
        <Mono className="text-[10px] uppercase tracking-[0.3em] block mb-3" style={{ color: 'var(--fg-faint)' }}>
          Date
        </Mono>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((d, i) => (
            <button
              key={i}
              onClick={() => setDate(i)}
              style={{
                padding: '12px 18px',
                minWidth: 80,
                border: '1px solid var(--line)',
                borderRadius: '2px',
                background: date === i ? 'var(--accent)' : 'transparent',
                color: date === i ? 'var(--bg)' : 'var(--fg)',
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <div className="text-[10px] tracking-[0.15em]" style={{ opacity: 0.7 }}>{d.day}</div>
              <div className="text-2xl font-bold my-1">{d.date}</div>
              <div className="text-[10px] tracking-[0.15em]" style={{ opacity: 0.7 }}>{d.month}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Format + language filters */}
      <div className="flex flex-wrap gap-6">
        <div>
          <Mono className="text-[10px] uppercase tracking-[0.3em] block mb-2" style={{ color: 'var(--fg-faint)' }}>Format</Mono>
          <div className="flex gap-2">
            {formats.map((f) => <Pill key={f} active={format === f} onClick={() => setFormat(f)} mono>{f}</Pill>)}
          </div>
        </div>
        <div>
          <Mono className="text-[10px] uppercase tracking-[0.3em] block mb-2" style={{ color: 'var(--fg-faint)' }}>Language</Mono>
          <div className="flex gap-2">
            {langs.map((l) => <Pill key={l} active={language === l} onClick={() => setLanguage(l)} mono>{l}</Pill>)}
          </div>
        </div>
      </div>

      {/* Theaters + showtimes */}
      <div className="space-y-5">
        {Object.entries(byTheater).map(([tid, slots]) => {
          const t = window.THEATERS.find((th) => th.id === tid);
          return (
            <div
              key={tid}
              style={{
                border: '1px solid var(--line)',
                borderRadius: '2px',
                background: 'var(--card)',
                padding: '20px 24px',
              }}
            >
              <div className="flex items-start justify-between gap-6 mb-4">
                <div>
                  <div
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontStyle: 'italic',
                      fontSize: '22px',
                      fontWeight: 600,
                      color: 'var(--fg)',
                    }}
                  >
                    {t.name}
                  </div>
                  <Mono className="text-xs mt-1 block" style={{ color: 'var(--fg-soft)' }}>
                    {t.locality}, {t.city} · {t.distanceKm} km
                  </Mono>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {t.amenities.map((a) => <Tag key={a} mono>{a}</Tag>)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onPickShowtime({ ...s, theater: t, movie })}
                    style={{
                      padding: '10px 16px',
                      border: `1px solid ${s.lowAvailability ? 'var(--accent)' : 'var(--line)'}`,
                      background: 'transparent',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      minWidth: 96,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--accent)';
                      e.currentTarget.style.color = 'var(--bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '';
                    }}
                  >
                    <Mono style={{ fontSize: '15px', fontWeight: 600, display: 'block' }}>{s.time}</Mono>
                    <Mono style={{ fontSize: '9px', letterSpacing: '0.1em', opacity: 0.7, display: 'block', marginTop: 2 }}>
                      {s.format} · ₹{s.basePrice}
                    </Mono>
                    {s.lowAvailability && (
                      <Mono style={{ fontSize: '9px', color: 'var(--accent)', marginTop: 2, display: 'block' }}>
                        ● {s.remaining} left
                      </Mono>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

window.MovieDetailScreen = MovieDetailScreen;
