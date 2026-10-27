# AmiGo - Data-Driven E-commerce Platform with Real-Time Insights

Created by **Anish Kumar**

AmiGo is a full-stack, multi-service e-commerce platform built as a production-oriented reference application: a React storefront and admin console, an Express/MongoDB API with authenticated real-time events, and a FastAPI machine-learning service for recommendations, forecasting, and segmentation.

If you only read one file to run and understand the project, read this README.

## 1. What You Get

- Storefront: auth, search and filters, product detail, cart, wishlist, simulated checkout, order history
- Admin console: revenue/orders/active-user/inventory metrics, product CRUD, order status management, user roles, ML insights, live event feed
- Real-time: authenticated Socket.IO rooms for admins and individual users (orders, sales, activity, trending)
- Analytics: content-based recommendations, linear-regression forecast, K-Means customer segmentation
- Security baseline: JWT with verified error handling, RBAC, bcrypt, request validation, Helmet, CORS allowlist, rate limiting, security headers at the proxy
- Production packaging: multi-stage Docker images, nginx SPA + API/WebSocket proxy, compose healthchecks, non-root containers, GitHub Actions CI
- Automated tests: backend integration suite, analytics API tests, client production build check

## 2. Tech Stack

- Frontend: React 18, Vite 6, Tailwind CSS, Framer Motion, Axios, Recharts, Socket.IO client
- Backend: Node.js 20+, Express 4, Mongoose 8, Socket.IO 4
- Analytics: FastAPI, Pandas, NumPy, scikit-learn, Matplotlib
- Database: MongoDB 7
- Delivery: Docker Compose, nginx, GitHub Actions

## 3. Monorepo Structure

- `client/` - React UI for customers and admins, plus `nginx.conf` for production serving
- `server/` - REST API, auth, commerce logic, real-time events
- `analytics-service/` - ML microservice (`/recommend`, `/forecast`, `/segment`)
- `postman/` - API collection
- `docs/` - architecture notes
- `.github/workflows/ci.yml` - continuous integration

## 4. One-Go Docker Setup (Recommended)

### Prerequisites

- Docker Desktop with Compose v2
- `openssl` (or any way to generate a random secret)

### Run

```bash
git clone https://github.com/Anish17-Shanu/AmiGo.git
cd AmiGo
cp .env.example .env
```

Edit `.env` and set at least:

- `JWT_SECRET` - 32+ random characters (`openssl rand -hex 32`)
- `MONGO_ROOT_PASSWORD` - a strong password
- `PUBLIC_ORIGIN` - defaults to `http://localhost:8080`

Then:

```bash
docker compose up --build -d
docker compose ps
```

Open `http://localhost:8080`. The nginx container serves the SPA and proxies `/api/` and `/socket.io/` to the API container, so the browser uses same-origin requests.

Stop with `docker compose down`; add `-v` to delete the MongoDB volume and demo data.

### Container Ports

| Service | Host binding | Purpose |
| --- | --- | --- |
| client (nginx) | `8080` (`CLIENT_PORT`) | Storefront and admin UI; API/WebSocket proxy |
| server | `127.0.0.1:5000` (`SERVER_PORT`) | Direct API access for debugging |
| analytics-service | `127.0.0.1:8000` (`ANALYTICS_PORT`) | Direct ML service access for debugging |
| mongodb | `127.0.0.1:27017` (`MONGO_PORT`) | Local database access |

MongoDB, the API, and analytics are bound to loopback only; the client proxy is the public entry point.

## 5. Local Setup (No Docker Required)

### Prerequisites

- Node.js `>=20`, npm `>=10`
- Python `>=3.11` (tested on 3.14)

### Environment files

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
cp analytics-service/.env.example analytics-service/.env
```

The client defaults to same-origin `/api/v1`; Vite's dev proxy forwards it to `http://localhost:5000`.

### Terminal 1 - Analytics service

```bash
cd analytics-service
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Terminal 2 - Backend API

```bash
cd server
npm install
npm run dev
```

If a local MongoDB is not reachable and `NODE_ENV` is not `production`, the server starts an in-memory MongoDB automatically. That data is lost when the process exits. In production, a failed connection aborts startup instead of silently degrading.

### Terminal 3 - Frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## 6. App URLs

- Frontend (Docker): `http://localhost:8080`
- Frontend (Vite dev): `http://localhost:5173`
- API: `http://localhost:5000/api/v1`
- Health: `http://localhost:5000/api/v1/health`
- Readiness: `http://localhost:5000/api/v1/health/ready`
- Analytics health: `http://localhost:8000/health`

## 7. Demo Credentials

- Admin: `admin@amigo.com` / `Admin@123`
- User: `user@amigo.com` / `User@123`

The backend bootstraps a full demo dataset when the database is empty and `SEED_DEMO_DATA` is enabled: 24 products, 11 users, and 60 orders spread across 28 days so dashboards, forecasts, and segments look realistic. An explicit reset/seed command is also available:

