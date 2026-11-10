<div align="center">

# CineLock

### Find a film. Pick a cinema. Lock your seats. Enjoy the show.

**A full-stack cinema booking project with city-based theatre discovery, live seat locking, and reconciled UPI checkout.**

[![React](https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white)](https://react.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/) [![Python](https://img.shields.io/badge/Python-3.10%2B-3776ab?logo=python&logoColor=white)](https://www.python.org/) [![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)](https://vite.dev/)

</div>

## At a glance

![CineLock booking journey: discover, choose, book, and get your ticket](docs/assets/cinelock-booking-journey.svg)

| Discover | Choose | Book | Verify |
|:--|:--|:--|:--|
| Browse films, posters, and genres | Search a city and browse its demo cinemas | Select a show, screen, and available seats | Verify payment before issuing a ticket |

CineLock is a React and TypeScript web app backed by FastAPI. It covers the customer journey from movie discovery through ticket download, including expiring seat holds and payment reconciliation with the separately run [YouPI-PG gateway](https://github.com/youpi-pg/YouPI-PG).

> **Demo data:** Theatre and showtime availability is seeded sample data, not a live cinema-chain feed. Real UPI checkout requires a configured YouPI-PG instance and healthy payment observers. Never use production credentials in a public repository.

## Booking journey

```mermaid
flowchart LR
    A[Explore films] --> B[Choose a movie] --> C[Search or confirm a city]
    C --> D[Choose cinema and show] --> E[Select available seats]
    E --> F[Temporary seat hold] --> G{Payment}
    G -->|Verified gateway event| H[Confirmed booking] --> I[Ticket and QR]
    G -->|Cancelled or expired| J[Release seats] --> E
```

### Seat states

| Available 🟢 | Selected 🔵 | Temporarily held 🟠 | Booked 🔴 |
|:--:|:--:|:--:|:--:|
| Ready to choose | In your selection | Checkout hold with expiry | Not selectable |

## Architecture

```mermaid
flowchart TB
    Browser[React · TypeScript · Vite]
    API[FastAPI<br/>Auth · Movies · Shows · Seats · Bookings]
    Store[(JSON repositories<br/>file locking)]
    TMDB[TMDB<br/>movie data and posters]
    Geo[Geoapify<br/>city search and geocoding]
    YouPI[YouPI-PG<br/>checkout session]
    SMS[SMS payment observer]
    Browser -->|REST| API
    API --> Store
    API --> TMDB
    API --> Geo
    API -->|Create checkout| YouPI
    YouPI -->|Signed payment webhook| API
    YouPI --> SMS
```

```mermaid
sequenceDiagram
    actor Viewer as Customer
    participant Web as CineLock web app
    participant API as CineLock API
    participant PG as YouPI-PG
    Viewer->>Web: Select show and seats
    Web->>API: Lock seats (temporary hold)
    API-->>Web: Hold token and expiry
    Web->>API: Request checkout session
    API->>PG: Create payment session (server key)
    PG-->>Web: Checkout URL / UPI flow
    PG->>API: Signed payment status webhook
    API->>API: Verify signature and reconcile payment
    API-->>Web: Confirm booking and issue ticket
```

## Features

- Movie discovery, genre filtering, movie details, and poster artwork.
- Location search by city or neighborhood, plus browser location when permission is granted.
- Demo theatre/showtime data for supported locations; the customer explicitly chooses the theatre.
- Interactive seat maps, price summaries, expiring holds, and automatic release after timeout.
- Account registration and login, booking history, QR tickets, and PDF ticket download.
- YouPI checkout sessions created server-side; booking confirmation follows trusted payment reconciliation.
- Light, dark, and system theme options.

## Stack

| Area | Technologies |
|:--|:--|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| Data | JSON file repositories with file locks (demo setup) |
| Integrations | TMDB, Geoapify, YouPI-PG |
| Tickets | QR generation and PDF export |

## Run locally

Requirements: Python 3.10+, Node.js 18+, npm. API credentials are optional for features that use external services.

### Backend (PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set a private `JWT_SECRET_KEY` in `backend/.env`; add TMDB, Geoapify, and YouPI values as needed. Start the API:

```powershell
python run.py
```

API: [http://localhost:8000](http://localhost:8000) · Swagger docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend (second terminal)

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies API requests to FastAPI.

Movie and demo cinema/showtime data scripts live in `backend/scripts/`. Fetching live movie catalogue data requires a TMDB API key.

## External services

### TMDB and Geoapify

Set `TMDB_API_KEY` and `GEOAPIFY_API_KEY` in `backend/.env` to enable movie refresh/posters and city geocoding. Browser location requires user permission. Seeded theatre availability is demo data.

### YouPI-PG checkout

Run YouPI-PG separately using its [setup guide](https://github.com/youpi-pg/YouPI-PG). Keep the merchant API key and webhook secret in `backend/.env`; the frontend `.env.local` should contain only the checkout script URL and publishable key. Set YouPI's webhook destination to:

```text
http://localhost:8000/api/v1/payments/youpi/webhook
```

Allow the frontend origin `http://localhost:5173` in the gateway. New UPI checkouts require healthy YouPI payment observers. Never commit local `.env` files, credentials, or payment data.

## Repository map

```text
backend/app/api/          FastAPI route handlers
backend/app/models/       Domain models
backend/app/repositories/ JSON-backed persistence
backend/app/schemas/      Request and response models
backend/app/services/     Booking, seat, and payment logic
backend/app/tasks/        Background jobs
backend/scripts/          Demo data and movie scripts
frontend/src/components/  Shared and feature UI
frontend/src/hooks/       Query, auth, and booking hooks
frontend/src/pages/       Discovery, booking, payment, and account pages
frontend/src/services/    API clients
```

## API map

| Area | Example routes |
|:--|:--|
| Authentication | `/api/auth/register`, `/api/auth/login`, `/api/auth/me` |
| Movies and cinemas | `/api/movies`, `/api/theaters`, `/api/theaters/cities` |
| Shows | `/api/shows`, `/api/shows/by-movie/{movie_id}` |
| Seats | `/api/seats/map/{show_id}`, `/api/seats/lock`, `/api/seats/confirm` |
| Payments | `/api/payments/youpi/checkout-session`, `/api/payments/youpi/webhook` |
| Bookings | `/api/bookings`, `/api/bookings/{booking_id}/ticket` |
| Locations | `/api/locations/search`, `/api/locations/nearby-theaters` |

## Important limitations

- Cinema, screen, seat, and showtime inventory is mock/demo data unless connected to an inventory provider.
- JSON storage is for this project/demo; production needs transactional storage and secured HTTPS deployments.
- Redirects alone do not confirm payment. The server verifies payment reconciliation before issuing a ticket.
- No license file is included. Add a license before granting others reuse rights.
