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

Nginx applies the public-facing limits using `$binary_remote_addr`. The backend fallback limiter uses FastAPI’s direct peer (`request.client.host`); client-supplied forwarding headers are ignored to prevent spoofing-based bypasses. Requests over the limit return HTTP `429`.

## Upload security

Drink photo uploads are restricted to safe image types, size-limited, verified as images, renamed server-side, and stored under `/uploads/drinks/`.

## Dependency security

Phase 6 hardening should include `pip-audit` for Python dependencies and `npm audit` for frontend dependencies. High and critical findings must be resolved before deployment.