```bash
cd server
npm run seed
```

Set `SEED_DEMO_DATA=false` to start with an empty database. Change or remove demo credentials before exposing the app publicly.

## 8. Feature Coverage

### User

- Register/login with JWT; token restored on reload through `/auth/me`
- Search, category and price filters, pagination, popularity ordering
- Product detail with "people also bought" recommendations
- Cart with stock-aware quantities, wishlist, checkout, order history
- Auth-aware redirects, toasts, error boundaries, lazy-loaded routes

### Admin

- Revenue, order count, active users, inventory units
- Sales trend and forecast charts, top products
- Product create/update/delete
- Order listing, filtering and status transitions
- User listing and role management (self-demotion blocked)
- ML insights panel and live admin event feed

### Analytics

- `/recommend`: hybrid content-based ranking (quantity-weighted TF-IDF) blended with popularity and diversified by category
- `/forecast`: linear trend plus weekday seasonality, with gap filling and flat/empty fallbacks
- `/segment`: standardized K-Means with silhouette-based cluster selection and human-readable segment labels
- The backend degrades gracefully if this service is unavailable: dashboards return empty fallbacks instead of failing.

### Real-time

- JWT-authenticated Socket.IO handshake
- Admin room receives orders, sales, and user activity
- User room enables per-user notifications
- Trending updates are public

## 9. API Testing and Automated Tests

### Postman

Import `postman/AmiGo.postman_collection.json`. Set `baseUrl` if you are not using the defaults. The login request stores the returned JWT in the `token` collection variable.

### Backend

```bash
cd server
npm test
```

The suite uses Jest, Supertest, and an in-memory MongoDB. It covers auth, malformed-token survivability, RBAC, product CRUD, cart, wishlist, checkout, inventory rollback, cancel restocking, analytics-outage fallbacks, and role validation.

### Analytics

```bash
cd analytics-service
python -m pip install -r requirements-dev.txt
python -m pytest -q
```

### Client

```bash
cd client
npm ci
npm run build
```

### CI

`.github/workflows/ci.yml` runs server tests, the client production build, analytics tests, Docker image builds, and `docker compose config` validation on pushes and pull requests.

## 10. Security and Operations

- Fail-fast production configuration: `JWT_SECRET` must be at least 32 characters; a missing secret aborts startup
- Passwords are bcrypt-hashed and excluded from queries by default (`select: false`)
- Malformed or expired JWTs return `401` instead of crashing the process
- Role checks run against the current database user, not only token claims
- Input validation on auth, products, cart, wishlist, orders, and admin routes
- CORS allowlist from `CLIENT_URL`; unknown origins are rejected
- Helmet, JSON body limit, and configurable rate limiting
- nginx adds CSP, frame, MIME-sniffing, referrer, and permissions headers
- Graceful `SIGINT`/`SIGTERM` shutdown and `/health/ready` for orchestration
- Checkout uses conditional inventory decrements with compensating rollback, so partial failures do not consume stock

### Limitations

- Payments are simulated (`simulated_paid`); no payment provider or webhook reconciliation is included
- Single-node MongoDB is used, so checkout avoids multi-document transactions in favor of atomic conditional updates plus compensation
- Logs go to stdout; ship them with your platform's log collector
- Demo seed credentials must be replaced before public deployment

## 11. Troubleshooting

- `docker compose` complains about a missing variable: create `.env` from `.env.example` and set `MONGO_ROOT_PASSWORD` and `JWT_SECRET`
- Docker daemon/pipe not found: start Docker Desktop and retry
- MongoDB not installed locally: leave `NODE_ENV=development` so the in-memory fallback can start
- Python cannot find packages: activate the virtual environment and use `python -m pip` / `python -m pytest`
- Admin dashboard shows empty ML panels: start the analytics service; the API intentionally returns empty fallbacks when it is down

## 12. Evolution Beyond the Scaffold

The project now includes:

- Complete customer and admin workflows with guarded routes
- Atomic, stock-aware checkout with rollback and cancellation restocking
- Authenticated real-time rooms instead of public broadcasts
- Analytics-outage resilience in admin endpoints
- Production Docker images, proxy configuration, healthchecks, and CI
- Integration tests that exercise the commerce lifecycle end to end

## 13. Future Scope

- Payment gateway integration with webhook reconciliation
- Multi-vendor marketplace and seller onboarding
- Hybrid recommender with collaborative and session signals
- Time-series forecasting with seasonal models
- Event streaming through Kafka/RabbitMQ
- Redis caching and a dedicated search engine
- Centralized audit logs and security monitoring
- Multi-language, multi-currency, and tax localization

## 14. Creator and Ownership

Project creator: **Anish Kumar**  
Repository owner: **Anish17-Shanu**

If you use this project, please keep creator attribution in derivative work.
