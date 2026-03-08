# VibeyMusic

VibeyMusic is a Vite + React music UI backed by a Hono-based JioSaavn API wrapper.

## Canonical Project Reference

For architecture, implementation status, security, testing, and roadmap details, use `PROJECT_REFERENCE.md`.

## Project Structure

- `src/` - Frontend React app
- `jiosaavn-api/` - API source and build output
- `api/[...path].ts` - Vercel serverless entry for API routes

## Local Development

Install dependencies:

```bash
npm install
```

Run frontend + API together:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` requests to the API.

## Production Build

Build API + frontend in sequence:

```bash
npm run build:vercel
```

Frontend-only build:

```bash
npm run build
```

## Deploying to Vercel

This repo includes `vercel.json` with:

- build command: `npm run build:vercel`
- static output directory: `dist`
- serverless function runtime for `api/[...path].ts`

### Required Environment Variables

- `NODE_ENV=production`

### Recommended Environment Variables

- `VITE_API_BASE_URL=/api`
- `CORS_ORIGINS=https://your-frontend-domain.vercel.app`
- `UPSTREAM_TIMEOUT_MS=8000`
- `UPSTREAM_MAX_RETRIES=2`
- `UPSTREAM_BACKOFF_MS=250`
- `UPSTREAM_CIRCUIT_BREAKER_THRESHOLD=5`
- `UPSTREAM_CIRCUIT_BREAKER_COOLDOWN_MS=30000`

Optional Redis/Upstash settings for distributed rate-limit + cache:

- `REDIS_URL=<upstash-rest-url>`
- `REDIS_TOKEN=<upstash-rest-token>`
- `RATE_LIMIT_WINDOW_MS=60000`
- `RATE_LIMIT_MAX_REQUESTS=80`
- `CACHE_TTL_SEARCH_MS=60000`
- `CACHE_TTL_DETAILS_MS=300000`

### Admin + Control Plane Environment Variables

- `ADMIN_EMAIL=admin@example.com`
- `ADMIN_PASSWORD_HASH=<bcrypt-hash>`
- `ADMIN_TOTP_SECRET=<base32-secret-for-2fa-optional>`
- `JWT_SECRET=<long-random-secret>`
- `REFRESH_TOKEN_SECRET=<long-random-secret>`

Legacy fallback (optional):

- `ADMIN_TOKEN=<legacy-signing-token>`

Optional fallback (for local development only):

- `ADMIN_PASSWORD=<plaintext-password>`

Optional MongoDB Atlas integration for admin sessions and audit logs:

- `MONGODB_URI=<mongodb-atlas-connection-string>`
- `MONGODB_DB_NAME=vibeymusic`

### Admin Auth Security Model

- Refresh token is issued as an `httpOnly` cookie (`/api/admin` path).
- Access token is kept in frontend memory only (not localStorage).
- Admin page performs silent session refresh on load via cookie.
- Refresh token rotates on every `/api/admin/auth/refresh` call.

Additional hardening enabled:

- CSRF protection for `POST /api/admin/auth/*` via `x-csrf-token` + cookie match.
- Login brute-force lockout/backoff (temporary lock after repeated failed attempts).
- Optional IP allowlist for all `/api/admin/*` routes.
- Optional TOTP-based 2FA on admin login (`ADMIN_TOTP_SECRET` enabled).

New optional environment variables:

- `ADMIN_ALLOWED_IPS=203.0.113.10,198.51.100.25`

## Notes

- Search endpoint includes debounce + minimum query length in frontend.
- API includes basic rate limiting for search endpoints and CDN cache headers for API GET routes.
