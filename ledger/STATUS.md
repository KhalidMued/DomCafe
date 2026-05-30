# Status

## Current phase
Phase 0 — Foundation

## Current branch
feature/project-foundation

## What works
- Repository foundation files and directories are present.
- Docker Compose skeleton defines frontend, backend, postgres, PgBouncer, Redis, and Nginx.
- Nginx is the only exposed service and binds to `127.0.0.1:11080`.
- DŌM placeholder drink image exists at `uploads/drinks/placeholder.jpg`.

## What is pending
- Phase 1 backend foundation after this PR is reviewed and merged.

## Known issues
- GitHub authentication is not available in this environment yet, so push/PR creation may require owner action.

## Next recommended task
Review and merge Phase 0, then start Phase 1 — Backend Foundation.
