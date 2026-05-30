from fastapi import FastAPI, status
from sqlalchemy import text

from app.db.redis import get_redis
from app.db.session import AsyncSessionLocal

app = FastAPI(title="DŌM Home Café OS")


async def check_database() -> bool:
    async with AsyncSessionLocal() as session:
        await session.execute(text("select 1"))
    return True


async def check_redis() -> bool:
    redis = get_redis()
    try:
        await redis.ping()
    finally:
        await redis.aclose()
    return True


@app.get("/api/health", status_code=status.HTTP_200_OK)
async def health() -> dict[str, str]:
    await check_database()
    await check_redis()
    return {"status": "ok", "database": "ok", "redis": "ok"}
