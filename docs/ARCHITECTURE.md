# AmiGo Architecture

## Services

1. `client` (React + Vite)
- Customer storefront
- Admin dashboard
- Recharts visualizations
- Socket.IO live feed

2. `server` (Express + MongoDB)
- JWT auth and RBAC
- Product/catalog APIs
- Cart, wishlist, orders
- Admin analytics endpoints
- Socket events for orders/sales/activity

3. `analytics-service` (FastAPI + scikit-learn)
- `/recommend`: content-based product recommendation
- `/forecast`: linear regression sales forecast
- `/segment`: customer segmentation via K-Means

## Data Flow

- Frontend calls backend REST APIs.
- Backend reads/writes MongoDB.
- Backend sends analytics payloads to FastAPI via HTTP.
- Backend emits real-time events through Socket.IO.

## Security

- Passwords hashed using bcrypt.
- JWT tokens with expiry.
- Role-based authorization middleware.
- Validation on API payloads.
- Helmet, CORS, and rate limiting.
