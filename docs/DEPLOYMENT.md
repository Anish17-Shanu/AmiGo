# Free-Tier Deployment Guide

AmiGo is split across three runtimes. Vercel and Netlify can host the React SPA for free, but they cannot host a long-lived Express server or Socket.IO connections. The free production setup is:

```
Browser
  |
  |-- https://amigo.vercel.app        (Vercel or Netlify, static React build)
  |
  |-- https://amigo-api.onrender.com  (Render free web service, Express + Socket.IO)
  |        |
  |        |-- https://amigo-analytics.onrender.com  (Render free web service, FastAPI)
  |        |
  |        `-- MongoDB Atlas M0 free cluster
```

All services below have a $0 tier at the time of writing. Free tiers sleep, cold-start, and have quotas — see [Caveats](#free-tier-caveats).

---

## 1. MongoDB Atlas (free M0)

1. Create an account at <https://www.mongodb.com/cloud/atlas/register>.
2. Create a **free M0** cluster (any provider/region close to your Render region).
3. **Database Access** → add a user with a strong password. Save it.
4. **Network Access** → add `0.0.0.0/0` (Render free services use dynamic egress IPs).
5. **Connect** → **Drivers** → copy the `mongodb+srv://...` URI. Add the database name:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/amigo?retryWrites=true&w=majority`
   URL-encode special characters in the password (for example `@` → `%40`).

### Seed the demo dataset (recommended)

The API seeds automatically when the database is empty **and** `SEED_DEMO_DATA=true`. To seed manually instead:

```powershell
# PowerShell (Windows)
cd server
$env:MONGO_URI="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/amigo?retryWrites=true&w=majority"
npm run seed
```

```bash
# macOS / Linux
cd server
MONGO_URI="mongodb+srv://..." npm run seed
```

The seed is deterministic and inserts:

| Data | Volume |
|---|---|
| Products | 24 across 6 categories |
| Users | 1 admin, 1 demo customer, 9 customers |
| Orders | 60 across the last 28 days (statuses, cancellations, weekend lift) |
| Activities | One checkout event per order + cart activity |
| Wishlist | 3 products for the demo customer |

Demo credentials:

- Admin: `admin@amigo.com` / `Admin@123`
- Customer: `user@amigo.com` / `User@123`

> The seed is idempotent with `reset`: re-running it replaces all demo data. Automatic startup seeding skips any database that already has users.

---

## 2. Render (API + analytics, free)

The repository includes a [Render Blueprint](../render.yaml) for both backend services.

1. Push the repository to GitHub.
2. In Render: **New** → **Blueprint** → connect the repository.
3. Render detects `render.yaml` and asks for the two secret values:
   - `MONGO_URI`: the Atlas URI from step 1.
   - `CLIENT_URL`: your frontend origin. You can enter `http://localhost:5173` now and update it after the frontend is deployed. Multiple origins are comma-separated (no trailing slashes).
4. Apply the blueprint. Render builds:
   - `amigo-analytics` from `analytics-service/Dockerfile`
   - `amigo-api` from `server/Dockerfile`
5. Wait for both health checks to pass:
   - `https://amigo-api.onrender.com/api/v1/health/ready` → `"db":"up"`
   - `https://amigo-analytics.onrender.com/health` → `"status":"ok"`

`render.yaml` already sets:

- `NODE_ENV=production`
- a generated 32+ character `JWT_SECRET`
- `ANALYTICS_SERVICE_URL` wired to the analytics service
- `ANALYTICS_TIMEOUT_MS=8000` for cold starts
- `RATE_LIMIT_MAX=600`
- `SEED_DEMO_DATA=true`

If Render gives you different service names, update `render.yaml` or the `CLIENT_URL`/frontend URLs accordingly.

---

## 3. Vercel (frontend, free)

1. **Add New** → **Project** → import the repository.
2. Set **Root Directory** to `client`.
3. Framework preset: **Vite** (detected automatically).
4. Add environment variables:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://amigo-api.onrender.com/api/v1` |
| `VITE_SOCKET_URL` | `https://amigo-api.onrender.com` |

5. Deploy. `client/vercel.json` handles SPA routing.
6. Copy the deployment origin (e.g. `https://amigo.vercel.app`).
7. In Render → `amigo-api` → **Environment** → set:
   `CLIENT_URL=https://amigo.vercel.app`
   Save and redeploy/restart the API.

---

## 3b. Netlify alternative (free)

