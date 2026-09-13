from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import burn_password_check, create_access_token, verify_password
from app.models.user import AdminUser
from app.services.admin_sessions import active_admin_subject, register_admin_session


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
    token = create_access_token(str(admin.id))
    await register_admin_session(token)
    return {"access_token": token, "token_type": "bearer"}


async def get_active_admin_id(session: AsyncSession, token: str) -> str | None:
    subject = await active_admin_subject(token)
    if subject is None or not subject.isdigit():
        return None
    admin = await session.get(AdminUser, int(subject))
    if admin is None or not admin.is_active:
        return None
    return str(admin.id)
