from typing import Literal

from pydantic import BaseModel, Field

OrderStatus = Literal["new", "received", "preparing", "ready", "cancelled"]


class AdminLoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminDashboardResponse(BaseModel):
    new_orders_count: int
    preparing_orders_count: int
    ready_orders_count: int
    orders_open: bool
    available_drinks_count: int
    available_beans_count: int


class AdminOrderListItem(BaseModel):
    id: str
    order_number: int
    guest_name: str
    status: OrderStatus
    status_label: str
    items_count: int
    created_at: str


class AdminOrderStatusUpdate(BaseModel):
    status: OrderStatus


class AdminOrderStatusResponse(BaseModel):
    id: str
    order_number: int
    status: OrderStatus
    status_label: str


class AdminAvailabilityUpdate(BaseModel):
    is_available: bool


class AdminAvailabilityResponse(BaseModel):
    id: str
    is_available: bool


class AdminOrdersOpenUpdate(BaseModel):
    orders_open: bool


class AdminOrdersOpenResponse(BaseModel):
    orders_open: bool


class AdminDrinkPhotoResponse(BaseModel):
    id: str
    photo_url: str


class AdminMenuDrink(BaseModel):
    id: str
    name: str
    category_name: str
    bean_name: str | None
    photo_url: str
    is_available: bool


class AdminMenuBean(BaseModel):
    id: str
    name: str
    origin: str | None
    is_available: bool


class AdminMenuManagementResponse(BaseModel):
    orders_open: bool
    drinks: list[AdminMenuDrink]
    beans: list[AdminMenuBean]
