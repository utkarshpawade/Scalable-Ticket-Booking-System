// Seat selection — the centerpiece. Live multi-user lock simulation,
// premium tiers, sticky summary with countdown.

const SeatScreen = ({ showtime, onBack, onCheckout, tweaks }) => {
  const layout = React.useMemo(() => window.makeSeatMap(), []);
  const initial = React.useMemo(() => window.makeOccupied(showtime.id), [showtime.id]);

  const [sold, setSold] = React.useState(new Set(initial.sold));
  const [locked, setLocked] = React.useState(new Set(initial.locked));
  const [selected, setSelected] = React.useState(new Set());
  const [pulses, setPulses] = React.useState({}); // seatId -> timestamp for animation
  const [lastEvent, setLastEvent] = React.useState(null);
  const [seconds, setSeconds] = React.useState(600);

  // Live lock simulation: every few seconds, another "user" grabs/releases seats
  React.useEffect(() => {
    if (!tweaks.liveLockSim) return;
    const tick = () => {
      const allSeats = layout.flatMap((r) => r.seats.map((s) => s.id));
      const candidates = allSeats.filter(
        (id) => !sold.has(id) && !locked.has(id) && !selected.has(id)
      );
      if (candidates.length === 0) return;
      const action = Math.random();
      if (action < 0.6) {
        // someone grabs 1-2 adjacent seats
        const start = candidates[Math.floor(Math.random() * candidates.length)];
        const ids = [start];
        const m = start.match(/^([A-Z])(\d+)$/);
        if (m && Math.random() < 0.5) {
          const next = `${m[1]}${parseInt(m[2]) + 1}`;
          if (candidates.includes(next)) ids.push(next);
        }
        setLocked((prev) => {
          const n = new Set(prev);
          ids.forEach((id) => n.add(id));
          return n;
        });
        const now = Date.now();
        setPulses((prev) => {
          const n = { ...prev };
          ids.forEach((id) => (n[id] = now));
          return n;
        });
        setLastEvent({ kind: 'lock', ids, who: ['Aanya', 'Rohit', 'Sam', 'Priya', 'Marcus'][Math.floor(Math.random() * 5)] });
      } else {
        // release one of the existing locked seats
        const lockedArr = [...locked];
        if (lockedArr.length === 0) return;
        const id = lockedArr[Math.floor(Math.random() * lockedArr.length)];
        setLocked((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
        setLastEvent({ kind: 'release', ids: [id] });
      }
    };
    const interval = setInterval(tick, 3500);
    return () => clearInterval(interval);
  }, [tweaks.liveLockSim, layout, sold, locked, selected]);

  // Countdown
  React.useEffect(() => {
    if (selected.size === 0) {
      setSeconds(600);
      return;
    }
    const i = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, [selected.size]);

  // Auto-clear last event toast
  React.useEffect(() => {
    if (!lastEvent) return;
    const t = setTimeout(() => setLastEvent(null), 2500);
    return () => clearTimeout(t);
  }, [lastEvent]);

  const toggle = (seat) => {
    if (sold.has(seat.id) || locked.has(seat.id)) return;
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(seat.id)) n.delete(seat.id);
      else n.add(seat.id);
      return n;
    });
  };

  const selectedSeats = layout.flatMap((r) =>
    r.seats.filter((s) => selected.has(s.id)).map((s) => ({ ...s, tier: r.tier }))
  );
  const subtotal = selectedSeats.reduce((a, s) => a + s.price, 0);
  const fees = Math.round(subtotal * 0.08);
  const total = subtotal + fees;

  const seatSize = tweaks.density === 'compact' ? 26 : 32;
  const seatGap = tweaks.density === 'compact' ? 4 : 6;

  const seatStyle = (seat) => {
    const isSold = sold.has(seat.id);
    const isLocked = locked.has(seat.id);
    const isSel = selected.has(seat.id);
    const isPulsing = pulses[seat.id] && Date.now() - pulses[seat.id] < 2000;

    let bg = 'transparent';
    let border = '1px solid var(--seat-line)';
    let color = 'var(--fg-soft)';
    let cursor = 'pointer';

    if (isSold) {
      bg = 'transparent';
      border = '1px solid transparent';
      color = 'var(--fg-faint)';
      cursor = 'not-allowed';
    } else if (isLocked) {
      bg = 'var(--seat-locked)';
      border = '1px solid var(--seat-locked)';
      color = 'var(--fg-faint)';
      cursor = 'not-allowed';
    } else if (isSel) {
      bg = 'var(--accent)';
      border = '1px solid var(--accent)';
      color = 'var(--bg)';
    }

    return {
      width: seatSize,
      height: seatSize,
      borderRadius: '4px 4px 2px 2px',
      background: bg,
      border,
      color,
      cursor,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '9px',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.15s',
      outline: isPulsing ? '2px solid var(--accent)' : 'none',
      outlineOffset: '2px',
      animation: isPulsing ? 'seatPulse 1.5s ease-out' : 'none',
      textDecoration: isSold ? 'line-through' : 'none',
      padding: 0,
    };
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--fg-soft)',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 16,
              padding: 0,
            }}
          >
            ← Change showtime
          </button>
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1
              style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: '40px',
                color: 'var(--fg)',
                lineHeight: 1,
              }}
            >
              {showtime.movie.title}
            </h1>
            <Mono className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--fg-faint)' }}>
              {showtime.theater.name} · Screen 4
            </Mono>
          </div>
          <Mono className="text-sm mt-2 block" style={{ color: 'var(--fg-soft)' }}>
            {showtime.time} · {showtime.format} · {showtime.language}
          </Mono>
        </div>
      </div>

      <div className="grid gap-8" style={{ gridTemplateColumns: '1fr 340px' }}>
        {/* Seat map */}
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: '2px',
            background: 'var(--card)',
            padding: '32px 28px',
          }}
        >
          {/* Live indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: tweaks.liveLockSim ? 'var(--accent)' : 'var(--fg-faint)',
                  boxShadow: tweaks.liveLockSim ? '0 0 0 0 var(--accent)' : 'none',
                  animation: tweaks.liveLockSim ? 'pulse 2s infinite' : 'none',
                }}
              />
              <Mono className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--fg-soft)' }}>
                {tweaks.liveLockSim ? 'Live · 47 viewers in this room' : 'Static preview'}
              </Mono>
            </div>
            <Mono className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--fg-faint)' }}>
              {sold.size} sold · {locked.size} held
            </Mono>
          </div>

          {/* Screen */}
          <div className="mb-8">
            <div
              style={{
                width: '70%',
                margin: '0 auto',
                height: 4,
                background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                borderRadius: '50%',
                boxShadow: '0 0 40px 6px color-mix(in oklch, var(--accent) 30%, transparent)',
              }}
            />
            <Mono
              className="text-center mt-3 block"
              style={{
                fontSize: '9px',
                letterSpacing: '0.4em',
                color: 'var(--fg-faint)',
              }}
            >
              SCREEN
            </Mono>
          </div>

          {/* Tier groups */}
          {(() => {
            const groups = [];
            let currentTier = null;
            layout.forEach((r) => {
              if (r.tier !== currentTier) {
                groups.push({ tier: r.tier, price: r.price, rows: [] });
                currentTier = r.tier;
              }
              groups[groups.length - 1].rows.push(r);
            });
            return groups.map((g, gi) => (
              <div key={g.tier} style={{ marginBottom: gi === groups.length - 1 ? 0 : 24 }}>
                <div className="flex items-center justify-between mb-2">
                  <Mono className="text-[9px] uppercase tracking-[0.25em]" style={{ color: 'var(--fg-faint)' }}>
                    {g.tier}
                  </Mono>
                  <Mono className="text-[9px] uppercase tracking-[0.25em]" style={{ color: 'var(--fg-faint)' }}>
                    ₹{g.price}
                  </Mono>
                </div>
                <div className="flex flex-col items-center" style={{ gap: seatGap }}>
                  {g.rows.map((r) => (
                    <div key={r.row} className="flex items-center" style={{ gap: seatGap }}>
                      <Mono style={{ width: 16, fontSize: 10, color: 'var(--fg-faint)', textAlign: 'center' }}>
                        {r.row}
                      </Mono>
                      <div className="flex" style={{ gap: seatGap }}>
                        {r.seats.slice(0, 4).map((s) => (
                          <button key={s.id} onClick={() => toggle(s)} style={seatStyle(s)} disabled={sold.has(s.id) || locked.has(s.id)}>
                            {s.col}
                          </button>
                        ))}
                      </div>
                      <div style={{ width: 12 }} />
                      <div className="flex" style={{ gap: seatGap }}>
                        {r.seats.slice(4, 10).map((s) => (
                          <button key={s.id} onClick={() => toggle(s)} style={seatStyle(s)} disabled={sold.has(s.id) || locked.has(s.id)}>
                            {s.col}
                          </button>
                        ))}
                      </div>
                      <div style={{ width: 12 }} />
                      <div className="flex" style={{ gap: seatGap }}>
                        {r.seats.slice(10).map((s) => (
                          <button key={s.id} onClick={() => toggle(s)} style={seatStyle(s)} disabled={sold.has(s.id) || locked.has(s.id)}>
                            {s.col}
                          </button>
                        ))}
                      </div>
                      <Mono style={{ width: 16, fontSize: 10, color: 'var(--fg-faint)', textAlign: 'center' }}>
                        {r.row}
                      </Mono>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-8 pt-6" style={{ borderTop: '1px solid var(--line)' }}>
            {[
              { label: 'Available', style: { border: '1px solid var(--seat-line)', background: 'transparent' } },
              { label: 'Selected',  style: { background: 'var(--accent)' } },
              { label: 'Held',      style: { background: 'var(--seat-locked)' } },
              { label: 'Sold',      style: { border: '1px solid transparent', textDecoration: 'line-through', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-faint)', fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }, content: '×' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <span style={{ width: 16, height: 16, borderRadius: 3, ...l.style }}>{l.content}</span>
                <Mono className="text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--fg-soft)' }}>{l.label}</Mono>
              </div>
            ))}
          </div>

          {/* Live event toast */}
          {lastEvent && (
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--bg)',
                border: '1px solid var(--accent)',
                padding: '8px 14px',
                borderRadius: 2,
                animation: 'fadeUp 0.3s',
              }}
            >
              <Mono className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
                {lastEvent.kind === 'lock'
                  ? `${lastEvent.who} grabbed ${lastEvent.ids.join(', ')}`
                  : `${lastEvent.ids[0]} released`}
              </Mono>
            </div>
          )}
        </div>

        {/* Sidebar summary */}
        <aside
          style={{
            border: '1px solid var(--line)',
            borderRadius: '2px',
            background: 'var(--card)',
            padding: '24px',
            position: 'sticky',
            top: 24,
            alignSelf: 'start',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <Mono className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--fg-faint)' }}>Order</Mono>
            {selected.size > 0 && (
              <Mono
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{
                  padding: '3px 8px',
                  background: 'color-mix(in oklch, var(--accent) 12%, transparent)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent)',
                  borderRadius: 2,
                }}
              >
                ◷ {fmt(seconds)}
              </Mono>
            )}
          </div>

          <div className="mb-5">
            <Mono className="text-[10px] uppercase tracking-[0.2em] block mb-2" style={{ color: 'var(--fg-faint)' }}>
              Seats ({selected.size})
            </Mono>
            {selected.size === 0 ? (
              <p className="text-sm" style={{ color: 'var(--fg-soft)' }}>
                Pick your seats from the chart.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selectedSeats.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid var(--accent)',
                      color: 'var(--accent)',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                      borderRadius: 2,
                    }}
                  >
                    {s.id}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 py-4" style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
            <div className="flex justify-between text-sm" style={{ color: 'var(--fg-soft)' }}>
              <span>Subtotal</span>
              <Mono>₹{subtotal.toLocaleString('en-IN')}</Mono>
            </div>
            <div className="flex justify-between text-sm" style={{ color: 'var(--fg-faint)' }}>
              <span>Convenience fee</span>
              <Mono>₹{fees.toLocaleString('en-IN')}</Mono>
            </div>
          </div>

          <div className="flex justify-between items-baseline py-4">
            <Mono className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--fg-faint)' }}>Total</Mono>
            <Mono style={{ fontSize: 24, fontWeight: 600, color: 'var(--fg)' }}>
              ₹{total.toLocaleString('en-IN')}
            </Mono>
          </div>

          <button
            onClick={() => onCheckout({ showtime, seats: selectedSeats, total, subtotal, fees })}
            disabled={selected.size === 0}
            style={{
              width: '100%',
              padding: '14px',
              background: selected.size === 0 ? 'var(--line)' : 'var(--accent)',
              color: selected.size === 0 ? 'var(--fg-faint)' : 'var(--bg)',
              border: 'none',
              borderRadius: 2,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Lock & pay →
          </button>

          <Mono className="text-[10px] block text-center mt-4" style={{ color: 'var(--fg-faint)', lineHeight: 1.5 }}>
            Held for 10 min via Redis Redlock.
            <br />
            No double-bookings, ever.
          </Mono>
        </aside>
      </div>
    </div>
  );
};

window.SeatScreen = SeatScreen;
