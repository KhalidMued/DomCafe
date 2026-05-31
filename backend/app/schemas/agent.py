from typing import Literal

from pydantic import BaseModel, Field

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


class AgentAvailabilityUpdate(BaseModel):
    is_available: bool


class AgentOrderStatusResponse(BaseModel):
    id: str
    order_number: int
    status: OrderStatus
    status_label: str


class AgentAvailabilityResponse(BaseModel):
    id: str
    is_available: bool


class AgentMenuCategory(BaseModel):
    id: str
    label: str
    description: str | None = None
    is_available: bool


class AgentMenuBean(BaseModel):
    id: str
    name: str
    origin: str | None = None
    process: str | None = None
    tasting_notes: list[str] = Field(default_factory=list)
    is_available: bool


class AgentMenuDrink(BaseModel):
    id: str
    name: str
    category_id: str
    category_name: str
    bean_id: str | None = None
    bean_name: str | None = None
    description: str | None = None
    ingredients: list[str] = Field(default_factory=list)
    photo_url: str
    is_available: bool
    temperature_options: list[str] = Field(default_factory=list)
    milk_options: list[str] = Field(default_factory=list)
    estimated_time_minutes: int


class AgentMenuResponse(BaseModel):
    categories: list[AgentMenuCategory]
    drinks: list[AgentMenuDrink]
    beans: list[AgentMenuBean]
