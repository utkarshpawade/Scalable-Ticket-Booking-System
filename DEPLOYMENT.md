# Deployment Guide — Free Tier

Step-by-step guide to deploy this project entirely on free tiers.

## Architecture (production)

```
[Browser] ──> [Vercel: Next.js frontend]
                    │
                    ├──> https://user-service-xxx.onrender.com
                    ├──> https://catalog-service-xxx.onrender.com
                    ├──> https://seat-service-xxx.onrender.com  (also Socket.io)
                    ├──> https://booking-service-xxx.onrender.com
                    └──> https://recommendation-service-xxx.onrender.com
                              │
                              ├── Postgres   → Neon
                              ├── MongoDB    → MongoDB Atlas
                              ├── Redis      → Upstash
                              └── RabbitMQ   → CloudAMQP
```

No Nginx in production. Each service is its own public HTTPS endpoint on Render.

---

## ⚠️ Free-tier limits to know upfront

| Provider | Free tier | What breaks at the limit |
|---|---|---|
| **Render** | 750 hrs/mo across all web services; spin down after 15 min idle | First request after idle takes ~30s. With 5 services, expect cold starts. |
| **Neon (Postgres)** | 0.5 GB storage, autoscale-to-zero | Auto-suspend after inactivity; first query wakes it up (~1s). |
| **MongoDB Atlas M0** | 512 MB, shared cluster | Slower queries than paid; 100 connections cap. |
| **Upstash Redis** | 256 MB, 10K commands/day | After 10K commands, requests fail until next day. |
| **CloudAMQP Little Lemur** | 1M msgs/mo, 20 concurrent connections, 100 queues | Plenty for demo traffic. |
| **Vercel Hobby** | 100 GB bandwidth, unlimited requests | Bandwidth resets monthly. |

For a portfolio demo with low traffic, you'll fit comfortably. For real users, you'll hit limits fast.

---

## Step 1 — Sign up for the providers (~30 min)

Open these in tabs and create free accounts. **Don't add credit cards** unless asked (none of these require one for the free tier listed):

1. **GitHub** — your repo must be on GitHub for Render & Vercel to auto-deploy. https://github.com
2. **Render** — https://render.com (sign in with GitHub)
3. **Vercel** — https://vercel.com (sign in with GitHub)
4. **Neon** — https://neon.tech (sign in with GitHub)
5. **MongoDB Atlas** — https://www.mongodb.com/cloud/atlas/register
6. **Upstash** — https://upstash.com (sign in with GitHub)
7. **CloudAMQP** — https://www.cloudamqp.com (sign up with email)

---

## Step 2 — Push your code to GitHub

If you haven't already:

```powershell
cd "c:\PROJECTS\Scalable Ticket Booking"
git remote add origin https://github.com/<your-username>/scalable-ticket-booking.git
git push -u origin main
```

---

## Step 3 — Provision the databases

You'll collect 4 connection strings here. Save them in a notepad — you'll paste them into Render in step 4.

### 3a. Neon — Postgres

1. Create a new project. Name it `ticket-booking`.
2. Copy the **Connection string** shown after creation (looks like `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`).
3. Open the SQL editor (left sidebar) and paste the contents of [postgres/init.sql](postgres/init.sql). Click **Run**. This creates the `users`, `bookings`, `outbox` tables.

📌 Save: `POSTGRES_URL=postgresql://...`

### 3b. MongoDB Atlas

1. Create a free M0 cluster. Pick the cloud/region closest to where you'll deploy on Render (Oregon = AWS us-west-2).
2. Under **Database Access** → create a user with password (note these down).
3. Under **Network Access** → add IP `0.0.0.0/0` (allow from anywhere — needed because Render's IPs aren't fixed).
4. Click **Connect** → **Drivers** → copy the URI. Replace `<password>` with your real password and append the database name:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/catalog?retryWrites=true&w=majority
   ```

📌 Save: `MONGO_URL=mongodb+srv://...`

### 3c. Upstash — Redis

