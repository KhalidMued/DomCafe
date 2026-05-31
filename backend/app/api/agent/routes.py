import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_session
from app.schemas.agent import (
    AgentOrderListItem,
    AgentOrderStatusResponse,
    AgentOrderStatusUpdate,
    AgentStatusResponse,
)
from app.services.admin_orders import update_order_status
from app.services.agent import get_agent_status, list_pending_orders

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


@router.patch("/agent/orders/{order_id}/status", response_model=AgentOrderStatusResponse)
async def agent_update_order_status(
    order_id: int,
    payload: AgentOrderStatusUpdate,
    _agent: None = Depends(require_agent),
    session: AsyncSession = Depends(get_session),
) -> dict[str, object]:
    return await update_order_status(session, order_id, payload.status)
