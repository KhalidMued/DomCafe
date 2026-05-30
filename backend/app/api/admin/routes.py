from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.admin import (
    AdminLoginRequest,
    AdminOrderStatusResponse,
    AdminOrderStatusUpdate,
    AdminTokenResponse,
)
from app.services.admin_auth import authenticate_admin, get_active_admin_id
from app.services.admin_orders import update_order_status

router = APIRouter(tags=["admin"])
bearer_scheme = HTTPBearer(auto_error=False)


@router.post("/admin/login", response_model=AdminTokenResponse)
async def login(
    payload: AdminLoginRequest,
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    token = await authenticate_admin(session, payload.username, payload.password)
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )
    return token


async def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> str:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin login required.")
    admin_id = await get_active_admin_id(session, credentials.credentials)
    if admin_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin login required.")
    return admin_id


async def _current_admin_dependency(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> str:
    try:
        return await require_admin(credentials, session)
    except TypeError:
        return await require_admin()


@router.patch("/admin/orders/{order_id}/status", response_model=AdminOrderStatusResponse)
async def update_admin_order_status(
    order_id: int,
    payload: AdminOrderStatusUpdate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await update_order_status(session, order_id, payload.status)
