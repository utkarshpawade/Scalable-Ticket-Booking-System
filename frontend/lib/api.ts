import axios, { AxiosInstance } from 'axios';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080/api';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token if present (set by login flow).
client.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  const res = await client.get('/catalog/movies', { params });
  return res.data;
}

export async function getMovie(
  id: string,
): Promise<{ movie: Movie; showtimes: unknown[] }> {
  const res = await client.get(`/catalog/movies/${id}`);
  return res.data;
}

export async function getRecommendations(
  userId: string,
  history: { movie_id: string; rating: number }[] = [],
  topN = 10,
): Promise<RecommendedMovie[]> {
  const res = await client.post('/recommend/recommendations', {
    user_id: userId,
    history,
    top_n: topN,
  });
  return res.data;
}

export async function getPopular(limit = 10): Promise<RecommendedMovie[]> {
  const res = await client.get('/recommend/recommendations/popular', {
    params: { limit },
  });
  return res.data;
}

export async function bookTicket(
  payload: BookingPayload,
): Promise<{ bookingId: string }> {
  const res = await client.post('/bookings/bookings', payload);
  return res.data;
}

export async function getMe(): Promise<{
  userId: string;
  name: string;
  email: string;
}> {
  const res = await client.get('/users/me');
  return res.data;
}

export default client;
