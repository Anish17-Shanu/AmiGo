# AmiGo Architecture

Creator: **Anish Kumar**

## Runtime topology

```text
Browser
  |
  v
nginx (client container, :80 -> host 8080)
  |-- /            -> static React build (SPA fallback)
  |-- /api/        -> server:5000
  |-- /socket.io/  -> server:5000 (WebSocket upgrade)
                        |
                        |-- MongoDB (mongo:7)
                        `-- analytics-service:8000
```

In local development, Vite serves the React app and proxies `/api` and `/socket.io` to `http://localhost:5000`, so the browser still uses same-origin requests.

## Services

### `client` (React + Vite)

- Customer storefront and admin console
- Lazy-loaded routes, error boundary, auth/cart/socket contexts
- Recharts dashboards and live admin event feed
- Production build served by nginx with CSP and cache headers

### `server` (Express + MongoDB)

- JWT authentication and database-backed RBAC
- Product catalog, cart, wishlist, orders, admin APIs
- Validated request payloads and normalized error responses
- Socket.IO with JWT handshake and per-role rooms
- Health (`/health`) and readiness (`/health/ready`) probes

### `analytics-service` (FastAPI + scikit-learn)

- `/recommend`: content-based product ranking
- `/forecast`: linear-regression sales forecast
- `/segment`: K-Means customer segmentation
- Empty/insufficient-data fallbacks for every endpoint

## Request flows

### Authentication

1. Registration hashes the password with bcrypt and returns a JWT.
2. Login selects the password explicitly (`select: false` by default), compares it, and returns a JWT plus a normalized user object (`id`, not Mongo's `_id`).
3. `protect` verifies the token, loads the current user from MongoDB, and refreshes `lastActiveAt` at most every five minutes.
4. `authorize("admin")` checks the database role, so stale or edited token claims cannot escalate privileges.

### Checkout

1. Load the user's cart with populated products.
2. For each line item, run a conditional update:
   `inventory >= quantity` -> `$inc { inventory: -q, totalSold: +q, popularityScore: +2q }`.
3. Track applied decrements. If any item is unavailable, compensate every applied decrement and return `409`; no order is created.
4. Create the order with price/title snapshots, then clear the cart.
5. Emit `ORDER_CREATED` and `SALES_UPDATED` to the `admins` room.
6. Cancelling an order via the admin API restocks inventory and reverses sales counters; cancelled orders cannot be reopened.

This avoids requiring a replica-set transaction on a single-node MongoDB while keeping partial failures consistent.

### Analytics

1. Admin dashboard reads orders, users, and products from MongoDB.
2. It sends the daily sales series to `/forecast` with a short timeout.
3. If the analytics service is down or times out, the API logs a warning and returns `{ forecast: [] }` (or empty recommendations/segments), so the dashboard still renders.
4. User recommendations call `/recommend` and resolve returned IDs against MongoDB before responding.

### Real-time

- The Socket.IO handshake accepts an optional JWT. Invalid tokens are rejected.
- Authenticated users join `user:<id>`; admins also join `admins`.
- Guests may subscribe to public trending updates only.
- Activity tracking is persisted and emitted only to admins.

## Failure handling

- Production startup fails if MongoDB is unreachable or the JWT secret is too short.
- Non-production startup falls back to an in-memory MongoDB for local demos.
- Malformed JWTs and expired tokens produce `401`, never an uncaught exception.
- Express errors are normalized (validation, cast, duplicate key, JWT) and stacks are hidden in production.
- `SIGINT`/`SIGTERM` close the socket server, HTTP server, and database connection.
- Unhandled rejections and uncaught exceptions exit with a non-zero code so orchestrators restart the container.

## Security model

- bcrypt password hashes; passwords never returned by queries
- JWT expiry and signature verification
- CORS allowlist from `CLIENT_URL`
- express-validator on write paths and pydantic on analytics payloads
- Helmet plus nginx security headers/CSP
- Rate limiting and a 1 MB JSON body limit
- Secrets supplied through environment variables; no secrets in images
- Containers run as non-root users (Node `node`, Python `app`)

## Deployment notes

- `docker-compose.yml` builds production images for all three services and gates startup on healthchecks.
- MongoDB, API, and analytics ports bind to loopback; nginx is the public entry point.
- Set `PUBLIC_ORIGIN`, `JWT_SECRET`, and `MONGO_ROOT_PASSWORD` in the root `.env`.
- CI (`.github/workflows/ci.yml`) runs backend tests, the client build, analytics tests, image builds, and compose validation.
