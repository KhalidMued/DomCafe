from datetime import datetime, timedelta, timezone
import hashlib

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings


def _bcrypt_input(password: str) -> bytes:
    return hashlib.sha256(password.encode("utf-8")).hexdigest().encode("ascii")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_bcrypt_input(password), bcrypt.gensalt()).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(_bcrypt_input(password), password_hash.encode("ascii"))


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expires_minutes)
    payload = {"sub": subject, "exp": expires_at, "scope": "admin"}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_admin_subject(token: str) -> str | None:
    try:
        payload = jwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"])
    except JWTError:
        return None
    if payload.get("scope") != "admin":
        return None
    subject = payload.get("sub")
    return subject if isinstance(subject, str) and subject else None
