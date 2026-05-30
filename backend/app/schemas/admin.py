from typing import Literal

from pydantic import BaseModel, Field

OrderStatus = Literal["new", "received", "preparing", "ready", "cancelled"]


class AdminLoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminOrderStatusUpdate(BaseModel):
    status: OrderStatus


class AdminOrderStatusResponse(BaseModel):
    id: str
    order_number: int
    status: OrderStatus
    status_label: str
