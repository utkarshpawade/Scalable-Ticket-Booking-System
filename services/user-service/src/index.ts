import express, { Request, Response } from 'express';

const PORT = Number(process.env.PORT ?? 4001);

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

app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Dummy "current user" — wire real JWT auth later.
app.get('/me', (_req: Request, res: Response) => {
  res.json({
    userId: 'user_123',
    name: 'Demo User',
    email: 'demo@ticket.local',
    role: 'customer',
  });
});

// Stubbed login that returns a fake token for local dev.
app.post('/login', (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  res.json({
    token: 'dev-token-replace-with-jwt',
    user: {
      userId: 'user_123',
      name: 'Demo User',
      email: email ?? 'demo@ticket.local',
    },
  });
});

app.listen(PORT, () => console.log(`[user-service] :${PORT}`));
