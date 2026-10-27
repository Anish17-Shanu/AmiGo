# AmiGo — Interview Preparation Guide

Everything you need to explain, defend, and demo AmiGo in an interview.

---

## 1. The 30-second pitch

> AmiGo is a full-stack, production-hardened e-commerce platform with an applied machine-learning layer. It runs as three services: a React SPA, an Express + MongoDB API with authenticated real-time events, and a FastAPI ML service for recommendations, demand forecasting, and customer segmentation. I built the whole path end to end — atomic checkout with inventory safety, JWT/RBAC security, a live admin dashboard, hybrid recommendation ranking, seasonal forecasting, and a free-tier deployment. The backend and ML service have 33 automated tests, and the entire flow is verified live.

## 2. The 2-minute version

- **Problem**: demonstrate a realistic commerce system where the ML is not a notebook bolted on, but a service the product actually uses.
- **Solution**: a three-service architecture with a shared product contract.
- **Differentiators**:
  - checkout that cannot oversell inventory, even without multi-document transactions;
  - an admin console with live order/sales/activity events;
  - ML that degrades gracefully — if the ML service is down, the storefront still works;
  - a deterministic demo dataset so the dashboard, forecast, and segments look real immediately;
  - free-tier deployment with one blueprint.

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  React 18 + Vite + Tailwind + Framer Motion + Recharts           │
│  Vercel / Netlify (static)  or  nginx container                  │
│  - AuthContext, CartContext, ToastContext, SocketContext         │
│  - lazy routes, protected routes, error boundary                 │
└───────────────┬───────────────────────────────┬──────────────────┘
                │ HTTPS /api/v1                 │ WSS (JWT handshake)
                ▼                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  Express 4 + Mongoose 8 + Socket.IO 4                            │
│  Render free web service / Docker                                │
│  - JWT auth + DB-backed RBAC                                     │
│  - products, cart, wishlist, orders, admin                       │
│  - atomic checkout + compensation                                │
│  - analytics client with timeouts and fallbacks                  │
└───────────────┬───────────────────────────────┬──────────────────┘
                │ MongoDB URI                   │ HTTP (3s-8s timeout)
                ▼                               ▼
