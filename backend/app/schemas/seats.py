from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.models.seats import SeatKind

class SeatSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    row: int
    number: int
    kind: SeatKind
    is_blocked: bool
    is_booked: bool

class SeatUpdateItem(BaseModel):
    """Одно кресло в пакетном обновлении."""
    id: UUID
    kind: SeatKind
    is_blocked: bool

class SeatsBulkUpdateSchema(BaseModel):
    """Тело PATCH /halls/{number}/seats — всё, что админ накликал."""
    seats: list[SeatUpdateItem]