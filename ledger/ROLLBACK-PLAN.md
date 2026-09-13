# Rollback Plan

For Phase 0, rollback by reverting the foundation commit or closing the pull request before merge. No runtime data migrations are included.

## Security dependency and session hardening

Revert the hardening commit and rebuild the Compose stack. No database migration is involved. Existing sessions issued by the hardening release depend on their Redis allowlist entries and will be rejected by the reverted code only if token decoding requirements changed; plan for admins to sign in again after either deployment or rollback. Keep the Nginx host port loopback-only unless direct LAN access is explicitly restored as a separate security decision.
