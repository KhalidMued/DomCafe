"""Fail-closed Redis allowlist for individually revocable admin sessions."""
import asyncio

import jwt
from fastapi import HTTPException

from app.core.config import get_settings
from app.db.redis import get_redis

IO_TIMEOUT = 1


def _claims(token: str) -> dict | None:
    try:
        claims = jwt.decode(
            token, get_settings().jwt_secret, algorithms=["HS256"],
            options={"require": ["sub", "exp", "jti", "scope"]},
        )
        if claims["scope"] != "admin":
            return None
        if not isinstance(claims["sub"], str) or not claims["sub"].isdigit():
            return None
        if not isinstance(claims["jti"], str) or not claims["jti"]:
            return None
        if type(claims["exp"]) is not int:
            return None
        return claims
    except (jwt.PyJWTError, ValueError, TypeError, OverflowError):
        return None


async def _command(operation: str, *args, **kwargs):
    try:
        async with asyncio.timeout(IO_TIMEOUT):
            return await getattr(get_redis(), operation)(*args, **kwargs)
    except Exception:
        # Never expose Redis URLs or credentials in errors.
        raise HTTPException(status_code=503, detail="Admin sessions unavailable.") from None


def _key(claims: dict) -> str:
    return f"dom:admin:session:{claims['jti']}"


async def register_admin_session(token: str) -> None:
    claims = _claims(token)
    if claims is None:
        raise HTTPException(status_code=401, detail="Admin login required.")
    registered = await _command("set", _key(claims), claims["sub"], exat=claims["exp"], nx=True)
    if not registered:
        raise HTTPException(status_code=503, detail="Admin sessions unavailable.")


async def active_admin_subject(token: str) -> str | None:
    claims = _claims(token)
    if claims is None:
        return None
    subject = await _command("get", _key(claims))
    # Recheck expiry after I/O, which may have crossed the token deadline.
    return claims["sub"] if subject == claims["sub"] and _claims(token) else None


async def revoke_admin_session(token: str) -> None:
    claims = _claims(token)
    if claims is not None:
        await _command("delete", _key(claims))