1. Create database. Name `ticket-booking`. Choose region close to Render (e.g. us-west-1).
2. Pick **Regional** (free tier doesn't support Global).
3. On the database page, click the **Connect** button → copy the **rediss://** URL (TLS).
   ```
   rediss://default:<password>@xxx.upstash.io:6379
   ```

📌 Save: `REDIS_URL=rediss://...`

### 3d. CloudAMQP — RabbitMQ

1. Create new instance. Plan: **Little Lemur** (free).
2. Name it `ticket-booking`. Region close to Render.
3. After creation, click the instance and copy the **AMQP URL** (looks like `amqps://user:pass@host/vhost`).

📌 Save: `RABBITMQ_URL=amqps://...`

---

## Step 4 — Deploy backend to Render

You have two options. Option A (Blueprint) is fastest.

### Option A — Blueprint (recommended)

1. On Render, click **New +** → **Blueprint**.
2. Connect your GitHub repo.
3. Render reads [render.yaml](render.yaml) and offers to create all 5 services. Click **Apply**.
4. Render starts building each service. Builds take 5–10 min the first time.
5. While they build, click into each service and fill in the env vars marked `sync: false` (Render shows them as "Add value"):

| Service | Env vars to fill |
|---|---|
| user-service | `POSTGRES_URL`, `CORS_ORIGINS` |
| catalog-service | `MONGO_URL`, `REDIS_URL`, `CORS_ORIGINS` |
| seat-service | `REDIS_URL`, `RABBITMQ_URL`, `CORS_ORIGINS` |
| booking-service | `POSTGRES_URL`, `RABBITMQ_URL`, `CORS_ORIGINS` |
| recommendation-service | `MONGO_URL`, `CORS_ORIGINS` |

Use the connection strings you saved in step 3.

For `CORS_ORIGINS`, set it to `*` for now — you'll update it in step 6 once your Vercel URL exists.

6. After saving env vars, each service auto-redeploys. Once they're live, copy the public URL of each (e.g. `https://user-service-abc.onrender.com`). You'll need these for Vercel.

### Option B — Manual (if Blueprint fails)

For each of the 5 services, click **New +** → **Web Service** → connect repo. Configure:
- **Runtime:** Docker
- **Dockerfile path:** `./services/<service-name>/Dockerfile`
- **Docker context:** `./services/<service-name>`
- **Plan:** Free
- **Health check path:** `/healthz`
- Add env vars as in the table above.

---

## Step 5 — Deploy frontend to Vercel

1. On Vercel, **Add New** → **Project** → import your GitHub repo.
2. **Important:** under **Configure Project**, set **Root Directory** to `frontend`. Vercel will auto-detect Next.js.
3. Under **Environment Variables**, add these 5 (with your actual Render URLs from step 4):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_USER_URL` | `https://user-service-xxx.onrender.com` |
| `NEXT_PUBLIC_CATALOG_URL` | `https://catalog-service-xxx.onrender.com` |
| `NEXT_PUBLIC_SEAT_URL` | `https://seat-service-xxx.onrender.com` |
| `NEXT_PUBLIC_BOOKING_URL` | `https://booking-service-xxx.onrender.com` |
| `NEXT_PUBLIC_RECO_URL` | `https://recommendation-service-xxx.onrender.com` |

4. Click **Deploy**. After ~2 min, you'll get a URL like `https://scalable-ticket-booking.vercel.app`.

---

## Step 6 — Lock down CORS

Now that your frontend has a real URL, restrict CORS on each Render service so only your frontend can call them.

For each of the 5 Render services:
1. Open the service → **Environment** tab.
2. Update `CORS_ORIGINS` from `*` to your Vercel URL (no trailing slash):
   ```
   https://scalable-ticket-booking.vercel.app
   ```
3. If you have multiple Vercel preview URLs, comma-separate them:
   ```
   https://scalable-ticket-booking.vercel.app,https://scalable-ticket-booking-git-main-you.vercel.app
   ```
4. Save → Render auto-redeploys (~30s).

---

## Step 7 — Seed some data

Your MongoDB is empty so the movie list will show nothing. Seed a few movies:

```powershell
curl -X POST https://catalog-service-xxx.onrender.com/admin/movies `
  -H "Content-Type: application/json" `
  -d '{\"title\":\"Inception\",\"genres\":[\"Sci-Fi\",\"Thriller\"],\"durationMin\":148,\"rating\":8.8,\"status\":\"now_showing\",\"posterUrl\":\"https://picsum.photos/seed/inception/400/600\"}'
```

Repeat for a few more movies. Or write a small seed script.

---

## Step 8 — Verify everything works

1. Hit each service's `/healthz` directly:
   ```
   https://user-service-xxx.onrender.com/healthz
   https://catalog-service-xxx.onrender.com/healthz
   ...
   ```
   Each should return `{"ok":true}`.

2. Open your Vercel URL. The home page should load. Click around — movies should appear (if you seeded them), seat selection should connect to Socket.io.

3. Open browser DevTools → Network tab. API calls should go to your Render URLs (not localhost). Check the Console for CORS errors — none expected.

---

## Common issues

| Symptom | Fix |
|---|---|
| First request takes 30s | Render free spin-up. Normal. Hit `/healthz` to warm services. |
| `CORS error` in browser console | `CORS_ORIGINS` on the service doesn't match your Vercel URL exactly. No trailing slash, include `https://`. |
| `ECONNREFUSED` on RabbitMQ | Use `amqps://` (TLS) URL from CloudAMQP, not `amqp://`. |
| Postgres `password authentication failed` | Neon URL must include `?sslmode=require`. |
| MongoDB connection hangs | Network Access on Atlas missing `0.0.0.0/0`. |
| Upstash "max requests exceeded" | You hit the 10K commands/day cap. Wait until UTC midnight or upgrade. |
| Socket.io won't connect | Render free supports websockets; double-check `NEXT_PUBLIC_SEAT_URL` points to seat-service (no `/api/seats` suffix in production). |

---

## Cost when you outgrow free tier

For a sense of scale:

- **Render Starter** plan: $7/service/month × 5 = $35/mo (no cold starts, always on)
- **Neon Pro**: $19/mo
- **MongoDB Atlas M2**: $9/mo
- **Upstash pay-as-you-go**: ~$0.20/100K commands
- **CloudAMQP Tough Tiger**: $19/mo

Rough total for "real" hosting: ~$80–100/mo. Free tier is fine for a portfolio.

---

## Next steps (post-deployment)

These items in the codebase aren't required to deploy but are flagged as gaps in [README.md](README.md):

- JWT middleware enforcement on `/bookings/*` and `/admin/*`
- Real payment integration (Stripe)
- Observability (logs, metrics)
- Notification service for booking confirmations
