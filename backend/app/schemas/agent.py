from typing import Literal

from pydantic import BaseModel

OrderStatus = Literal["new", "received", "preparing", "ready", "cancelled"]


class AgentStatusResponse(BaseModel):
    status: str
    orders_open: bool
    pending_orders_count: int


class AgentOrderListItem(BaseModel):
    id: str
    order_number: int
    guest_name: str
    status: OrderStatus
    status_label: str
    items_count: int
    created_at: str


class AgentOrderStatusUpdate(BaseModel):
    status: OrderStatus


class AgentOrderStatusResponse(BaseModel):
    id: str
    order_number: int
    status: OrderStatus
    status_label: str
