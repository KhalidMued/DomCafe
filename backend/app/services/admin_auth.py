from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import burn_password_check, create_access_token, decode_admin_subject, verify_password
from app.models.user import AdminUser


async def authenticate_admin(
    session: AsyncSession, username: str, password: str
) -> dict[str, str] | None:
    result = await session.execute(
        select(AdminUser).where(AdminUser.username == username, AdminUser.is_active.is_(True))
    )
    admin = result.scalar_one_or_none()
    if admin is None:
        burn_password_check(password)
        return None
    if not verify_password(password, admin.password_hash):
        return None
    return {"access_token": create_access_token(str(admin.id)), "token_type": "bearer"}


async def get_active_admin_id(session: AsyncSession, token: str) -> str | None:
    subject = decode_admin_subject(token)
    if subject is None or not subject.isdigit():
        return None
    admin = await session.get(AdminUser, int(subject))
    if admin is None or not admin.is_active:
        return None
    return str(admin.id)
