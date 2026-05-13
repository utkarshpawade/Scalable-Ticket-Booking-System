// Payment + confirmation screens.

const PaymentScreen = ({ order, onBack, onConfirm }) => {
  const [method, setMethod] = React.useState('upi');
  const [stage, setStage] = React.useState('idle'); // idle | locking | paying | confirming | done
  const [upiId, setUpiId] = React.useState('');
  const [cardNum, setCardNum] = React.useState('');
  const [cardName, setCardName] = React.useState('');
  const [cardExp, setCardExp] = React.useState('');
  const [cardCvv, setCardCvv] = React.useState('');

  const stages = [
    { key: 'locking', label: 'Lock seats', sub: 'seat-service / Redis' },
    { key: 'paying', label: 'Process payment', sub: 'payment gateway' },
    { key: 'confirming', label: 'Commit booking', sub: 'booking-service / saga' },
  ];

  const stageIdx = (s) => ({ idle: -1, locking: 0, paying: 1, confirming: 2, done: 3 }[s]);

  const pay = () => {
    if (stage !== 'idle') return;
    setStage('locking');
    setTimeout(() => setStage('paying'), 1200);
    setTimeout(() => setStage('confirming'), 2600);
    setTimeout(() => {
      setStage('done');
      onConfirm({
        ...order,
        bookingId: 'BK' + Math.floor(Math.random() * 9e7 + 1e7),
        method,
      });
    }, 3800);
  };

  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        disabled={stage !== 'idle'}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--fg-soft)',
          cursor: stage !== 'idle' ? 'not-allowed' : 'pointer',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          padding: 0,
          opacity: stage !== 'idle' ? 0.4 : 1,
        }}
      >
        ← Back to seats
      </button>

      <div>
        <Mono className="text-[10px] uppercase tracking-[0.3em] block mb-2" style={{ color: 'var(--fg-faint)' }}>
          Step 3 of 3
        </Mono>
        <h1
          style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 56,
            color: 'var(--fg)',
            lineHeight: 1,
          }}
        >
          Payment
        </h1>
      </div>

      <div className="grid gap-8" style={{ gridTemplateColumns: '1fr 380px' }}>
        <div className="space-y-6">
          {/* Method picker */}
          <div>
            <Mono className="text-[10px] uppercase tracking-[0.3em] block mb-3" style={{ color: 'var(--fg-faint)' }}>
              Payment method
            </Mono>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'upi', label: 'UPI' },
                { id: 'card', label: 'Card' },
                { id: 'wallet', label: 'Wallet' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  disabled={stage !== 'idle'}
                  style={{
                    padding: 16,
                    border: `1px solid ${method === m.id ? 'var(--accent)' : 'var(--line)'}`,
                    background: method === m.id ? 'color-mix(in oklch, var(--accent) 8%, transparent)' : 'transparent',
                    color: method === m.id ? 'var(--accent)' : 'var(--fg)',
                    borderRadius: 2,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div
            style={{
              border: '1px solid var(--line)',
              background: 'var(--card)',
              padding: 24,
              borderRadius: 2,
            }}
          >
            {method === 'upi' && (
              <div className="space-y-4">
                <FormField label="UPI ID" value={upiId} onChange={setUpiId} placeholder="yourname@bank" />
                <Mono className="text-[10px] block" style={{ color: 'var(--fg-faint)' }}>
                  You'll receive a collect request on your UPI app.
                </Mono>
              </div>
            )}
            {method === 'card' && (
              <div className="space-y-4">
                <FormField label="Card number" value={cardNum} onChange={setCardNum} placeholder="•••• •••• •••• ••••" />
                <FormField label="Name on card" value={cardName} onChange={setCardName} placeholder="As printed" />
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Expiry" value={cardExp} onChange={setCardExp} placeholder="MM / YY" />
                  <FormField label="CVV" value={cardCvv} onChange={setCardCvv} placeholder="•••" />
                </div>
              </div>
            )}
            {method === 'wallet' && (
              <div className="grid grid-cols-3 gap-2">
                {['Paytm', 'PhonePe', 'Amazon Pay'].map((w) => (
                  <button
                    key={w}
                    style={{
                      padding: 18,
                      border: '1px solid var(--line)',
                      background: 'transparent',
                      borderRadius: 2,
                      color: 'var(--fg)',
                      cursor: 'pointer',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Saga progress */}
          {stage !== 'idle' && (
            <div
              style={{
                border: '1px solid var(--accent)',
                background: 'color-mix(in oklch, var(--accent) 5%, transparent)',
                padding: 24,
                borderRadius: 2,
              }}
            >
              <Mono className="text-[10px] uppercase tracking-[0.3em] block mb-4" style={{ color: 'var(--accent)' }}>
                Saga in progress
              </Mono>
              <div className="space-y-3">
                {stages.map((s, i) => {
                  const idx = stageIdx(stage);
                  const done = i < idx;
                  const active = i === idx;
                  return (
                    <div key={s.key} className="flex items-center gap-3">
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          border: `1px solid ${done || active ? 'var(--accent)' : 'var(--line)'}`,
                          background: done ? 'var(--accent)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 9,
                          color: 'var(--bg)',
                          flexShrink: 0,
                        }}
                      >
                        {done ? '✓' : active ? <span style={{
                          width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
                          animation: 'pulse 1s infinite',
                        }} /> : ''}
                      </span>
                      <div className="flex-1 flex items-baseline justify-between">
                        <Mono className="text-xs uppercase tracking-[0.15em]" style={{ color: done || active ? 'var(--fg)' : 'var(--fg-faint)' }}>
                          {s.label}
                        </Mono>
                        <Mono className="text-[10px]" style={{ color: 'var(--fg-faint)' }}>{s.sub}</Mono>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <aside
          style={{
            border: '1px solid var(--line)',
            background: 'var(--card)',
            padding: 24,
            borderRadius: 2,
            alignSelf: 'start',
          }}
        >
          <Mono className="text-[10px] uppercase tracking-[0.3em] block mb-4" style={{ color: 'var(--fg-faint)' }}>
            Summary
          </Mono>
          <div className="flex gap-3 mb-5">
            <div style={{ width: 64, aspectRatio: '2/3', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
              <Poster movie={order.showtime.movie} className="h-full w-full" />
            </div>
            <div className="min-w-0">
              <div
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontStyle: 'italic',
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--fg)',
                  lineHeight: 1.1,
                }}
              >
                {order.showtime.movie.title}
              </div>
              <Mono className="text-[10px] uppercase tracking-[0.15em] block mt-1" style={{ color: 'var(--fg-faint)' }}>
                {order.showtime.theater.name}
              </Mono>
              <Mono className="text-[10px] uppercase tracking-[0.15em] block mt-0.5" style={{ color: 'var(--fg-faint)' }}>
                {order.showtime.time} · {order.showtime.format}
              </Mono>
            </div>
          </div>

          <div className="space-y-2 py-4" style={{ borderTop: '1px solid var(--line)' }}>
            <Mono className="text-[10px] uppercase tracking-[0.2em] block" style={{ color: 'var(--fg-faint)' }}>
              {order.seats.length} seats
            </Mono>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {order.seats.map((s) => (
                <Mono key={s.id} style={{
                  padding: '3px 7px',
                  border: '1px solid var(--line)',
                  fontSize: 10,
                  borderRadius: 2,
                  color: 'var(--fg)',
                }}>{s.id}</Mono>
              ))}
            </div>
          </div>

          <div className="space-y-2 py-4 text-sm" style={{ borderTop: '1px solid var(--line)' }}>
            <div className="flex justify-between" style={{ color: 'var(--fg-soft)' }}>
              <span>Subtotal</span>
              <Mono>₹{order.subtotal.toLocaleString('en-IN')}</Mono>
            </div>
            <div className="flex justify-between" style={{ color: 'var(--fg-faint)' }}>
              <span>Fees</span>
              <Mono>₹{order.fees.toLocaleString('en-IN')}</Mono>
            </div>
          </div>

          <div className="flex justify-between items-baseline py-4" style={{ borderTop: '1px solid var(--line)' }}>
            <Mono className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--fg-faint)' }}>Total</Mono>
            <Mono style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg)' }}>
              ₹{order.total.toLocaleString('en-IN')}
            </Mono>
          </div>

          <button
            onClick={pay}
            disabled={stage !== 'idle'}
            style={{
              width: '100%',
              padding: 14,
              background: stage !== 'idle' ? 'var(--line)' : 'var(--accent)',
              color: stage !== 'idle' ? 'var(--fg-faint)' : 'var(--bg)',
              border: 'none',
              borderRadius: 2,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: stage !== 'idle' ? 'not-allowed' : 'pointer',
            }}
          >
            {stage === 'idle' ? 'Pay ₹' + order.total.toLocaleString('en-IN') : 'Processing…'}
          </button>
        </aside>
      </div>
    </div>
  );
};

const FormField = ({ label, value, onChange, placeholder }) => (
  <div>
    <Mono className="text-[10px] uppercase tracking-[0.2em] block mb-1.5" style={{ color: 'var(--fg-faint)' }}>
      {label}
    </Mono>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 12px',
        background: 'transparent',
        border: '1px solid var(--line)',
        color: 'var(--fg)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 14,
        borderRadius: 2,
        outline: 'none',
      }}
    />
  </div>
);

const ConfirmationScreen = ({ booking, onDone }) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'color-mix(in oklch, var(--accent) 15%, transparent)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: 28,
            border: '1px solid var(--accent)',
          }}
        >
          ✓
        </div>
        <Mono className="text-[10px] uppercase tracking-[0.3em] block mb-3" style={{ color: 'var(--accent)' }}>
          Booking confirmed
        </Mono>
        <h1
          style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 56,
            color: 'var(--fg)',
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          See you at the screen.
        </h1>
        <Mono className="text-xs block" style={{ color: 'var(--fg-soft)' }}>
          Booking ID · {booking.bookingId}
        </Mono>
      </div>

      {/* Ticket */}
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          border: '1px solid var(--line)',
          background: 'var(--card)',
          borderRadius: 2,
          position: 'relative',
        }}
      >
        {/* perforated divider */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '70%',
            height: 0,
            borderTop: '1px dashed var(--line)',
          }}
        />
        <div style={{ position: 'absolute', left: -8, top: 'calc(70% - 8px)', width: 16, height: 16, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--line)' }} />
        <div style={{ position: 'absolute', right: -8, top: 'calc(70% - 8px)', width: 16, height: 16, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--line)' }} />

        <div className="grid gap-6 p-8" style={{ gridTemplateColumns: '120px 1fr' }}>
          <div style={{ aspectRatio: '2/3', borderRadius: 2, overflow: 'hidden' }}>
            <Poster movie={booking.showtime.movie} className="h-full w-full" />
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <h2
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: 36,
                  color: 'var(--fg)',
                  lineHeight: 0.95,
                }}
              >
                {booking.showtime.movie.title}
              </h2>
              <Mono className="text-[10px] uppercase tracking-[0.2em] mt-2 block" style={{ color: 'var(--fg-soft)' }}>
                {booking.showtime.format} · {booking.showtime.language}
              </Mono>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Theater" value={booking.showtime.theater.name} />
              <Field label="Screen" value="Screen 4" />
              <Field label="Time" value={booking.showtime.time} mono />
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-8 pb-8 pt-6" style={{ gridTemplateColumns: '1fr auto' }}>
          <div className="grid grid-cols-3 gap-6">
            <Field
              label="Seats"
              value={booking.seats.map((s) => s.id).join(', ')}
              mono
            />
            <Field label="Tier" value={booking.seats[0]?.tier ?? '—'} />
            <Field label="Total paid" value={`₹${booking.total.toLocaleString('en-IN')}`} mono />
          </div>
          {/* Faux QR */}
          <div
            style={{
              width: 96,
              height: 96,
              background: `repeating-linear-gradient(0deg, var(--fg) 0 4px, transparent 4px 7px),
                           repeating-linear-gradient(90deg, var(--fg) 0 4px, transparent 4px 7px)`,
              border: '1px solid var(--line)',
              borderRadius: 2,
              opacity: 0.85,
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', inset: 12, background: 'var(--card)' }} />
            <div style={{ position: 'absolute', top: 6, left: 6, width: 14, height: 14, border: '3px solid var(--fg)' }} />
            <div style={{ position: 'absolute', top: 6, right: 6, width: 14, height: 14, border: '3px solid var(--fg)' }} />
            <div style={{ position: 'absolute', bottom: 6, left: 6, width: 14, height: 14, border: '3px solid var(--fg)' }} />
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onDone}
          style={{
            padding: '12px 28px',
            background: 'transparent',
            border: '1px solid var(--line)',
            color: 'var(--fg)',
            borderRadius: 2,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Book another →
        </button>
      </div>
    </div>
  );
};

const Field = ({ label, value, mono }) => (
  <div>
    <Mono className="text-[10px] uppercase tracking-[0.2em] block" style={{ color: 'var(--fg-faint)' }}>
      {label}
    </Mono>
    <div
      className="mt-1"
      style={{
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
        fontSize: 14,
        color: 'var(--fg)',
        fontWeight: mono ? 500 : 400,
      }}
    >
      {value}
    </div>
  </div>
);

Object.assign(window, { PaymentScreen, ConfirmationScreen });
