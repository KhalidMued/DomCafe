# Security

See `AGENT.md` for project rules and source requirements.

## Network exposure

- Nginx is the only service with a published host port and is the expected public entry point.
- Backend, PostgreSQL, PgBouncer, and Redis stay on Docker-internal networks only.
- If another reverse proxy/CDN/load balancer is placed in front of Nginx, configure Nginx `real_ip` with explicit trusted upstreams before relying on per-client edge rate limits.
- For private Tailscale development access, Nginx is bound to `0.0.0.0:11080:80`.
- Cloudflare Tunnel routes `dom.khalidmued.com` to `http://127.0.0.1:11080`, so the public domain still reaches only the Nginx entrypoint.
- The `cloudflared` system service uses HTTP/2 because QUIC was unstable on this server/network during setup.

## Authentication

- Admin routes use JWT bearer authentication after `/api/admin/login`.
- Agent routes use the separate `AGENT_API_KEY` bearer credential.
- Do not log passwords, JWTs, `AGENT_API_KEY`, Discord webhook URLs, database passwords, or connection strings.

## Rate limits

Nginx edge limits and Redis-backed backend fixed-window limits protect high-risk write endpoints. If Redis is unavailable, the backend fails open so guests and admins are not locked out by an infrastructure blip; health checks still report Redis failures. The Nginx edge limits remain active independently of Redis.

- `/api/admin/login`: 5 attempts per client IP per minute.
- `/api/orders`: 10 attempts per client IP per minute.

Nginx applies the public-facing limits using `$binary_remote_addr` after restoring the real client IP: Cloudflare Tunnel traffic reaches Nginx from the Docker host network, so Nginx trusts `CF-Connecting-IP` only from `172.16.0.0/12` (`set_real_ip_from` + `real_ip_header`). Direct LAN/Tailscale clients connect from outside that range and cannot spoof the header.

The backend fallback limiter uses `request.client.host` resolved through uvicorn `--proxy-headers`. Nginx overwrites `X-Forwarded-For` with the resolved `$remote_addr` (it does not append to a client-supplied chain), so clients cannot smuggle a spoofed source IP to the backend. Requests over the limit return HTTP `429`.

## Guest order lookup

Guest order status is looked up by a random, unguessable `public_code` (`secrets.token_urlsafe`, unique per order) instead of the sequential integer order id, so order details cannot be enumerated. The integer id remains internal and appears only as the human-friendly `order_number`.

## Security headers

The standard security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) live in `nginx/conf.d/security-headers.inc` and are included in the `server` block and in every `location` that declares its own `add_header` (Nginx drops inherited headers in such locations), including `/api/*` and `/uploads/*` responses.

## Upload security

Drink photo uploads are restricted to safe image types, size-limited, verified as images, renamed server-side, and stored under `/uploads/drinks/`. Every upload is re-encoded to WebP (capped at 1600px, EXIF metadata stripped), so the original uploaded bytes are never served.

## Dependency security

Phase 6 dependency audits run `pip-audit` for Python dependencies and `npm audit --audit-level=high` for frontend dependencies. High and critical findings must be resolved before deployment.

Current audit hardening:

- Backend dependency pins were updated to remove known Python advisories in FastAPI/Starlette, `python-multipart`, Pillow, pytest, and `python-jose`.
- Admin JWT handling uses `PyJWT` instead of `python-jose` because `python-jose` still had an advisory without a fixed release.
- `pytest-asyncio` is pinned explicitly because the backend test suite contains async tests.
