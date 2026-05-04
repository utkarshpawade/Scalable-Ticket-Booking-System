import express, { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const PORT = Number(process.env.PORT ?? 4001);
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me';
const JWT_TTL = '7d';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 10,
});

const app = express();
app.use(express.json());

// CORS — driven by CORS_ORIGINS env (comma-separated list, or "*").
const allowed = (process.env.CORS_ORIGINS ?? '*').split(',').map((s) => s.trim());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowed.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

interface JwtUser {
  sub: string;
  email: string;
  name: string;
  role: string;
}

function sign(user: JwtUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_TTL });
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing bearer token' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as JwtUser;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

// POST /signup — create a user, return JWT + user (with UUID).
app.post('/signup', async (req: Request, res: Response) => {
  const { email, password, name } = req.body ?? {};
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'valid email required' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }
  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'name required' });
  }

  const normEmail = email.trim().toLowerCase();
  const hash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, role`,
      [normEmail, hash, name.trim()],
    );
    const u = rows[0];
    const token = sign({ sub: u.id, email: u.email, name: u.full_name, role: u.role });
    return res.status(201).json({
      token,
      user: { userId: u.id, email: u.email, name: u.full_name, role: u.role },
    });
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'email already registered' });
    }
    console.error('[signup] error', err);
    return res.status(500).json({ error: 'signup failed' });
  }
});

// POST /login — verify creds, return JWT + user.
app.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'email and password required' });
  }
  const normEmail = email.trim().toLowerCase();

  try {
    const { rows } = await pool.query(
      `SELECT id, email, password_hash, full_name, role, is_active
         FROM users WHERE email = $1 LIMIT 1`,
      [normEmail],
    );
    const u = rows[0];
    if (!u || !u.is_active) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const token = sign({ sub: u.id, email: u.email, name: u.full_name, role: u.role });
    return res.json({
      token,
      user: { userId: u.id, email: u.email, name: u.full_name, role: u.role },
    });
  } catch (err) {
    console.error('[login] error', err);
    return res.status(500).json({ error: 'login failed' });
  }
});

// GET /me — return current user from JWT, refreshed from DB.
app.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const claims = (req as any).user as JwtUser;
  try {
    const { rows } = await pool.query(
      `SELECT id, email, full_name, role FROM users WHERE id = $1 LIMIT 1`,
      [claims.sub],
    );
    const u = rows[0];
    if (!u) return res.status(404).json({ error: 'user not found' });
    return res.json({ userId: u.id, email: u.email, name: u.full_name, role: u.role });
  } catch (err) {
    console.error('[me] error', err);
    return res.status(500).json({ error: 'lookup failed' });
  }
});

app.listen(PORT, () => console.log(`[user-service] :${PORT}`));
