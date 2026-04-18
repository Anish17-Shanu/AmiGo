# Analytics Service

Maintainer/Creator: **Anish Kumar**

## Setup

1. Create virtualenv and activate.
2. `pip install -r requirements.txt`
3. `uvicorn app.main:app --reload --port 8000`

## Endpoints

- `GET /health`
- `POST /recommend`
- `POST /forecast`
- `POST /segment`