1. **Add new site** → **Import an existing project** → connect the repository.
2. Set **Base directory** to `client`.
3. Build command `npm run build`, publish directory `dist` (already in `client/netlify.toml`).
4. Add the same `VITE_API_URL` and `VITE_SOCKET_URL` variables under **Site configuration → Environment variables**.
5. Deploy, then add the Netlify origin to Render's `CLIENT_URL`, for example:
   `CLIENT_URL=https://amigo.netlify.app,https://amigo.vercel.app`

`client/netlify.toml` includes the SPA redirect and immutable asset caching.

---

## Environment matrix

### API (Render)

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | yes | `production` |
| `MONGO_URI` | yes | Atlas SRV URI with `/amigo` |
| `JWT_SECRET` | yes | ≥ 32 chars; Render can generate it |
| `JWT_EXPIRES_IN` | no | default `7d` |
| `CLIENT_URL` | yes | comma-separated allowed origins |
| `ANALYTICS_SERVICE_URL` | yes | `https://...onrender.com` or Render `hostport` |
| `ANALYTICS_TIMEOUT_MS` | no | `8000` recommended on free tier |
| `SEED_DEMO_DATA` | no | `true` to seed an empty database |
| `RATE_LIMIT_MAX` | no | requests per 15 minutes, default 300 |

### Frontend (Vercel / Netlify)

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | yes | full base including `/api/v1` |
| `VITE_SOCKET_URL` | yes | API origin only, no path |

### Analytics (Render)

No required variables. The container binds to Render's `$PORT` and exposes `/health`.

---

## Verification checklist

1. API readiness: `GET /api/v1/health/ready` returns `db: up`.
2. Analytics health: `GET /health` returns `status: ok`.
3. Customer login works and the store shows 24 products.
4. Admin login shows revenue, 60 orders, charts, and a populated forecast.
5. **Run insights** returns hybrid recommendations and labelled customer segments (VIP, Loyal, Occasional).
6. Add to cart → place order → Order History shows the new order and the cart badge resets.
7. Open the admin dashboard in one tab and place an order in another: the live event stream receives `ORDER`, `SALES`, and `ACTIVITY`.
8. Browser console has no CORS or WebSocket errors.

---

## Free-tier caveats

- **Cold starts**: Render free services sleep after inactivity. The first request can take 30–60 seconds. Warm up the API and analytics endpoints a minute before an interview/demo.
- **Analytics degradation**: if the ML service is asleep, the API falls back to empty ML payloads within `ANALYTICS_TIMEOUT_MS` instead of failing. The dashboard still loads.
- **Cold-start UX**: the frontend request may be slow on the first load; a second load is fast.
- **Atlas M0**: 512 MB storage is ample for demo data but not for production traffic.
- **Render free quota**: 750 instance hours/month per workspace; two always-on services consume it quickly. Both services sleep when idle.
- **Ephemeral containers**: containers can restart at any time. Persistent data lives in Atlas, not on Render disk.
- **No background workers**: all computation is request-scoped, which fits the free tier.
- **Demo credentials are public**: change them or disable demo seeding before using real data.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Origin not allowed by CORS` | `CLIENT_URL` missing the deployed origin | Add the exact origin, no trailing slash, then restart the API |
| Socket connects but no live events | Logged in as a customer | Events are scoped to admin sessions |
| ML panel empty | Analytics service asleep or unreachable | Warm the analytics URL, check `ANALYTICS_SERVICE_URL` |
| `db: down` | Atlas URI, password encoding, or IP allowlist | Re-check the URI and `0.0.0.0/0` network rule |
| App loads but API calls 404 | `VITE_API_URL` missing `/api/v1` | Fix the env var and redeploy the frontend |
| Login works but reload logs out | Token storage cleared | Expected only if `localStorage` is cleared |
| Render build fails on analytics | Docker context wrong | Keep `dockerContext: ./analytics-service` |

---

## Why not deploy the backend on Vercel/Netlify?

Vercel and Netlify are excellent for the static SPA, but:

- Socket.IO needs long-lived WebSocket connections.
- Express and FastAPI are persistent processes, not static/serverless functions.
- The API needs a stable origin for CORS, cookies, and the socket handshake.

Render (or Railway/Fly.io) provides a free container runtime for the two backends while Vercel/Netlify serves the frontend.

---

## Deployment checklist before an interview

- [ ] Atlas seeded and reachable.
- [ ] Render API and analytics healthy.
- [ ] `CLIENT_URL` includes the deployed frontend.
- [ ] Frontend env vars point at the Render API.
- [ ] Warm both Render services.
- [ ] Log in as admin, run insights once, and load the dashboard.
- [ ] Keep a second tab logged in as the customer for the live-order demo.
