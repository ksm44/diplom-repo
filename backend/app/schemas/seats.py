from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.models.seats import SeatKind

class SeatSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    row: int
    number: int
    kind: SeatKind
    is_blocked: bool

class SeatItemSchema(BaseModel):
    row: int
    number: int
    kind: SeatKind = SeatKind.STANDARD
    is_blocked: bool = False


class SeatsBulkUpdateSchema(BaseModel):
    """Для тела PATCH /halls/{number}/seats — всё, что админ накликал."""
    rows: int = Field(gt=0, le=50)
    cols: int = Field(gt=0, le=50)
    seats: list[SeatItemSchema] = []  # только VIP/заблокированные

class SeatStateSchema(SeatSchema):
    is_taken: bool