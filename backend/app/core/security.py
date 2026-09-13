from datetime import datetime, timedelta, timezone
import hashlib
from uuid import uuid4

import bcrypt
import jwt

from app.core.config import get_settings


def _bcrypt_input(password: str) -> bytes:
    return hashlib.sha256(password.encode("utf-8")).hexdigest().encode("ascii")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_bcrypt_input(password), bcrypt.gensalt()).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(_bcrypt_input(password), password_hash.encode("ascii"))


_timing_shield_hash: str | None = None


def burn_password_check(password: str) -> None:
    """Verify against a throwaway hash so unknown usernames cost the same
    bcrypt work as known ones and login timing can't enumerate accounts."""
    global _timing_shield_hash
    if _timing_shield_hash is None:
        _timing_shield_hash = hash_password("dom-timing-shield")
    verify_password(password, _timing_shield_hash)


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expires_minutes)
    payload = {"sub": subject, "exp": expires_at, "scope": "admin", "jti": uuid4().hex}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
