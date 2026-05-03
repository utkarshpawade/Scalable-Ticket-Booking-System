import axios, { AxiosInstance } from 'axios';

// ============================================================
// Service URL resolution
//
// In LOCAL DEV, all services are reachable through the Nginx
// gateway at NEXT_PUBLIC_API_BASE (default http://localhost:8080/api).
//
// In PRODUCTION (no nginx — services deployed separately on Render),
// each service has its own URL set via NEXT_PUBLIC_*_URL env vars.
// ============================================================

const GATEWAY_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080/api';

const USER_URL    = process.env.NEXT_PUBLIC_USER_URL    ?? `${GATEWAY_BASE}/users`;
const CATALOG_URL = process.env.NEXT_PUBLIC_CATALOG_URL ?? `${GATEWAY_BASE}/catalog`;
const SEAT_URL    = process.env.NEXT_PUBLIC_SEAT_URL    ?? `${GATEWAY_BASE}/seats`;
const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL ?? `${GATEWAY_BASE}/bookings`;
const RECO_URL    = process.env.NEXT_PUBLIC_RECO_URL    ?? `${GATEWAY_BASE}/recommend`;

// Public so SeatMap can connect Socket.io directly.
//
// Socket.io needs the HOST URL (not the /api/seats path).
//   - PRODUCTION: NEXT_PUBLIC_SEAT_URL is the bare host of seat-service.
//   - LOCAL DEV (gateway): strip `/api` from NEXT_PUBLIC_API_BASE so we
//     hit nginx at http://localhost:8080 which proxies /socket.io.
export const SEAT_SOCKET_URL =
  process.env.NEXT_PUBLIC_SEAT_URL
  ?? process.env.NEXT_PUBLIC_API_BASE?.replace(/\/api\/?$/, '')
  ?? 'http://localhost:8080';

function makeClient(baseURL: string): AxiosInstance {
  const c = axios.create({
    baseURL,
    timeout: 8000,
    headers: { 'Content-Type': 'application/json' },
  });
  c.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('auth_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return c;
}

const userClient    = makeClient(USER_URL);
const catalogClient = makeClient(CATALOG_URL);
const seatClient    = makeClient(SEAT_URL);
const bookingClient = makeClient(BOOKING_URL);
const recoClient    = makeClient(RECO_URL);

// --- Types ---
export interface Movie {
  _id: string;
  title: string;
  genres: string[];
  durationMin: number;
  rating: number;
  posterUrl?: string;
  description?: string;
  releaseDate?: string;
}

export interface BookingPayload {
  userId: string;
  showtimeId: string;
  seatIds: string[];
  amount: number;
  idempotencyKey: string;
}

export interface RecommendedMovie {
  movie_id: string;
  title: string;
  genres: string[];
  score: number;
}

// --- API methods ---
export async function getMovies(params?: {
  genre?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: Movie[]; total: number; page: number; limit: number }> {
  const res = await catalogClient.get('/movies', { params });
  return res.data;
}

export async function getMovie(
  id: string,
): Promise<{ movie: Movie; showtimes: unknown[] }> {
  const res = await catalogClient.get(`/movies/${id}`);
  return res.data;
}

export async function getRecommendations(
  userId: string,
  history: { movie_id: string; rating: number }[] = [],
  topN = 10,
): Promise<RecommendedMovie[]> {
  const res = await recoClient.post('/recommendations', {
    user_id: userId,
    history,
    top_n: topN,
  });
  return res.data;
}

export async function getPopular(limit = 10): Promise<RecommendedMovie[]> {
  const res = await recoClient.get('/recommendations/popular', {
    params: { limit },
  });
  return res.data;
}

export async function bookTicket(
  payload: BookingPayload,
): Promise<{ bookingId: string }> {
  const res = await bookingClient.post('/bookings', payload);
  return res.data;
}

export async function getMe(): Promise<{
  userId: string;
  name: string;
  email: string;
}> {
  const res = await userClient.get('/me');
  return res.data;
}

export async function lockSeats(
  showtimeId: string,
  seatIds: string[],
  userId: string,
): Promise<{ success: boolean; lockToken?: string; expiresAt?: string }> {
  const res = await seatClient.post(`/showtimes/${showtimeId}/lock`, {
    seatIds,
    userId,
  });
  return res.data;
}

export default catalogClient;
