from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.admin import AdminLoginRequest, AdminTokenResponse
from app.services.admin_auth import authenticate_admin

router = APIRouter(tags=["admin"])


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
