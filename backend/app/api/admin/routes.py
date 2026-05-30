from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.admin import (
    AdminAvailabilityResponse,
    AdminAvailabilityUpdate,
    AdminDashboardResponse,
    AdminLoginRequest,
    AdminMenuManagementResponse,
    AdminOrderListItem,
    AdminOrderStatusResponse,
    AdminOrderStatusUpdate,
    AdminOrdersOpenResponse,
    AdminOrdersOpenUpdate,
    AdminTokenResponse,
)
from app.services.admin_auth import authenticate_admin, get_active_admin_id
from app.services.admin_dashboard import get_dashboard_summary
from app.services.admin_menu import (
    get_menu_management_summary,
    set_bean_availability,
    set_drink_availability,
    set_orders_open,
)
from app.services.admin_orders import list_recent_orders, update_order_status

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


@router.get("/admin/dashboard", response_model=AdminDashboardResponse)
async def admin_dashboard(
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, int | bool]:
    return await get_dashboard_summary(session)


@router.get("/admin/orders", response_model=list[AdminOrderListItem])
async def admin_orders(
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, object]]:
    return await list_recent_orders(session)


@router.get("/admin/menu", response_model=AdminMenuManagementResponse)
async def admin_menu(
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await get_menu_management_summary(session)


@router.patch("/admin/menu/drinks/{drink_id}", response_model=AdminAvailabilityResponse)
async def update_admin_drink_availability(
    drink_id: str,
    payload: AdminAvailabilityUpdate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await set_drink_availability(session, drink_id, payload.is_available)


@router.patch("/admin/menu/beans/{bean_id}", response_model=AdminAvailabilityResponse)
async def update_admin_bean_availability(
    bean_id: str,
    payload: AdminAvailabilityUpdate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await set_bean_availability(session, bean_id, payload.is_available)


@router.patch("/admin/menu/settings/orders-open", response_model=AdminOrdersOpenResponse)
async def update_admin_orders_open(
    payload: AdminOrdersOpenUpdate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, bool]:
    return await set_orders_open(session, payload.orders_open)


@router.patch("/admin/orders/{order_id}/status", response_model=AdminOrderStatusResponse)
async def update_admin_order_status(
    order_id: int,
    payload: AdminOrderStatusUpdate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await update_order_status(session, order_id, payload.status)
