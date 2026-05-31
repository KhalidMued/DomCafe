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


class AdminDrinkUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=600)
    temperature_options: list[str] | None = None
    milk_options: list[str] | None = None
    estimated_time_minutes: int | None = Field(default=None, ge=1, le=30)


class AdminBeanUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    origin: str | None = Field(default=None, max_length=160)
    process: str | None = Field(default=None, max_length=120)
    tasting_notes: list[str] | None = None


class AdminSettingsUpdate(BaseModel):
    cafe_name: str | None = Field(default=None, min_length=1, max_length=120)
    welcome_message: str | None = Field(default=None, min_length=1, max_length=300)
    orders_open: bool | None = None


class AdminSettingsResponse(BaseModel):
    cafe_name: str
    welcome_message: str
    orders_open: bool


class AdminMenuDrink(BaseModel):
    id: str
    name: str
    category_name: str
    bean_name: str | None
    description: str | None
    photo_url: str
    is_available: bool
    temperature_options: list[str]
    milk_options: list[str]
    estimated_time_minutes: int


class AdminMenuBean(BaseModel):
    id: str
    name: str
    origin: str | None
    process: str | None
    tasting_notes: list[str]
    is_available: bool


class AdminMenuManagementResponse(BaseModel):
    orders_open: bool
    drinks: list[AdminMenuDrink]
    beans: list[AdminMenuBean]
