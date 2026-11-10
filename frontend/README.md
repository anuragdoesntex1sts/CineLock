# CineLock Frontend

React + Vite + TypeScript + Tailwind CSS frontend for the CineLock movie ticket booking system.

## Design System

Built to **BookMyShow craft level** — familiar patterns, zero invention, exceptional polish.

### Color Palette (Semantic)

| Role | Light | Dark | Usage |
|------|-------|------|-------|
| `--brand-primary` | `#E50914` | `#FF1A1A` | Primary actions, focus |
| `--success` | `#00A651` | `#00D46A` | Available seats |
| `--warning` | `#FF8C00` | `#FFB340` | Locked seats |
| `--danger` | `#E50914` | `#FF4444` | Booked seats |
| `--selected` | `#1A73E8` | `#4A9EFF` | User-selected seats |

### Typography

- **Font:** Inter (system fallback stack)
- **Scale:** display(48px) → h1(32px) → h2(24px) → h3(20px) → body-lg(18px) → body(16px) → body-sm(14px) → caption(12px)

### Spacing

Base unit: 8px (`space-2` = 8px, `space-4` = 16px, etc.)

### Components

All components in `src/components/ui/` follow the design system:
- Button (primary, secondary, ghost, danger; sm, md, lg, icon)
- Input (sm, md, lg; with label, error, helper text)
- Card (default, hover; padding variants)
- Modal / Sheet
- Badge (primary, success, warning, danger, selected)
- Skeleton (text, card, avatar)

### Seat Map

Located in `src/components/seatmap/`:
- `Seat` — interactive seat with states (available, selected, locked, booked, wheelchair)
- `ColorLegend` — status legend with live lock countdown
- `LockCountdown` / `LockCountdownBanner` — real-time TTL display
- `SeatMapComponent` — full seat grid with row labels, aisles, screen indicator
- `ScreenIndicator` — "SCREEN THIS WAY" banner

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Movie carousel, search, genre filter |
| MovieDetail | `/movie/:id` | Poster, info, showtimes by date/theater |
| ShowSelection | `/show/:id` | Theater selection, time picker |
| SeatMap | `/booking/:showId` | **Core** — SVG seat map, live locking |
| BookingConfirm | `/booking/:showId/confirm` | Seat summary, lock token, confirm |
| Payment | `/payment/:bookingId` | Mock card/UPI/wallet |
| Ticket | `/ticket/:bookingId` | PDF download with QR |
| MyBookings | `/bookings` | History, re-download, cancel |
| Login | `/login` | JWT auth |
| Register | `/register` | Account creation |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (proxies to FastAPI on :8000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment

Copy `.env.example` to `.env` and configure:

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=CineLock
```

## Project Structure

```
src/
├── components/
│   ├── ui/           # Base components (Button, Input, Card, Modal, etc.)
│   ├── layout/       # Header, Container, Section
│   ├── movie/        # MovieCard, MovieCarousel
│   ├── theater/      # TheaterCard, ShowtimePicker
│   ├── seatmap/      # Seat, ColorLegend, LockCountdown, SeatMapComponent
│   ├── booking/      # BookingSummary, PaymentForm
│   └── auth/         # LoginForm, RegisterForm
├── hooks/            # useAuth, useToast, useMovies, useShows, useSeatLock, usePolling
├── pages/            # All route pages
├── lib/              # api, auth, polling, utils
├── types/            # TypeScript types
└── styles/           # globals.css (CSS custom properties + Tailwind)
```

## Key Features

### Real-Time Seat Locking
- 5-minute TTL with live countdown
- Polling: 2s when active locks, 10s idle
- Optimistic UI updates
- Two-window demo ready

### Accessibility (WCAG AA)
- Color contrast for all seat states
- Keyboard navigation (arrow keys, Enter/Space)
- Screen reader labels (`aria-label` on every seat)
- Focus indicators
- Reduced motion support

### Dark Mode
- System preference + manual toggle
- Persisted in localStorage
- All semantic colors defined for both modes

## Demo Flow (for Examiner)

1. Open `http://localhost:5173`
2. Browse movies → click one → select date/theater/time
3. On seat map: click seats → "Lock Seats" → watch countdown
4. Open **second browser window** (incognito) → same show → try same seats → see lock conflict
5. "Confirm Booking" → mock payment → download PDF ticket
6. Show "My Bookings" with history

## Scripts

```bash
npm run dev       # Start dev server on :5173
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run lint      # ESLint check
```