from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.seats import SeatSchema


class HallSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    number: int
    price_standard: int
    price_vip: int
    is_active: bool # открытие/приостановка продажи билетов

class HallAddSchema(BaseModel):
    rows: int = Field(gt=0, le=50) # greater than 0 (строго больше нуля) рядов
    cols: int = Field(gt=0, le=50) # less or equal 50 (меньше или равно 50) мест в ряду


class HallWithSeatsSchema(HallSchema):
    seats: list[SeatSchema] = []

class HallPricesUpdateSchema(BaseModel):
    price_standard: int = Field(ge=0, le=100_000)
    price_vip: int = Field(ge=0, le=100_000)