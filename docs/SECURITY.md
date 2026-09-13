# Security

See `AGENT.md` for project rules and source requirements.

## Network exposure

- Nginx is the only service with a published host port and is the expected public entry point.
- Backend, PostgreSQL, PgBouncer, and Redis stay on Docker-internal networks only.
- If another reverse proxy/CDN/load balancer is placed in front of Nginx, configure Nginx `real_ip` with explicit trusted upstreams before relying on per-client edge rate limits.
- Nginx is bound to `127.0.0.1:11080:80`, preventing LAN, Tailscale, and direct-origin access from bypassing Cloudflare. Local server checks still use loopback.
- Cloudflare Tunnel routes `dom.khalidmued.com` to `http://127.0.0.1:11080`, so the public domain still reaches only the Nginx entrypoint.
- The `cloudflared` system service uses HTTP/2 because QUIC was unstable on this server/network during setup.

## Authentication

- Admin routes use 60-minute JWT sessions after `/api/admin/login`. The JWT is delivered in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie scoped to `/api` and never appears in the response body or localStorage, so page scripts cannot exfiltrate it. A separate non-secret `dom_admin_session` hint cookie tells the SPA whether to render admin pages. The public HTTPS hostname is the supported browser-admin path.
- Each JWT has a unique `jti` and is registered in a TTL-bounded Redis allowlist. Every protected REST request and admin event-stream authorization checks that active-session record and fails closed if Redis is unavailable. Logout revokes the server-side session before clearing cookies, so a copied cookie or bearer token stops working immediately; an already-connected admin stream rechecks the session every 15 seconds and then closes after revocation.
- Protected admin routes also accept an explicit `Authorization: Bearer …` header for tests and tooling. The same Redis session requirements apply.
- Login verifies a throwaway bcrypt hash when the username is unknown, so response timing cannot be used to enumerate admin accounts.
- Agent routes use the separate `AGENT_API_KEY` bearer credential.
- Database connections authenticate with SCRAM-SHA-256 end to end (audit L5): PgBouncer runs `auth_type = scram-sha-256`, so both the backend→PgBouncer and PgBouncer→PostgreSQL legs use challenge–response and the password never crosses the Docker network in clear text. The PgBouncer auth file stores the secret in plain form (required to serve both legs) but is written `0600` inside the container, which already receives the same secret via its environment.
- Do not log passwords, JWTs, `AGENT_API_KEY`, Discord webhook URLs, database passwords, or connection strings.

## Rate limits

Nginx edge limits and Redis-backed backend fixed-window limits protect high-risk write endpoints. If Redis is unavailable, the backend fails open so guests and admins are not locked out by an infrastructure blip; health checks still report Redis failures. The Nginx edge limits remain active independently of Redis.

- `/api/admin/login`: 5 attempts per client IP per minute.
- `/api/orders`: 10 attempts per client IP per minute.

Nginx applies the public-facing limits using `$binary_remote_addr` after restoring the real client IP: Cloudflare Tunnel traffic reaches Nginx from the Docker host network, so Nginx trusts `CF-Connecting-IP` only from `172.16.0.0/12` (`set_real_ip_from` + `real_ip_header`). Direct LAN/Tailscale clients connect from outside that range and cannot spoof the header.

The backend fallback limiter uses `request.client.host` resolved through uvicorn `--proxy-headers`. Nginx overwrites `X-Forwarded-For` with the resolved `$remote_addr` (it does not append to a client-supplied chain), so clients cannot smuggle a spoofed source IP to the backend. Requests over the limit return HTTP `429`.

## Guest order lookup

Guest order status is looked up by a random, unguessable `public_code` (`secrets.token_urlsafe`, unique per order) instead of the sequential integer order id, so order details cannot be enumerated. The integer id remains internal and appears only as the human-friendly `order_number`.

The matching guest Server-Sent Events stream is protected by the same unguessable `public_code`; numeric order ids are not accepted. The admin stream requires the existing admin JWT cookie or bearer authentication. Stream messages are invalidation-only (`data: {}`) and never contain guest names, order contents, order identifiers, or credentials. Clients fetch authoritative details from the existing authenticated/scoped REST endpoints after a notification. Redis Pub/Sub carries only these empty invalidations between backend workers, and Nginx applies per-client request-rate and concurrent-connection limits to bound stream setup and long-lived resources.

## Security headers

The security headers (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) live in `nginx/conf.d/security-headers.inc` and are included in the `server` block and in every `location` that declares its own `add_header` (Nginx drops inherited headers in such locations), including `/api/*` and `/uploads/*` responses. The one-day HSTS policy omits `includeSubDomains` and `preload`; browsers enforce HSTS only when it is received over HTTPS.

## Upload security

Drink photo uploads are restricted to safe image types, size-limited, verified as images, renamed server-side, and stored under `/uploads/drinks/`. Every upload is re-encoded to WebP (capped at 1600px, EXIF metadata stripped), so the original uploaded bytes are never served.

Replaced photos do not accumulate on disk (audit finding L3): when a new upload replaces a server-generated photo of the same drink, the old file is deleted, but only if its name matches the exact server-generated pattern (`<drink_id>-<32-hex>.webp`) and no other drink still references it. Curated assets (`placeholder.jpg`, the tracked `.png` photos, hand-promoted files) never match the pattern and are never touched. Caveat: if a generated `.webp` is later promoted to a curated Git-tracked asset, replacing that drink's photo in the admin panel still deletes the working-tree file — restore it with `git checkout -- uploads/drinks/<file>`.

## Dependency security

Phase 6 dependency audits run `pip-audit` for Python dependencies and `npm audit --audit-level=high` for frontend dependencies. High and critical findings must be resolved before deployment.

Current audit hardening:

- Backend dependency pins were updated to remove known Python advisories in FastAPI/Starlette, `python-multipart`, Pillow, pytest, and `python-jose`.
- Admin JWT handling uses `PyJWT` instead of `python-jose` because `python-jose` still had an advisory without a fixed release.
- `pytest-asyncio` is pinned explicitly because the backend test suite contains async tests.
- The 2026-09-13 refresh updated `python-multipart`, Pillow, Vite, Vitest, and their lockfile dependencies; fresh `pip-audit` and `npm audit --audit-level=high` runs report no known vulnerabilities.
- Runtime images are rebuilt from current pinned or maintained upstream bases and scanned with Trivy. Base-image findings without an available fix are documented in the deployment record rather than hidden or patched with unverified replacements.
