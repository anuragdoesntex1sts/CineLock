# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite (separate frontend), FastAPI backend with JSON file persistence, proxied via Vite dev server

## Users

**Primary:** College examiner evaluating the project during end-semester demo. Situation: 5-10 minute live walkthrough. Job: verify real-time seat locking works, booking flow completes, ticket downloads, code is clean.

**Secondary (implied):** Movie-goer browsing shows, selecting seats, completing booking — but only insofar as the examiner can demonstrate this flow.

## Product Purpose

A movie ticket booking system that **visually proves real-time seat locking concurrency** — the examiner can open two browser windows, select the same seat, and see only one succeed with lock expiry countdown. Success means: clean demo flow, working seat map with live state, PDF ticket with QR code, and well-structured codebase that passes code review.

## Positioning

Unlike BookMyShow/Paytm clones that hide concurrency, this system **exposes the locking mechanism** as a visible, interactive feature: seat lock tokens, TTL countdown, atomic confirm/release, and race-condition proof. It's a teaching tool disguised as a booking app.

## Operating Context

- **Demo environment:** Localhost (FastAPI on :8000, Vite on :5173), two browser windows side-by-side
- **Data source:** Real movies from TMDB API (cached locally), generated theaters/screens/shows for 7 days
- **Persistence:** JSON files (college requirement: file handling) with portalocker for cross-platform file locking
- **Auth:** JWT in httpOnly cookie + localStorage for demo simplicity
- **Payment:** Mock endpoint (card/UPI/wallet) — no real gateway
- **Ticket:** PDF with QR code (booking ID + JWT) generated via ReportLab

## Capabilities and Constraints

**Confirmed capabilities:**
- Movie browsing with posters, genres, durations (real TMDB data)
- Theater/screen/showtime selection with date filtering
- Interactive seat map (SVG/Canvas) showing available/locked/booked states
- Seat locking with 5-minute TTL, visible countdown, atomic confirm
- Booking creation, mock payment, PDF ticket download with QR
- User booking history

**Constraints:**
- File-based JSON persistence (no database) — college requirement
- Solo project — scope must be completable in ~3-4 weeks
- Windows-compatible file locking (portalocker)
- No WebSockets — polling for lock state (simpler, works for demo)
- Examiner may test on their machine — must run with `docker compose up` or simple scripts

**Undecided:**
- Whether to add admin panel for theater/movie management (deferred)
- Offline/localStorage fallback for seat selection

## Brand Commitments

**Name:** "CineLock" (working title — emphasizes the locking mechanism)
**Voice:** Technical, transparent, confident — shows the mechanism, doesn't hide it
**Personality:** "Engineering showcase" — clean, fast, no dark patterns, no ads
**Assets:** None provided — will generate visual identity from code
**Visual World:** Canon (standard movie booking UI) executed at **BookMyShow craft level** — familiar patterns, zero surprise, but every interaction polished to reference quality: seat map responsiveness, lock countdown clarity, ticket download flow, error states. No irony, no quirk, just category-standard done exceptionally well.

## Evidence on Hand

- **Real movie data:** TMDB API integration (scripts/fetch_movies.py) — cached in `data/movies.json`
- **Seat locking algorithm:** File-locked JSON with TTL — core technical artifact
- **PDF ticket generation:** ReportLab + qrcode — working prototype needed
- **Concurrency test:** Automated test simulating two users racing for same seat

**Absences (must not fabricate):**
- No real payment gateway integration
- No user reviews/ratings
- No loyalty program
- No mobile app

## Product Principles

1. **Expose the mechanism** — The seat lock is the hero feature; make it visible, not hidden
2. **Demo-first UX** — Every flow must work flawlessly in a 5-minute live walkthrough
3. **Code as documentation** — Architecture should be readable without comments; types over docs
4. **No phantom complexity** — File-based persistence is a constraint, not a limitation; own it
5. **Respect the examiner's time** — Zero setup friction, instant state reset, clear error messages

## Accessibility & Inclusion

- WCAG AA contrast ratios for seat states (available/locked/booked/selected)
- Keyboard-navigable seat map (arrow keys + Enter/Space)
- Screen reader labels for seat grid (row/column/status)
- Reduced motion preference respected for lock countdown animation
- Focus indicators on all interactive elements