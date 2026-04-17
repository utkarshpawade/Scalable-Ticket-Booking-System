'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

export type SeatState = 'AVAILABLE' | 'SELECTED' | 'LOCKED' | 'BOOKED';

export interface Seat {
  id: string;     // e.g. "A1"
  row: string;    // "A"
  col: number;    // 1
  price: number;
}

interface SeatMapProps {
  movieId: string;
  showtimeId: string;
  userId?: string;
  socketUrl?: string;
  onSelectionChange?: (selected: Seat[]) => void;
}

// Default theater layout — 6 rows (A-F) × 10 cols. Back rows cost more (premium).
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const COLS = Array.from({ length: 10 }, (_, i) => i + 1);

function buildDefaultSeats(): Seat[] {
  const seats: Seat[] = [];
  for (const row of ROWS) {
    const premium = row === 'E' || row === 'F';
    for (const col of COLS) {
      seats.push({
        id: `${row}${col}`,
        row,
        col,
        price: premium ? 350 : 250,
      });
    }
  }
  return seats;
}

export default function SeatMap({
  movieId,
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

  // ---------- Socket wiring ----------
  useEffect(() => {
    // Connect through the NGINX gateway by default. Next.js rewrites /socket.io/*
    // so a same-origin connection works in dev.
    const url = socketUrl ?? (typeof window !== 'undefined' ? window.location.origin : '/');

    const socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Join the per-showtime room — every lock/release/book event
      // is broadcast only to members of this room.
      socket.emit('join:showtime', showtimeId);
    });

    socket.on('disconnect', () => setConnected(false));

    // ---- Inbound broadcasts ----
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

    socket.on('seat_locked', (evt: { showtimeId: string; seatIds: string[]; by?: string }) => {
      if (evt.showtimeId !== showtimeId) return;
      // If I locked it myself the local click already marked it SELECTED; only flip
      // to LOCKED (grey) when another user is the owner.
      const mine = evt.by && evt.by === userId;
      applyStatus(evt.seatIds, mine ? 'SELECTED' : 'LOCKED');
      if (!mine) {
        setSelected((prev) => {
          const next = new Set(prev);
          evt.seatIds.forEach((id) => next.delete(id));
          return next;
        });
      }
    });

    socket.on('seat_released', (evt: { showtimeId: string; seatIds: string[] }) => {
      if (evt.showtimeId !== showtimeId) return;
      applyStatus(evt.seatIds, 'AVAILABLE');
    });

    socket.on('seat_booked', (evt: { showtimeId: string; seatIds: string[] }) => {
      if (evt.showtimeId !== showtimeId) return;
      applyStatus(evt.seatIds, 'BOOKED');
      setSelected((prev) => {
        const next = new Set(prev);
        evt.seatIds.forEach((id) => next.delete(id));
        return next;
      });
    });

    // Backwards-compat with the generic broadcast the seat-service emits today.
    socket.on(
      'seat_status_changed',
      (evt: { showtimeId: string; seatIds: string[]; status: 'LOCKED' | 'AVAILABLE' | 'SOLD' }) => {
        if (evt.showtimeId !== showtimeId) return;
        const map = { LOCKED: 'LOCKED', AVAILABLE: 'AVAILABLE', SOLD: 'BOOKED' } as const;
        applyStatus(evt.seatIds, map[evt.status]);
      },
    );

    // Load initial snapshot.
    (async () => {
      try {
        const res = await fetch(`/api/seats/showtimes/${showtimeId}/seats`);
        if (!res.ok) return;
        const { locked, sold } = await res.json();
        applyStatus(locked ?? [], 'LOCKED');
        applyStatus(sold ?? [], 'BOOKED');
      } catch {
        /* initial snapshot is optional — realtime events will still flow */
      }
    })();

    return () => {
      socket.emit('leave:showtime', showtimeId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [showtimeId, userId, socketUrl]);

  // Bubble selection up so CheckoutPanel can price it.
  useEffect(() => {
    onSelectionChange?.(seats.filter((s) => selected.has(s.id)));
  }, [selected, seats, onSelectionChange]);

  // ---------- Click handler ----------
  const toggleSeat = useCallback(
    (seat: Seat) => {
      const s = statusMap[seat.id];
      if (s === 'LOCKED' || s === 'BOOKED') return;

      const socket = socketRef.current;
      const isSelected = selected.has(seat.id);

      setSelected((prev) => {
        const next = new Set(prev);
        if (isSelected) next.delete(seat.id);
        else next.add(seat.id);
        return next;
      });

      // Optimistic local state; server broadcast is the source of truth.
      setStatusMap((prev) => {
        const next = { ...prev };
        if (isSelected) delete next[seat.id];
        else next[seat.id] = 'SELECTED';
        return next;
      });

      if (!socket) return;
      socket.emit(isSelected ? 'release_seat' : 'lock_seat', {
        showtimeId,
        movieId,
        seatIds: [seat.id],
        userId,
      });
    },
    [movieId, showtimeId, userId, selected, statusMap],
  );

  // ---------- Render ----------
  const seatClass = (seat: Seat): string => {
    const base =
      'flex h-9 w-9 items-center justify-center rounded-md text-xs font-medium transition select-none';
    const st = statusMap[seat.id];
    if (st === 'BOOKED')
      return `${base} bg-red-900/60 text-red-300 cursor-not-allowed line-through`;
    if (st === 'LOCKED')
      return `${base} bg-slate-600 text-slate-300 cursor-not-allowed`;
    if (selected.has(seat.id) || st === 'SELECTED')
      return `${base} bg-brand-600 text-white ring-2 ring-brand-400 cursor-pointer`;
    return `${base} bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/40 cursor-pointer`;
  };

  const rows = useMemo(() => {
    const grouped: Record<string, Seat[]> = {};
    for (const s of seats) (grouped[s.row] ??= []).push(s);
    for (const r of Object.values(grouped)) r.sort((a, b) => a.col - b.col);
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [seats]);

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      {/* Connection indicator */}
      <div className="flex w-full items-center justify-between text-xs">
        <span className="text-slate-400">Showtime: {showtimeId}</span>
        <span
          className={`flex items-center gap-1.5 ${
            connected ? 'text-emerald-400' : 'text-amber-400'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          {connected ? 'Live' : 'Connecting…'}
        </span>
      </div>

      {/* Screen */}
      <div className="w-full">
        <div
          className="mx-auto h-2 w-3/4 rounded-t-[50%] bg-gradient-to-b from-slate-200 to-slate-600 shadow-[0_0_40px_10px_rgba(226,232,240,0.25)]"
          aria-hidden
        />
        <p className="mt-2 text-center text-xs uppercase tracking-[0.3em] text-slate-400">
          Screen
        </p>
      </div>

      {/* Seat grid */}
      <div className="flex flex-col gap-2">
        {rows.map(([row, rowSeats]) => (
          <div key={row} className="flex items-center gap-2">
            <span className="w-5 text-center text-xs font-semibold text-slate-400">
              {row}
            </span>
            <div className="flex gap-1.5">
              {rowSeats.slice(0, 5).map((seat) => (
                <button
                  key={seat.id}
                  onClick={() => toggleSeat(seat)}
                  className={seatClass(seat)}
                  disabled={
                    statusMap[seat.id] === 'LOCKED' ||
                    statusMap[seat.id] === 'BOOKED'
                  }
                  aria-label={`Seat ${seat.id}`}
                >
                  {seat.col}
                </button>
              ))}
              {/* Aisle */}
              <div className="w-4" aria-hidden />
              {rowSeats.slice(5).map((seat) => (
                <button
                  key={seat.id}
                  onClick={() => toggleSeat(seat)}
                  className={seatClass(seat)}
                  disabled={
                    statusMap[seat.id] === 'LOCKED' ||
                    statusMap[seat.id] === 'BOOKED'
                  }
                  aria-label={`Seat ${seat.id}`}
                >
                  {seat.col}
                </button>
              ))}
            </div>
            <span className="w-5 text-center text-xs font-semibold text-slate-400">
              {row}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-sm bg-emerald-500/20 ring-1 ring-emerald-400/40" />
          Available
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-sm bg-brand-600" /> Selected
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-sm bg-slate-600" /> Locked
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-sm bg-red-900/60" /> Booked
        </span>
      </div>
    </div>
  );
}
