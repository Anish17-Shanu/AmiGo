# AmiGo - Data-Driven E-commerce Platform with Real-Time Insights

AmiGo is a production-grade e-commerce system with a React storefront/admin panel, Express API, MongoDB persistence, a FastAPI analytics microservice, and Socket.IO live insights.

## Monorepo Structure

- `client/` - React + Vite + Tailwind + Framer Motion frontend
- `server/` - Node.js + Express + MongoDB + Socket.IO backend
- `analytics-service/` - FastAPI + scikit-learn analytics microservice
- `postman/` - API collection
- `docs/` - architecture and operational notes

## Quick Start

1. Copy env files:
   - `server/.env.example` -> `server/.env`
   - `client/.env.example` -> `client/.env`
   - `analytics-service/.env.example` -> `analytics-service/.env`
2. Start services:
   - Docker: `docker compose up --build`
   - Manual: follow each service README.
3. Seed data:
   - `cd server && npm run seed`
4. Run tests:
   - `cd server && npm test`
   - `cd analytics-service && pytest`

## Default Ports

- Client: `5173`
- Server: `5000`
- Analytics Service: `8000`
- MongoDB: `27017`

## Security Highlights

- JWT authentication with role-based access control
- Password hashing with bcrypt
- Input validation with express-validator and pydantic
- API rate limiting + Helmet + CORS policy
- Structured request logging with Winston + Morgan