┌─────────────────────────────┐   ┌────────────────────────────────┐
│  MongoDB Atlas M0           │   │  FastAPI + scikit-learn        │
│  users, products, orders,   │   │  /recommend /forecast /segment │
│  carts, wishlists, activity │   │  Render free web service       │
└─────────────────────────────┘   └────────────────────────────────┘
```

### Why three services?

| Decision | Reason | Tradeoff |
|---|---|---|
| Separate ML service | Python ecosystem for scikit-learn; independent scaling and failure isolation | Extra network hop, must handle timeouts |
| Express API owns commerce | Keep inventory and order invariants in one transactional boundary | API is the single source of truth |
| Static SPA | Cheap/free hosting, CDN caching, simple SPA routing | Backend must be hosted elsewhere for WebSockets |
| MongoDB | Flexible product catalog and order snapshots; fast iteration | No multi-document transactions on the free tier, so checkout is designed around that |

### Request flows

**Login**
1. `POST /auth/login` validates input with express-validator.
2. `User` is loaded with `+password` (the field is `select: false` by default).
3. bcrypt compares the hash; a JWT containing the user id is signed for 7 days.
4. The client stores the token and restores the session through `/auth/me`.
5. Every protected request loads the current user and role from MongoDB — role changes take effect immediately.

**Checkout (the most important flow)**
1. Load the user's cart and populated products.
2. For each line item, run a conditional update:
   `findOneAndUpdate({ _id, inventory: { $gte: quantity } }, { $inc: { inventory: -quantity, totalSold, popularityScore } })`.
3. If any update fails, throw a conflict and run compensating updates for every item already decremented.
4. Only then create the order, clear the cart, emit `order:created` + `sales:updated` to admins, and record activity.
5. Cancellation increments inventory back and blocks reopening a cancelled order.

**Recommendations**
1. API loads the customer's non-cancelled orders and the full product catalog.
2. Sends interactions + products to `/recommend`.
3. ML builds a quantity-weighted profile in TF-IDF space (per customer, or an aggregate demand profile for admin insights), blends content similarity with popularity, diversifies by category, and returns product IDs with scores.
4. API validates every returned ID as a MongoDB ObjectId before querying products. This guard fixed a real production bug.

**Real-time**
1. Socket.IO handshake reads `auth.token`, verifies the JWT, and loads the role from MongoDB.
2. Users join `user:<id>`; admins join `admins`.
3. Order/sales/activity events are emitted only to the admin room.
4. The dashboard shows a live event stream without polling.

## 4. Data model

| Collection | Key fields | Indexes / notes |
|---|---|---|
| `User` | name, email (unique), password (bcrypt, `select:false`), role, lastActiveAt | email unique; role read per request |
| `Product` | title, description, category, price, inventory, rating, tags, totalSold, popularityScore | title and category indexed; search escapes regex |
| `Order` | user, items[{product, titleSnapshot, priceSnapshot, quantity}], totalAmount, status, paymentStatus | user+createdAt, status+createdAt; snapshots preserve historical prices |
| `Cart` | user (unique), items[{product, quantity}] | one cart per user |
| `Wishlist` | user (unique), products[] | idempotent add |
| `Activity` | user, type, metadata | user+createdAt; feeds admin activity |

**Why order snapshots?** If a product price or title changes, the historical order must not change. Snapshots make revenue and order history stable.

## 5. ML deep dive

### 5.1 Recommendations — hybrid TF-IDF + popularity

**Pipeline**

1. Build a content document per product:
   `title + category ×2 + tags ×2`.
2. Vectorize with `TfidfVectorizer(stop_words="english", ngram_range=(1,2), sublinear_tf=True)`.
3. Build the user profile as the quantity-weighted average of purchased product vectors. Admin insights omit `user_id`, so the service builds one aggregate demand profile across all customers.
4. Compute cosine similarity between the profile and every product.
5. Blend signals:
   `score = 0.75 × content_similarity + 0.25 × normalized_popularity`.
6. In user scope, exclude products the user already bought; aggregate scope ranks the whole catalog.
7. Apply a category diversity cap (2 per category for a top-8 request) and backfill if needed.
8. Cold start (no history): popularity ranking from interaction counts; neutral catalog order if there are no interactions at all.

**Why these choices**

- TF-IDF is interpretable, fast, CPU-only, and works with a small catalog.
- The user-profile vector captures multiple purchases better than averaging pairwise similarities.
- Quantity weighting treats buying three protein mixes differently from buying one.
- Popularity smoothing prevents a niche item from winning on a single tag match.
- Diversity avoids an "all headphones" recommendation list.

**Output**

```json
{
  "strategy": "hybrid_tfidf_popularity",
  "scope": "user",
  "weights": { "content": 0.75, "popularity": 0.25 },
  "recommendations": [{ "product_id": "...", "score": 0.8123, "reason": "hybrid" }]
}
```

**Evaluation plan (be ready to answer)**

- Offline: time-based split, then `precision@k`, `recall@k`, `NDCG@k`, and catalog coverage.
- Online: CTR and add-to-cart rate per recommendation slot; A/B test weights 75/25 vs 60/40.
- Current limitation: no implicit negative feedback (views/skips); only purchases.

### 5.2 Demand forecasting — trend + weekday seasonality

**Pipeline**

1. Aggregate sales by day; skip invalid dates.
2. Build a continuous daily series, filling missing dates with zero.
3. Fit a linear regression on the day index (trend).
4. On the observed days, compute the ratio of actual to trend.
5. If there are at least 14 observed days, at least 5 weekdays, and at least 2 samples per weekday, take the median ratio per weekday, clamp to `[0.65, 1.35]`, and normalize the mean to 1.
6. Forecast = trend × weekday factor, clipped at zero.
7. Fallbacks: one point → flat repeat; no points → zeros.

**Why not ARIMA/Prophet/LSTM?**

- The demo data is short and noisy; complex models overfit and add cold-start latency.
- The free tier needs fast, CPU-only inference.
- A trend + weekday model is explainable to a non-technical stakeholder.
- The interface is model-agnostic: swapping in Prophet later only changes this service.

**Evaluation plan**

- `MAE`, `RMSE`, `MAPE` on a rolling-origin backtest.
- Compare against a naive "last 7-day average" baseline.
- Segment error by weekday and by product category.

### 5.3 Customer segmentation — standardized K-Means

**Pipeline**

1. Features: `order_value` and `order_count` per customer.
2. Standardize with `StandardScaler` so revenue does not dominate frequency.
3. When `k` is not supplied, try `k = 2..min(4, n−1)` and choose the best silhouette score.
4. Fit K-Means with `random_state=42`, `n_init=10`.
5. Rank clusters by average order value and label them:
   VIP, High-value, Loyal, Occasional, New.
6. Return per-customer segments plus a summary with average value, average order count, revenue, and revenue share.

**Why standardization?** Without it, a $2,000 order would dominate the distance metric and every customer would be clustered by revenue alone.

**Why silhouette?** It gives a data-driven k for demos without manual tuning. Limitation: silhouette assumes convex clusters and can be unstable on tiny datasets, so the UI treats labels as directional.

**Evaluation/business use**

- Silhouette score for cohesion; segment stability across weeks.
- Business: VIP retention campaigns, win-back for Occasional, onboarding for New.
- Cancelled orders are excluded from training so refunds do not inflate value.

### 5.4 ML reliability

- Axios client uses a timeout and returns typed fallbacks:
  `{ recommendations: [] }`, `{ forecast: [] }`, `{ segments: [] }`.
- Dashboard and storefront render even when ML is unavailable.
- Every product ID returned by ML is validated with `mongoose.isValidObjectId` before querying.
- Free-tier cold starts are handled with an 8-second timeout in production.

## 6. Security model

| Control | Implementation |
|---|---|
| Password storage | bcrypt cost 12, `select:false`, never serialized |
| Authentication | JWT, 7-day expiry, signature verification |
| Authorization | `protect` + `authorize("admin")`, role loaded from DB |
| Input validation | express-validator on every write route; Pydantic on ML |
| NoSQL injection | Typed params, ObjectId validation, no user-supplied operators |
| Regex DoS | Search terms escaped and capped at 100 chars |
| CORS | Explicit origin allowlist, comma-separated for multiple deploys |
| Headers | Helmet, `x-powered-by` disabled, nginx CSP in Docker |
| Rate limiting | Global limiter, 300 requests / 15 min by default |
| Proxy/IP | `trust proxy` in production so rate limiting sees real client IPs |
| Secrets | `.env` ignored, fail-fast JWT secret length in production, no secrets in images |
| Containers | Multi-stage builds, non-root users |
| Error handling | Central normalized errors; no stack traces to clients |
| Pagination | Clamped page/limit to prevent scrape/DoS |

**Token storage tradeoff**: the SPA stores the JWT in `localStorage`. This is simple and works with the socket handshake, but it is readable by XSS. A hardened production version would use httpOnly, secure, same-site cookies plus CSRF protection. Mention this proactively — it shows judgment.

## 7. Testing

| Suite | Coverage |
|---|---|
| `server/tests/api.integration.test.js` | 19 integration tests on in-memory MongoDB |
| `server/tests/auth.validation.test.js`, `health.test.js` | validation and health behavior |
| `analytics-service/tests/test_api.py` | 14 tests: recommendations (hybrid user/aggregate/cold start/IDs), forecasting (seasonality/flat), segmentation (auto-k/labels) |
| `client` | production build in CI; flows verified in a real browser |

**Integration tests cover**: registration, password secrecy, duplicate emails, weak passwords, login, malformed JWT, RBAC, product CRUD and filters, cart caps, wishlist idempotency, checkout decrement, rollback on insufficient inventory, cancellation restock, reopen rejection, admin role rules, dashboard fallback, and ML payload shape.

**What is not automated yet**: browser E2E (Playwright/Cypress) and load testing. Be honest; propose adding them.

## 8. Deployment (free tier)

| Component | Host | Notes |
|---|---|---|
| React SPA | Vercel or Netlify | static build; `client/vercel.json` / `client/netlify.toml` |
| Express + Socket.IO | Render free web service | Docker; persistent process required |
| FastAPI ML | Render free web service | Docker; binds to `$PORT` |
| MongoDB | Atlas M0 | 512 MB free |

Full steps: [DEPLOYMENT.md](DEPLOYMENT.md). Key env vars:

```
# Frontend
VITE_API_URL=https://amigo-api.onrender.com/api/v1
VITE_SOCKET_URL=https://amigo-api.onrender.com

