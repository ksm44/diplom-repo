from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from app.schemas.seats import SeatSchema


class TicketCreateSchema(BaseModel):
    screening_id: UUID
    seat_ids: list[UUID]


class TicketResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    code: str
    screening_id: UUID
    total_price: int
    created_at: datetime
    seats: list[SeatSchema]