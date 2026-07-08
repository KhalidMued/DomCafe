import logging
from typing import cast

from fastapi import FastAPI, status
from fastapi.exceptions import RequestValidationError
from starlette.types import ExceptionHandler
from sqlalchemy import text

from app.api.admin.routes import router as admin_router
from app.api.agent.routes import router as agent_router
from app.api.public.routes import router as public_router
from app.core.errors import GuestApiError, guest_api_error_handler, validation_exception_handler
from app.core.request_log import RequestLogMiddleware
from app.db.redis import get_redis
from app.db.session import AsyncSessionLocal

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

app = FastAPI(title="DŌM Home Café OS")
app.add_middleware(RequestLogMiddleware)
app.add_exception_handler(GuestApiError, cast(ExceptionHandler, guest_api_error_handler))
app.add_exception_handler(
    RequestValidationError, cast(ExceptionHandler, validation_exception_handler)
)
app.include_router(admin_router, prefix="/api")
app.include_router(agent_router, prefix="/api")
app.include_router(public_router, prefix="/api")


async def check_database() -> bool:
    async with AsyncSessionLocal() as session:
        await session.execute(text("select 1"))
    return True


async def check_redis() -> bool:
    await get_redis().ping()
    return True


@app.get("/api/health", status_code=status.HTTP_200_OK)
async def health() -> dict[str, str]:
    await check_database()
    await check_redis()
    return {"status": "ok", "database": "ok", "redis": "ok"}
