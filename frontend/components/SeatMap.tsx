'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SEAT_SOCKET_URL } from '../lib/api';
import { Mono } from './ui';

export type SeatState = 'AVAILABLE' | 'SELECTED' | 'LOCKED' | 'BOOKED';

export interface Seat {
  id: string;
  row: string;
  col: number;
  price: number;
  tier: string;
}

interface SeatMapProps {
  movieId: string;
  showtimeId: string;
  userId?: string;
  socketUrl?: string;
  onSelectionChange?: (selected: Seat[]) => void;
}

// 6 rows × 10 cols, grouped into tiers.
//   A, B → Standard
//   C, D → Prime
//   E    → Premium
//   F    → Recliner
const ROW_DEFS: Array<{ row: string; tier: string; price: number }> = [
  { row: 'A', tier: 'Standard', price: 280 },
  { row: 'B', tier: 'Standard', price: 280 },
  { row: 'C', tier: 'Prime',    price: 380 },
  { row: 'D', tier: 'Prime',    price: 380 },
  { row: 'E', tier: 'Premium',  price: 480 },
  { row: 'F', tier: 'Recliner', price: 650 },
];
const COLS = Array.from({ length: 10 }, (_, i) => i + 1);

function buildDefaultSeats(): Seat[] {
  const seats: Seat[] = [];
  for (const def of ROW_DEFS) {
    for (const col of COLS) {
      seats.push({
        id: `${def.row}${col}`,
        row: def.row,
        col,
        price: def.price,
        tier: def.tier,
      });
    }
  }
  return seats;
}

