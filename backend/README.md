# CineLock Backend

FastAPI backend for the CineLock movie ticket booking system with JSON file persistence and real-time seat locking.

## Features

- **FastAPI** with auto-generated Swagger docs at `/docs`
- **JSON file persistence** (college requirement) with `portalocker` for concurrency
- **JWT Authentication** (access + refresh tokens)
- **TMDB Integration** for real movie data
- **Real-time Seat Locking** with 5-minute TTL and atomic operations
- **Mock Payments** (card, UPI, wallet)
- **QR Code + PDF Ticket** generation

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Copy environment file and configure
cp .env.example .env
# Edit .env with your TMDB_API_KEY and JWT_SECRET_KEY

# 3. Fetch real movie data from TMDB
python scripts/fetch_movies.py

# 4. Seed theaters, screens, and shows
python scripts/seed_data.py

# 5. Run the server
python run.py
```

Server runs at `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

*More endpoints coming in Phase 2-4...*

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, lifespan
│   ├── config.py            # Settings from .env
│   ├── models/              # Domain models (dataclasses)
│   ├── schemas/             # Pydantic request/response
│   ├── repositories/        # JSONFileRepository + implementations
│   ├── services/            # Business logic
│   ├── api/                 # Route modules
│   ├── utils/               # JWT, password, QR, PDF
│   └── tasks/               # Background tasks (lock cleanup)
├── data/                    # JSON files (gitignored)
├── scripts/
│   ├── fetch_movies.py      # TMDB → movies.json
│   └── seed_data.py         # Theaters, screens, shows
├── requirements.txt
├── .env.example
└── run.py
```

## Seat Locking Architecture

```
POST /api/seats/lock
  → Acquire file lock on seat_locks.json (portalocker)
  → Check each seat: not booked, not locked by another user
  → Create lock records with lock_token + expires_at (5 min)
  → Release file lock
  → Return lock_token

POST /api/seats/confirm
  → Validate lock_token, check not expired
  → Atomic: mark seats booked, create booking, delete locks
  → Return booking_id

POST /api/seats/release
  → Delete locks for token
```

Background task runs every 60s to clean expired locks.

## Development

```bash
# Run with auto-reload
python run.py

# Run tests (Phase 5)
pytest tests/

# Format code
black app/
isort app/
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TMDB_API_KEY` | TMDB API key (required for movie data) | - |
| `JWT_SECRET_KEY` | Secret for JWT signing (min 32 chars) | - |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | 30 |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | 7 |
| `SEAT_LOCK_TTL_MINUTES` | Seat lock duration | 5 |
| `CORS_ORIGINS` | Allowed frontend origins | `["http://localhost:5173"]` |
| `DATA_DIR` | JSON data directory | `./data` |

## Demo Flow (Examiner)

1. Open `http://localhost:8000/docs` — show Swagger API
2. Register/login via `/api/auth/*`
3. Browse movies → shows → seat map
4. Lock seats → watch 5-min countdown
5. **Open second browser window** → try same seats → see conflict
6. Confirm booking → mock payment → download PDF ticket