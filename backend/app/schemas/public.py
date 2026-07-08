from pydantic import BaseModel, Field, field_validator


class PublicSettingsResponse(BaseModel):
    cafe_name: str
    welcome_message: str
    orders_open: bool


class PublicBeanResponse(BaseModel):
    id: str
    name: str
    origin: str | None = None
    tasting_notes: list[str] = Field(default_factory=list)


class PublicDrinkResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    ingredients: list[str] = Field(default_factory=list)
    bean: PublicBeanResponse | None = None
    photo_url: str
    available: bool
    temperature_options: list[str] = Field(default_factory=list)
    milk_options: list[str] = Field(default_factory=list)
    estimated_time_minutes: int


class PublicCategoryResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    drinks: list[PublicDrinkResponse] = Field(default_factory=list)


class OrderItemCreate(BaseModel):
    drink_id: str = Field(min_length=1, max_length=80)
    quantity: int = Field(ge=1, le=10)
    temperature: str | None = Field(default=None, max_length=20)
    milk_option: str | None = Field(default=None, max_length=50)
    item_note: str | None = Field(default=None, max_length=200)


class OrderCreate(BaseModel):
    guest_name: str = Field(min_length=1, max_length=50)
    guest_note: str | None = Field(default=None, max_length=300)
    items: list[OrderItemCreate] = Field(min_length=1, max_length=10)

    @field_validator("guest_name", mode="before")
    @classmethod
    def strip_guest_name(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value


class OrderCreateResponse(BaseModel):
    order_id: str
    order_number: int
    status: str
    message: str


class OrderStatusItemResponse(BaseModel):
    drink_name: str
    quantity: int
    temperature: str | None = None
    milk_option: str | None = None
    item_note: str | None = None
    bean_name: str | None = None
    photo_url: str | None = None


class OrderStatusResponse(BaseModel):
    id: str
    order_number: int
    guest_name: str
    status: str
    status_label: str
    items: list[OrderStatusItemResponse]
    created_at: str