export default function SeatMap({
  movieId: _movieId,
  showtimeId,
  userId = 'user_123',
  socketUrl,
  onSelectionChange,
}: SeatMapProps) {
  const seats = useMemo(() => buildDefaultSeats(), []);

  const [statusMap, setStatusMap] = useState<Record<string, SeatState>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // ---------- Socket wiring (unchanged) ----------
  useEffect(() => {
    const url = socketUrl ?? SEAT_SOCKET_URL;

    const socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join:showtime', showtimeId);
    });
    socket.on('disconnect', () => setConnected(false));

    const applyStatus = (ids: string[], state: SeatState) => {
      setStatusMap((prev) => {
        const next = { ...prev };
        for (const id of ids) {
          if (state === 'AVAILABLE') delete next[id];
          else next[id] = state;
        }
        return next;
      });
    };

    socket.on(
      'seat_locked',
      (evt: { showtimeId: string; seatIds: string[]; by?: string }) => {
        if (evt.showtimeId !== showtimeId) return;
        const mine = evt.by && evt.by === userId;
        applyStatus(evt.seatIds, mine ? 'SELECTED' : 'LOCKED');
        if (!mine) {
          setSelected((prev) => {
            const next = new Set(prev);
            evt.seatIds.forEach((id) => next.delete(id));
            return next;
          });
        }
      },
    );

    socket.on(
      'seat_released',
      (evt: { showtimeId: string; seatIds: string[] }) => {
        if (evt.showtimeId !== showtimeId) return;
        applyStatus(evt.seatIds, 'AVAILABLE');
      },
    );

    socket.on(
      'seat_booked',
      (evt: { showtimeId: string; seatIds: string[] }) => {
        if (evt.showtimeId !== showtimeId) return;
        applyStatus(evt.seatIds, 'BOOKED');
        setSelected((prev) => {
          const next = new Set(prev);
          evt.seatIds.forEach((id) => next.delete(id));
          return next;
        });
      },
    );

    socket.on(
      'seat_status_changed',
      (evt: {
        showtimeId: string;
        seatIds: string[];
        status: 'LOCKED' | 'AVAILABLE' | 'SOLD';
      }) => {
        if (evt.showtimeId !== showtimeId) return;
        const map = { LOCKED: 'LOCKED', AVAILABLE: 'AVAILABLE', SOLD: 'BOOKED' } as const;
        applyStatus(evt.seatIds, map[evt.status]);
      },
    );

    (async () => {
      try {
        const res = await fetch(`/api/seats/showtimes/${showtimeId}/seats`);
        if (!res.ok) return;
        const { locked, sold } = await res.json();
        applyStatus(locked ?? [], 'LOCKED');
        applyStatus(sold ?? [], 'BOOKED');
      } catch {
        /* optional */
      }
    })();

    return () => {
      socket.emit('leave:showtime', showtimeId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [showtimeId, userId, socketUrl]);

  useEffect(() => {
    onSelectionChange?.(seats.filter((s) => selected.has(s.id)));
  }, [selected, seats, onSelectionChange]);

  const toggleSeat = useCallback(
    (seat: Seat) => {
      const s = statusMap[seat.id];
      if (s === 'LOCKED' || s === 'BOOKED') return;
      const isSelected = selected.has(seat.id);

      setSelected((prev) => {
        const next = new Set(prev);
        if (isSelected) next.delete(seat.id);
        else next.add(seat.id);
        return next;
      });
      setStatusMap((prev) => {
        const next = { ...prev };
        if (isSelected) delete next[seat.id];
        else next[seat.id] = 'SELECTED';
        return next;
      });
    },
    [selected, statusMap],
  );

  // Group seats by tier → rows
  const groups = useMemo(() => {
    const byTier: Array<{ tier: string; price: number; rows: Array<{ row: string; seats: Seat[] }> }> = [];
    for (const def of ROW_DEFS) {
      const rowSeats = seats.filter((s) => s.row === def.row).sort((a, b) => a.col - b.col);
      const lastGroup = byTier[byTier.length - 1];
      if (lastGroup && lastGroup.tier === def.tier) {
        lastGroup.rows.push({ row: def.row, seats: rowSeats });
      } else {
        byTier.push({ tier: def.tier, price: def.price, rows: [{ row: def.row, seats: rowSeats }] });
      }
    }
    return byTier;
  }, [seats]);

  const seatStyle = (seat: Seat): React.CSSProperties => {
    const s = statusMap[seat.id];
    const isSel = selected.has(seat.id) || s === 'SELECTED';
    const isLocked = s === 'LOCKED';
    const isBooked = s === 'BOOKED';

    let bg = 'transparent';
    let border = '1px solid var(--seat-line, var(--line))';
    let color = 'var(--fg-soft)';
    let cursor: React.CSSProperties['cursor'] = 'pointer';
    let textDecoration: React.CSSProperties['textDecoration'] = 'none';

    if (isBooked) {
      bg = 'transparent';
      border = '1px solid transparent';
      color = 'var(--fg-faint)';
      cursor = 'not-allowed';
      textDecoration = 'line-through';
    } else if (isLocked) {
      bg = 'var(--seat-locked, var(--line))';
      border = '1px solid var(--seat-locked, var(--line))';
      color = 'var(--fg-faint)';
      cursor = 'not-allowed';
    } else if (isSel) {
      bg = 'var(--accent)';
      border = '1px solid var(--accent)';
      color = 'var(--bg)';
    }

    return {
      width: 32,
      height: 32,
      borderRadius: '4px 4px 2px 2px',
      background: bg,
      border,
      color,
      cursor,
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 9,
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.15s',
      textDecoration,
      padding: 0,
    };
  };

  const soldCount = Object.values(statusMap).filter((v) => v === 'BOOKED').length;
  const heldCount = Object.values(statusMap).filter((v) => v === 'LOCKED').length;

  return (
    <div
      className="rounded-sharp"
      style={{
        border: '1px solid var(--line)',
        background: 'var(--card)',
        padding: '32px 28px',
      }}
    >
      {/* Live indicator */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={connected ? 'animate-pulse-dot' : ''}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: connected ? 'var(--accent)' : 'var(--fg-faint)',
            }}
          />
          <Mono
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: 'var(--fg-soft)' }}
          >
            {connected ? 'Live · synced with seat-service' : 'Connecting…'}
          </Mono>
        </div>
        <Mono
          className="text-[10px] uppercase tracking-[0.2em]"
          style={{ color: 'var(--fg-faint)' }}
        >
          {soldCount} sold · {heldCount} held
        </Mono>
      </div>

      {/* Screen */}
      <div className="mb-8">
        <div
          className="mx-auto h-1"
          style={{
            width: '70%',
            background:
              'linear-gradient(90deg, transparent, var(--accent), transparent)',
            borderRadius: 999,
            boxShadow:
              '0 0 40px 6px color-mix(in oklch, var(--accent) 30%, transparent)',
          }}
        />
        <Mono
          className="mt-3 block text-center text-[9px] tracking-[0.4em]"
          style={{ color: 'var(--fg-faint)' }}
        >
          SCREEN
        </Mono>
      </div>

      {/* Tier groups */}
      {groups.map((g, gi) => (
        <div
          key={g.tier}
          style={{ marginBottom: gi === groups.length - 1 ? 0 : 24 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <Mono
              className="text-[9px] uppercase tracking-[0.25em]"
              style={{ color: 'var(--fg-faint)' }}
            >
              {g.tier}
            </Mono>
            <Mono
              className="text-[9px] uppercase tracking-[0.25em]"
              style={{ color: 'var(--fg-faint)' }}
            >
              ₹{g.price}
            </Mono>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            {g.rows.map((r) => (
              <div key={r.row} className="flex items-center gap-1.5">
                <Mono
                  style={{
                    width: 16,
                    fontSize: 10,
                    color: 'var(--fg-faint)',
                    textAlign: 'center',
                  }}
                >
                  {r.row}
                </Mono>
                <div className="flex gap-1.5">
                  {r.seats.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => toggleSeat(s)}
                      style={seatStyle(s)}
                      disabled={
                        statusMap[s.id] === 'LOCKED' ||
                        statusMap[s.id] === 'BOOKED'
                      }
                      aria-label={`Seat ${s.id}`}
                    >
                      {s.col}
                    </button>
                  ))}
                </div>
                <div style={{ width: 16 }} />
                <div className="flex gap-1.5">
                  {r.seats.slice(5).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => toggleSeat(s)}
                      style={seatStyle(s)}
                      disabled={
                        statusMap[s.id] === 'LOCKED' ||
                        statusMap[s.id] === 'BOOKED'
                      }
                      aria-label={`Seat ${s.id}`}
                    >
                      {s.col}
                    </button>
                  ))}
                </div>
                <Mono
                  style={{
                    width: 16,
                    fontSize: 10,
                    color: 'var(--fg-faint)',
                    textAlign: 'center',
                  }}
                >
                  {r.row}
                </Mono>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div
        className="mt-8 flex flex-wrap items-center justify-center gap-5 pt-6"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        {[
          {
            label: 'Available',
            style: {
              border: '1px solid var(--seat-line, var(--line))',
              background: 'transparent',
            } as React.CSSProperties,
          },
          {
            label: 'Selected',
            style: { background: 'var(--accent)' } as React.CSSProperties,
          },
          {
            label: 'Held',
            style: {
              background: 'var(--seat-locked, var(--line))',
            } as React.CSSProperties,
          },
          {
            label: 'Sold',
            style: { border: '1px dashed var(--line)' } as React.CSSProperties,
          },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                ...l.style,
              }}
            />
            <Mono
              className="text-[10px] uppercase tracking-[0.15em]"
              style={{ color: 'var(--fg-soft)' }}
            >
              {l.label}
            </Mono>
          </div>
        ))}
      </div>
    </div>
  );
}
