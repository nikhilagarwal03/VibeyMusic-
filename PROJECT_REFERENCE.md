# VibeyMusic - Single Project Reference

Last Updated: 2026-03-08

This is the canonical reference for architecture, implementation status, operational notes, and next steps.

## 1) Project Snapshot

VibeyMusic is a React + Vite music player frontend with a Hono + TypeScript backend wrapper for JioSaavn.

Core paths:
- Frontend: `src/`
- Backend API: `jiosaavn-api/src/`
- Vercel serverless entry: `api/[...path].ts`
- Shared contracts: `packages/contracts/`
- CI workflow: `.github/workflows/ci.yml`

## 2) Current Architecture

### Frontend
- Feature-first organization under `src/features/*`.
- Shared UI primitives under `src/shared/ui/*`.
- Runtime legacy tree `src/components/*` has been removed.
- App routing is route-based (`react-router-dom`) with:
  - `/home`
  - `/search`
  - `/library`
  - `/settings`
  - `/admin`

### State and Data
- Zustand domain slices:
  - `player.slice.js`
  - `library.slice.js`
  - `settings.slice.js`
- TanStack Query used for async server-state (search/detail/admin).

### Backend
- Domain modules under `jiosaavn-api/src/modules/*`:
  - `search`, `songs`, `albums`, `artists`, `playlists`, `admin`
- Shared backend modules under `jiosaavn-api/src/common/*`:
  - `errors`, `helpers`, `config`, `db`, etc.

## 3) Implemented Features

### Music Player
- Playback engine with play/pause/seek/volume/next/previous.
- Queue-based playback with source metadata.
- Repeat and shuffle integrated into active playback state.
- Mobile full player with queue drawer and queue selection.
- Desktop queue panel with quick selection + repeat/shuffle controls.
- Search with debounce, type filters, detail drill-down for albums/playlists/artists.
- Library with liked songs, liked collections, recently played.
- Local downloads metadata support and local custom playlists (create/rename/delete/edit tracks).
- Lyrics availability modal (metadata-level only, not full lyrics text rendering).
- Quick search shortcuts and keyboard focus shortcut (Ctrl/Cmd+K flow).

### Admin and Security
- JWT access + rotating refresh token flow.
- Refresh token via httpOnly cookie.
- CSRF double-submit protection.
- Brute-force lockout on login attempts.
- Optional IP allowlist for admin routes.
- Optional TOTP 2FA.
- Audit logging.
- Feature flags (backend + frontend CRUD).
- System settings (backend + frontend CRUD).
- Usage summary endpoint and panel.
- RBAC backend support (`admin`, `superadmin`).
- Admin users/session management (backend routes + frontend management UI).

### Reliability and Platform
- Request ID middleware.
- Standardized error envelope + centralized error classes.
- Structured JSON request logs.
- Redis/Upstash-compatible rate limiting with memory fallback.
- Redis/Upstash-compatible caching with memory fallback.
- Upstream retry/backoff/timeout + circuit breaker.

### Tooling and Validation
- Scripts available: `dev`, `build`, `test:api`, `test:frontend`, `check`.
- Backend test suite present (core domains + baseline admin service tests).
- Frontend unit-test baseline present (Vitest + jsdom).
- CI runs lint + frontend tests + backend tests + build.

## 4) Not Yet Implemented / Partial

### Product Gaps
- Full lyrics text fetch + render UX is not implemented.
- True offline media file caching/playback is partial (current local downloads are metadata/library behavior).
- Playlist sync/collaboration with backend accounts is not implemented.

### Contracts and Validation
- Shared contracts currently narrow (admin/envelope focused).
- Broad schemas for search/song/album/artist/playlist are missing.
- No generated TS types pipeline from contracts.

### Testing Gaps
- Frontend tests are baseline and need expansion (player/library/routing/admin flows).
- Backend route-level tests for admin auth/RBAC/session/user flows are limited.
- No contract tests against shared schemas.
- No E2E tests for critical user journey.

### Operational Gaps
- No full metrics pipeline (p95/p99 latency, cache hit ratio, route error metrics).
- No external dashboard/alert integration.
- No explicit user feedback subsystem (`user_feedback`).
- No explicit `usage_events` capture store beyond audit-log-derived summary.

## 5) Security Baseline (Current)

Implemented:
- JWT with short-lived access token.
- Rotating refresh token in httpOnly cookie.
- CSRF protection.
- Brute-force protection.
- Optional IP allowlist.
- Optional TOTP 2FA.
- Audit logging.

## 6) Environment Variables

Environment file strategy (single source):
- Global env file: `/.env` (repository root)
- Template file: `/.env.example` (same variable set as `.env`)
- Frontend reads `VITE_*` values from root `.env` via Vite.
- Backend also reads root `.env` (loaded in `jiosaavn-api/src/common/config/env.config.ts`).
- Optional backend override file: `jiosaavn-api/.env` (if present, it overrides root values).

Core/reliability:
- `NODE_ENV`
- `CORS_ORIGINS`
- `UPSTREAM_TIMEOUT_MS`
- `UPSTREAM_MAX_RETRIES`
- `UPSTREAM_BACKOFF_MS`
- `UPSTREAM_CIRCUIT_BREAKER_THRESHOLD`
- `UPSTREAM_CIRCUIT_BREAKER_COOLDOWN_MS`
- `REDIS_URL`
- `REDIS_TOKEN`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `CACHE_TTL_SEARCH_MS`
- `CACHE_TTL_DETAILS_MS`

Admin/security:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` (dev fallback)
- `ADMIN_PASSWORD_HASH`
- `ADMIN_TOTP_SECRET`
- `ADMIN_ALLOWED_IPS`
- `ADMIN_TOKEN` (legacy fallback for JWT signing)
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`

MongoDB:
- `MONGODB_URI`
- `MONGODB_DB_NAME`

## 7) Current Commands

Local dev:
- `npm install`
- `npm run dev`

Validation:
- `npm run lint`
- `npm run test:frontend`
- `npm run test:api`
- `npm run build`
- `npm run check`

## 8) Recommended Next Work (Priority)

1. Queue completion: reorder/remove/clear with desktop/mobile parity.
2. Playback resilience: explicit error state and graceful skip/fallback behavior.
3. Full lyrics flow: retrieve and render lyrics content.
4. Expand tests:
- frontend: player/library/routing/admin UI
- backend: admin auth/RBAC/session routes
- contracts + one E2E critical journey
5. Offline media strategy: actual local media caching/playback path.
6. Contract expansion: broader API schemas and generated types.
7. Architecture guardrails: stricter import/public API enforcement rules.

## 9) Notes

- This file is the sole architecture and implementation reference document for this repository.
- Legacy overlapping status/architecture docs were removed to avoid drift.
