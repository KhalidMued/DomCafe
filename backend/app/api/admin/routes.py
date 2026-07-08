from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.admin import (
    AdminAvailabilityResponse,
    AdminAvailabilityUpdate,
    AdminBeanCreate,
    AdminBeanUpdate,
    AdminCategoryCreate,
    AdminCategoryUpdate,
    AdminDashboardResponse,
    AdminDrinkCreate,
    AdminDrinkPhotoResponse,
    AdminDrinkUpdate,
    AdminLoginRequest,
    AdminMenuBean,
    AdminMenuCategory,
    AdminMenuDrink,
    AdminMenuManagementResponse,
    AdminOrderListItem,
    AdminOrderStatusResponse,
    AdminOrderStatusUpdate,
    AdminOrdersOpenResponse,
    AdminOrdersOpenUpdate,
    AdminSettingsResponse,
    AdminSettingsUpdate,
    AdminTokenResponse,
)
from app.services.admin_auth import authenticate_admin, get_active_admin_id
from app.services.admin_dashboard import get_dashboard_summary
from app.services.admin_menu import (
    archive_bean,
    archive_category,
    archive_drink,
    create_bean,
    create_category,
    create_drink,
    get_admin_settings,
    get_menu_management_summary,
    set_bean_availability,
    set_category_availability,
    set_drink_availability,
    set_orders_open,
    update_admin_settings,
    update_bean_details,
    update_category_details,
    update_drink_details,
)
from app.security.rate_limit import enforce_admin_login_rate_limit
from app.services.admin_orders import list_recent_orders, update_order_status
from app.services.admin_uploads import upload_drink_photo

router = APIRouter(tags=["admin"])
bearer_scheme = HTTPBearer(auto_error=False)


@router.post("/admin/login", response_model=AdminTokenResponse)
async def login(
    payload: AdminLoginRequest,
    _rate_limit: None = Depends(enforce_admin_login_rate_limit),
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
    # Test seam, not dead code: tests monkeypatch `require_admin` on this
    # module, so it must be resolved at call time (a direct
    # Depends(require_admin) captures the original function at import). The
    # TypeError fallback lets tests substitute zero-argument fakes.
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


@router.patch("/admin/menu/categories/{category_id}", response_model=AdminAvailabilityResponse)
async def update_admin_category_availability(
    category_id: str,
    payload: AdminAvailabilityUpdate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await set_category_availability(session, category_id, payload.is_available)


@router.patch("/admin/menu/settings/orders-open", response_model=AdminOrdersOpenResponse)
async def update_admin_orders_open(
    payload: AdminOrdersOpenUpdate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, bool]:
    return await set_orders_open(session, payload.orders_open)


@router.get("/admin/settings", response_model=AdminSettingsResponse)
async def admin_settings(
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await get_admin_settings(session)


@router.patch("/admin/settings", response_model=AdminSettingsResponse)
async def patch_admin_settings(
    payload: AdminSettingsUpdate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await update_admin_settings(session, payload)


@router.post("/admin/uploads/drink-photo", response_model=AdminDrinkPhotoResponse)
async def upload_admin_drink_photo(
    drink_id: str = Form(...),
    photo: UploadFile = File(...),
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    return await upload_drink_photo(session, drink_id, photo)


@router.post("/admin/categories", response_model=AdminMenuCategory, status_code=status.HTTP_201_CREATED)
async def create_admin_category(
    payload: AdminCategoryCreate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await create_category(session, payload)


@router.post("/admin/beans", response_model=AdminMenuBean, status_code=status.HTTP_201_CREATED)
async def create_admin_bean(
    payload: AdminBeanCreate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await create_bean(session, payload)


@router.post("/admin/drinks", response_model=AdminMenuDrink, status_code=status.HTTP_201_CREATED)
async def create_admin_drink(
    payload: AdminDrinkCreate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await create_drink(session, payload)


@router.delete("/admin/drinks/{drink_id}", response_model=AdminMenuDrink)
async def archive_admin_drink(
    drink_id: str,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await archive_drink(session, drink_id)


@router.delete("/admin/beans/{bean_id}", response_model=AdminMenuBean)
async def archive_admin_bean(
    bean_id: str,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await archive_bean(session, bean_id)


@router.delete("/admin/categories/{category_id}", response_model=AdminMenuCategory)
async def archive_admin_category(
    category_id: str,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await archive_category(session, category_id)


@router.patch("/admin/drinks/{drink_id}", response_model=AdminMenuDrink)
async def update_admin_drink_details(
    drink_id: str,
    payload: AdminDrinkUpdate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await update_drink_details(session, drink_id, payload)


@router.patch("/admin/beans/{bean_id}", response_model=AdminMenuBean)
async def update_admin_bean_details(
    bean_id: str,
    payload: AdminBeanUpdate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await update_bean_details(session, bean_id, payload)


@router.patch("/admin/categories/{category_id}", response_model=AdminMenuCategory)
async def update_admin_category_details(
    category_id: str,
    payload: AdminCategoryUpdate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await update_category_details(session, category_id, payload)


@router.patch("/admin/orders/{order_id}/status", response_model=AdminOrderStatusResponse)
async def update_admin_order_status(
    order_id: int,
    payload: AdminOrderStatusUpdate,
    _admin_id: str = Depends(_current_admin_dependency),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await update_order_status(session, order_id, payload.status)
