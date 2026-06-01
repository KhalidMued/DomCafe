from fastapi import HTTPException, Request, status
from redis.exceptions import RedisError

from app.db.redis import get_redis

ADMIN_LOGIN_MAX_ATTEMPTS = 5
ORDER_CREATE_MAX_ATTEMPTS = 10
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_SCRIPT = """
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
"""


def _client_ip(request: Request) -> str:
    if request.client is None:
        return "unknown"
    return request.client.host


async def _check_rate_limit(key: str, max_attempts: int, message: str) -> None:
    redis = get_redis()
    try:
        eval_script = getattr(redis, "eval")
        attempts = int(await eval_script(RATE_LIMIT_SCRIPT, 1, key, str(RATE_LIMIT_WINDOW_SECONDS)))
    except RedisError:
        return
    finally:
        try:
            await redis.aclose()
        except RedisError:
            pass

    if attempts > max_attempts:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=message)


async def enforce_admin_login_rate_limit(request: Request) -> None:
    await _check_rate_limit(
        f"rate-limit:admin-login:{_client_ip(request)}",
        ADMIN_LOGIN_MAX_ATTEMPTS,
        "Too many login attempts. Please try again shortly.",
    )


async def enforce_order_create_rate_limit(request: Request) -> None:
    await _check_rate_limit(
        f"rate-limit:order-create:{_client_ip(request)}",
        ORDER_CREATE_MAX_ATTEMPTS,
        "Too many orders from this device. Please try again shortly.",
    )