# API
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=<32+ random chars>
CLIENT_URL=https://your-app.vercel.app
ANALYTICS_SERVICE_URL=https://amigo-analytics.onrender.com
SEED_DEMO_DATA=true
```

**Cold-start script for interviews**: open the API health URL and the analytics health URL a minute before the call.

## 9. Demo script (3–4 minutes)

**Before the call**

- Warm both Render services.
- Open two browser windows: one admin, one customer (or one incognito).
- Have the seeded credentials ready.

**Customer window**

1. Log in with `user@amigo.com` / `User@123`.
2. Show the storefront: 24 products, search, category/price filters.
3. Point out **Recommended for you** — personalized from the demo user's purchase history.
4. Open a product: stock, tags, "people also bought".
5. Add two items to the cart, change quantity, show the summary total.
6. Place the order; the app redirects to Order History with a `simulated paid` status.
7. Show the wishlist page.

**Admin window**

1. Log in with `admin@amigo.com` / `Admin@123`.
2. Dashboard: revenue, orders, active users, inventory units; forecast and revenue charts.
3. Click **Run insights**: hybrid recommendation scores, K-Means labels (VIP/Loyal/Occasional), average spend per segment.
4. Product management: create or edit a product.
5. Order management: change a status; cancellation restocks inventory.
6. User management: promote a customer; self-demotion is blocked.
7. Keep the live event stream visible.
8. In the customer window, place another order. The admin feed instantly shows `ACTIVITY`, `SALES`, and `ORDER`.

**Talking points while clicking**

- "Checkout uses a conditional update so two buyers cannot take the same last unit."
- "If the ML service sleeps on the free tier, the dashboard still loads with fallbacks."
- "The recommendation IDs are validated before hitting MongoDB — that guard came from a real CastError I found in end-to-end testing."
- "This dataset is deterministic: 60 orders over 28 days with weekend lift, so the forecast has seasonality to learn."

## 10. Likely interview questions and answers

**Q: Walk me through the architecture.**
React SPA → Express API (commerce + realtime) → MongoDB, plus a FastAPI ML service called over HTTP. The API owns all invariants; ML is stateless and failure-isolated. Deployed as static frontend, two Render services, Atlas.

**Q: Why not put everything in one Node service?**
The ML stack (pandas/scikit-learn) is Python-first, and isolating it means a model failure cannot take down checkout. The cost is an extra network hop, which I handle with timeouts and fallbacks.

**Q: How do you prevent overselling?**
Conditional `findOneAndUpdate` requiring `inventory >= quantity`, then compensating increments for prior line items if any later line fails. Order creation happens only after all decrements succeed.

**Q: Why not use transactions?**
The free deployment uses a single-node Atlas M0 where multi-document transactions are limited/unavailable. Conditional updates give the same safety for this invariant without transactions. With a replica set, I would wrap checkout in a transaction and keep the conditional update as defense in depth.

**Q: What happens if the process crashes mid-checkout?**
Compensation covers in-request failures. A crash between decrements could leave stock reduced without an order; the production fix is an idempotent checkout with a reservation/outbox record and a reconciliation job. Be explicit that this is the next step for payments-grade reliability.

**Q: How does RBAC work?**
JWT identifies the user; `protect` loads the user from MongoDB on every request; `authorize("admin")` checks the role. DB lookup means role changes apply immediately and a stolen token cannot retain escalated privileges after demotion.

**Q: Why is the password field `select:false`?**
Defense in depth. Even if a controller returns the user document, the hash is not included unless explicitly requested.

**Q: How does the socket authenticate?**
The client sends the JWT in `handshake.auth.token`; the server verifies it, loads the role, and joins the socket to `admins` or `user:<id>`. Unauthenticated sockets can connect but receive no private events.

**Q: Explain the recommendation model.**
Hybrid: quantity-weighted TF-IDF user profile → cosine similarity → blend with normalized popularity (75/25) → exclude purchased items → category diversification. Cold start falls back to popularity. I validate returned IDs as ObjectIds before querying.

**Q: How would you evaluate recommendations?**
Offline with a time-based split and precision@k/recall@k/NDCG; online with CTR and add-to-cart lift in an A/B test. Catalog coverage and diversity guard against popularity bias.

**Q: Why TF-IDF instead of embeddings?**
For 24–thousands of products, TF-IDF is fast, interpretable, CPU-only, and has no external dependency or inference cost. Embeddings become worthwhile with semantic queries or a much larger catalog.

**Q: Explain the forecast.**
Daily aggregation with gap filling, linear trend, and weekday factors from median actual/trend ratios. It needs at least 14 observed days for seasonality; otherwise it falls back to a pure trend, then flat, then zeros.

**Q: Why not use Prophet or an LSTM?**
Short, noisy series and a free-tier latency budget. Complexity would overfit and slow cold starts. The service boundary makes the model swappable.

**Q: Explain segmentation.**
Standardize order value and count, choose k by silhouette (2–4) when not specified, fit K-Means, rank clusters by average value, and label VIP/High-value/Loyal/Occasional/New. Return per-customer segments plus a revenue summary.

**Q: What is a weakness of K-Means here?**
It assumes roughly convex, similarly sized clusters and is sensitive to initialization and outliers. `n_init=10` and standardization help; a future version could compare GMM or DBSCAN and use RFM features.

**Q: How does the app behave when ML is down?**
Axios times out (3s dev / 8s prod) and returns empty typed fallbacks, so the storefront and dashboard still render. The UI shows an empty state rather than an error page.

**Q: What was the hardest bug?**
The recommendation endpoint returned 400 with a MongoDB CastError because Pydantic dropped `_id` and the popularity fallback emitted the string `"None"`. I fixed the schema alias, filtered invalid IDs in Python, and added an ObjectId guard in Node plus regression tests. Finding it required live end-to-end testing, not unit tests.

**Q: How do you secure the API?**
Helmet, CORS allowlist, rate limiting, input validation, escaped regex search, ObjectId validation, bcrypt 12, JWT with DB-backed roles, no stack traces to clients, secrets in env, non-root containers, and a CSP in nginx for the Docker deployment.

**Q: What would you do before handling real payments?**
A payment provider with webhooks as the source of truth, idempotency keys, an explicit order state machine, reservation/expiry for inventory, refund and reconciliation jobs, audit logs, and PCI-compliant hosted checkout. Never trust the client's amount.

**Q: How would you scale this?**
Add compound indexes for the top queries, Redis for sessions/rate limiting/caching, a Socket.IO Redis adapter for multiple API instances, read replicas or a search engine for catalog search, background jobs for ML retraining, and CDN caching. Move heavy analytics to batch/offline jobs.

**Q: Why Render for the backend and Vercel for the frontend?**
Vercel/Netlify are ideal for static assets and CDN but cannot host long-lived WebSocket servers. Render runs persistent containers for Express and FastAPI on a free tier; Atlas provides the database.

**Q: How do you know the app works?**
19 API integration tests against a real in-memory MongoDB, 14 ML tests, a production client build in CI, plus a live end-to-end pass covering login, cart, checkout, inventory decrement, cancellation restock, admin RBAC, dashboard, ML insights, and real-time events.

**Q: What are the limitations?**
Simulated payments, no email verification/password reset, no reviews/addresses/coupons (intentionally out of scope), single-node Mongo, stdout logs, localStorage token storage, no automated browser E2E, and no load testing.

**Q: What would you build next?**
Payments + webhooks, idempotent checkout with reservations, Playwright E2E, Redis-backed sockets, recommendation feedback events for online learning, and model monitoring (latency, drift, fallback rate).

## 11. Numbers to remember

- 3 services, 28 API endpoints, 3 ML endpoints
- 6 MongoDB collections
- 24 seeded products across 6 categories
- 11 seeded users (1 admin, 10 customers)
- 60 seeded orders across 28 days
- 33 automated tests (19 API + 14 ML)
- Recommendation blend: 75% content + 25% popularity
- Forecast horizon: 7 days
- Segmentation: auto-k 2–4, standardized features
- JWT: 7 days; bcrypt cost 12

## 12. Resume bullets

- Built a three-service commerce platform (React, Express/Socket.IO, FastAPI) with JWT/RBAC security, atomic inventory checkout, and a live admin analytics console.
- Designed a hybrid recommender (quantity-weighted TF-IDF + popularity + category diversification) with cold-start handling and graceful degradation.
- Implemented seasonal demand forecasting and standardized K-Means segmentation with silhouette-based cluster selection and business labels.
- Hardened the stack with input validation, rate limiting, CORS allowlists, security headers, non-root containers, health probes, and centralized error handling.
- Added 33 automated tests, a GitHub Actions pipeline, Docker/Compose packaging, and a free-tier deployment blueprint (Vercel/Netlify + Render + MongoDB Atlas).

## 13. Where to look in the code

| Area | File |
|---|---|
| Server entry / shutdown | `server/src/server.js` |
| App, CORS, rate limits | `server/src/app.js` |
| Env validation | `server/src/config/env.js` |
| Checkout algorithm | `server/src/controllers/orderController.js` |
| Recommendations API glue | `server/src/controllers/analyticsController.js` |
| Admin dashboard + advanced analytics | `server/src/controllers/adminController.js` |
| Socket auth and rooms | `server/src/sockets/index.js` |
| Hybrid recommender | `analytics-service/app/services/recommender.py` |
| Seasonal forecast | `analytics-service/app/services/forecaster.py` |
| Auto-k segmentation | `analytics-service/app/services/segmenter.py` |
| Demo dataset | `server/src/seed/demoData.js` |
| API integration tests | `server/tests/api.integration.test.js` |
| ML tests | `analytics-service/tests/test_api.py` |
| Deployment guide | `docs/DEPLOYMENT.md` |
| Architecture notes | `docs/ARCHITECTURE.md` |

## 14. Questions to ask the interviewer

- How do you evaluate ML features before shipping — offline metrics, online experiments, or both?
- What does your deployment and on-call setup look like?
- Where does the team draw the line between a modular monolith and separate services?
- How is technical debt prioritized against feature work?
