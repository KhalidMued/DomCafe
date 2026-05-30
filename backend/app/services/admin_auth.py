from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, verify_password
from app.models.user import AdminUser


async def authenticate_admin(
    session: AsyncSession, username: str, password: str
) -> dict[str, str] | None:
    result = await session.execute(
        select(AdminUser).where(AdminUser.username == username, AdminUser.is_active.is_(True))
    )
    admin = result.scalar_one_or_none()
    if admin is None or not verify_password(password, admin.password_hash):
        return None
    return {"access_token": create_access_token(str(admin.id)), "token_type": "bearer"}
