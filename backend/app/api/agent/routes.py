import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_session
from app.schemas.agent import (
    AgentAvailabilityResponse,
    AgentAvailabilityUpdate,
    AgentMenuBean,
    AgentMenuDrink,
    AgentMenuResponse,
    AgentOrderListItem,
    AgentOrderStatusResponse,
    AgentOrderStatusUpdate,
    AgentStatusResponse,
)
from app.services.admin_menu import set_bean_availability, set_drink_availability
from app.services.admin_orders import update_order_status
from app.services.agent import (
    get_agent_menu,
    get_agent_status,
    list_agent_beans,
    list_pending_orders,
    search_agent_beans,
    search_agent_drinks,
)

router = APIRouter(tags=["agent"])
_agent_bearer = HTTPBearer(auto_error=False)


def get_agent_api_key() -> str:
    return get_settings().agent_api_key


async def require_agent(
    credentials: HTTPAuthorizationCredentials | None = Depends(_agent_bearer),
) -> None:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Agent API key required.")
    expected_key = get_agent_api_key()
    if not expected_key or not secrets.compare_digest(credentials.credentials, expected_key):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid agent API key.")


@router.get("/agent/status", response_model=AgentStatusResponse)
async def agent_status(
    _agent: None = Depends(require_agent),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await get_agent_status(session)


@router.get("/agent/orders/pending", response_model=list[AgentOrderListItem])
async def agent_pending_orders(
    _agent: None = Depends(require_agent),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, object]]:
    return await list_pending_orders(session)


@router.get("/agent/menu", response_model=AgentMenuResponse)
async def agent_menu(
    _agent: None = Depends(require_agent),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await get_agent_menu(session)


@router.get("/agent/drinks/search", response_model=list[AgentMenuDrink])
async def agent_drink_search(
    q: str = Query(min_length=1, max_length=80),
    _agent: None = Depends(require_agent),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, object]]:
    return await search_agent_drinks(session, q)


@router.patch("/agent/drinks/{drink_id}/availability", response_model=AgentAvailabilityResponse)
async def agent_update_drink_availability(
    drink_id: str,
    payload: AgentAvailabilityUpdate,
    _agent: None = Depends(require_agent),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await set_drink_availability(session, drink_id, payload.is_available)


@router.get("/agent/beans", response_model=list[AgentMenuBean])
async def agent_beans(
    _agent: None = Depends(require_agent),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, object]]:
    return await list_agent_beans(session)


@router.get("/agent/beans/search", response_model=list[AgentMenuBean])
async def agent_bean_search(
    q: str = Query(min_length=1, max_length=80),
    _agent: None = Depends(require_agent),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, object]]:
    return await search_agent_beans(session, q)


@router.patch("/agent/beans/{bean_id}/availability", response_model=AgentAvailabilityResponse)
async def agent_update_bean_availability(
    bean_id: str,
    payload: AgentAvailabilityUpdate,
    _agent: None = Depends(require_agent),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await set_bean_availability(session, bean_id, payload.is_available)


@router.patch("/agent/orders/{order_id}/status", response_model=AgentOrderStatusResponse)
async def agent_update_order_status(
    order_id: int,
    payload: AgentOrderStatusUpdate,
    _agent: None = Depends(require_agent),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await update_order_status(session, order_id, payload.status)
