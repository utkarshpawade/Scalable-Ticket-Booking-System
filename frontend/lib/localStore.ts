'use client';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
}

export interface LocalBooking {
  bookingId: string;
  userId: string;
  showtimeId: string;
  movieId?: string;
  movieTitle?: string;
  posterUrl?: string;
  seatIds: string[];
  amount: number;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  paidAt?: string;
}

const USER_KEY = 'cinebook:user';
const TOKEN_KEY = 'auth_token';
const BOOKINGS_KEY = 'cinebook:bookings';

export function setAuthToken(token: string | null) {
  if (!isBrowser()) return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getUser(): AuthUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setUser(u: AuthUser | null) {
  if (!isBrowser()) return;
  if (u) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(u));
  } else {
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
  }
  window.dispatchEvent(new Event('cinebook:auth'));
}

export function listBookings(): LocalBooking[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(BOOKINGS_KEY);
    return raw ? (JSON.parse(raw) as LocalBooking[]) : [];
  } catch {
    return [];
  }
}

export function saveBooking(b: LocalBooking) {
  if (!isBrowser()) return;
  const all = listBookings().filter((x) => x.bookingId !== b.bookingId);
  all.unshift(b);
  window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event('cinebook:bookings'));
}

export function getBooking(id: string): LocalBooking | undefined {
  return listBookings().find((b) => b.bookingId === id);
}

export function updateBooking(
  id: string,
  patch: Partial<LocalBooking>,
): LocalBooking | undefined {
  const b = getBooking(id);
  if (!b) return undefined;
  const updated = { ...b, ...patch };
  saveBooking(updated);
  return updated;
}

export function newBookingId(): string {
  return 'bk_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
