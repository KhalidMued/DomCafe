from functools import lru_cache

from redis.asyncio import Redis

from app.core.config import get_settings


@lru_cache
def get_redis() -> Redis:
    """Shared client backed by a connection pool; callers must not close it."""
    return Redis.from_url(get_settings().redis_url, decode_responses=True)
