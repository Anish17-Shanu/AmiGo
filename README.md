# AmiGo - Data-Driven E-commerce Platform with Real-Time Insights

Created by **Anish Kumar**

AmiGo is a production-grade, multi-service e-commerce platform that combines full-stack commerce workflows with machine-learning-powered insights and real-time analytics.

If you only read one file to run and understand the project, read this README.

## 1. What You Get

- Full storefront (auth, browse, search, filters, cart, wishlist, checkout simulation, order history)
- Admin operations (dashboard metrics, user management, order management, product CRUD)
- Data science service for recommendations, forecasting, and customer segmentation
- Real-time event streaming with Socket.IO (orders, sales, user activity, trending updates)
- Security baseline (JWT auth, RBAC, bcrypt, validation, Helmet, CORS, rate limiting)
- Ready-to-use developer tooling (tests, seed scripts, Postman collection, Docker setup)

## 2. Tech Stack

- Frontend: React + Vite + Tailwind CSS + Framer Motion + Axios + Recharts
- Backend: Node.js + Express + Mongoose + Socket.IO
- Analytics: FastAPI + Pandas + NumPy + scikit-learn + Matplotlib
- Database: MongoDB (with in-memory fallback in local non-Docker mode)
- DevOps: Docker Compose (free-tier friendly local deployment)

## 3. Monorepo Structure

- `client/` - React UI for users and admin
- `server/` - REST API, auth, business logic, real-time events
- `analytics-service/` - ML microservice (`/recommend`, `/forecast`, `/segment`)
- `postman/` - API testing collection
- `docs/` - architecture notes

## 4. One-Go Setup (Recommended)

### Prerequisites

- Node.js `>=20`
- Python `>=3.11`
- npm `>=10`
- Optional: Docker Desktop (if you want containerized run)

### Clone

```bash
git clone https://github.com/Anish17-Shanu/AmiGo.git
cd AmiGo
```

### Create environment files

PowerShell:

```powershell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
Copy-Item analytics-service\.env.example analytics-service\.env
```

macOS/Linux:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
cp analytics-service/.env.example analytics-service/.env
```

## 5. Run Options

### Option A: Docker (all-in-one)

```bash
docker compose up --build
```

If Docker daemon is not running, use Option B.

### Option B: Local (no Docker required)

Open 3 terminals:

Terminal 1 - Analytics service

```bash
cd analytics-service
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Terminal 2 - Backend API

```bash
cd server
npm install
npm run start
```

Terminal 3 - Frontend

```bash
cd client
npm install
npm run dev
```

## 6. App URLs

- Frontend: `http://localhost:5173`
- Backend API root: `http://localhost:5000/api/v1`
- Backend health: `http://localhost:5000/api/v1/health`
- Analytics health: `http://localhost:8000/health`

## 7. Demo Credentials

- Admin: `admin@amigo.com` / `Admin@123`
- User: `user@amigo.com` / `User@123`

Notes:
- Backend auto-bootstrap inserts demo data on empty DB.
- Explicit seed is still available:

```bash
cd server
npm run seed
```

## 8. Feature Coverage

### User Features

- Signup/Login with JWT
- Product discovery with search/filter and popularity ranking
- AI-assisted product recommendations
- Add to cart / wishlist
- Simulated checkout
- Order history
- Responsive modern UI

### Admin Features

- Revenue / orders / active users / inventory metrics
- Product create/update/delete
- Order status management
- User listing and role management
- Charts for sales and top products
- Real-time event stream monitoring

### Data Science Features

- `/recommend`: content-based recommendation engine
- `/forecast`: linear-regression sales forecasting
- `/segment`: K-Means customer segmentation
- Forecast data export utility hooks via Matplotlib

### Real-Time Features

- Live order events
- Live sales update events
- Live user activity events
- Live trending product update events

## 9. API Testing and Automated Tests

### Postman

- Collection: `postman/AmiGo.postman_collection.json`

### Backend tests

```bash
cd server
npm test
```

### Analytics tests

```bash
cd analytics-service
python -m pytest
```

## 10. Security Highlights

- Password hashing via bcrypt
- JWT auth and role-based access control
- Input validation (express-validator, pydantic)
- Helmet headers, CORS restrictions, and API rate limiting
- Structured backend logging (Winston + Morgan)

## 11. Troubleshooting

- Docker error about daemon/pipe not found:
  - Start Docker Desktop and retry `docker compose up --build`
- MongoDB not installed locally:
  - Backend falls back to in-memory MongoDB in local mode
- Python scripts not found after install:
  - Use `python -m <module>` form (already shown above)

## 12. Current Evolution State

The project has evolved beyond scaffold level and currently includes:

- End-to-end working full stack (UI + API + analytics)
- Real-time event plumbing
- ML microservice integration
- Seed/bootstrap data and test coverage
- Docker and local runtime paths

## 13. Future Scope

- Payment gateway integrations (Stripe/Razorpay) with webhook reconciliation
- Multi-vendor marketplace model with seller onboarding
- Advanced recommender using hybrid collaborative + session-based signals
- Time-series forecasting using Prophet/LSTM for higher seasonal fidelity
- Event-driven architecture with message broker (Kafka/RabbitMQ)
- Inventory intelligence: reorder-point predictions and supplier scoring
- Fine-grained audit logs and SIEM-ready security observability
- CI/CD pipelines with environment promotion and canary deployment
- Caching/search stack (Redis + OpenSearch/Meilisearch)
- Multi-language UI + currency + tax localization

## 14. Creator and Ownership

Project creator: **Anish Kumar**  
Repository owner: **Anish17-Shanu**

If you use this project, please keep creator attribution in derivative work.
