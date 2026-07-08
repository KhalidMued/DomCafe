# Changelog

## Unreleased
- Add `restart: unless-stopped` and healthchecks to all Docker Compose services, with health-gated `depends_on` ordering so the backend waits for healthy Postgres/Redis.
- Add a GitHub Actions CI workflow running backend pytest, frontend vitest and build, and Docker Compose config validation on every pull request.
- Run the backend container as a non-root user (UID 1001) and copy only the seed brand JSON into the image instead of the whole `docs/` directory.
- Record the 2026-07-08 production-readiness audit in `ledger/AUDIT-2026-07-08.md`.
- Add Nginx edge limits and Redis-backed backend fallback rate limits for admin login and guest order creation.
- Document current security controls and rate-limit behavior.
- Add Phase 0 project foundation.
