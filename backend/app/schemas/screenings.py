from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.halls import HallSchema
from app.schemas.movies import MovieResponseSchema
from app.schemas.seats import SeatStateSchema

# базовая схема (чтобы не дублировать поля в схемах-наследниках)
class ScreeningBase(BaseModel):
    movie_id: UUID
    hall_id: UUID
    datetime_start: datetime

    #явно убираем time_Zone
    @field_validator("datetime_start")
    @classmethod
    def strip_tz(cls, v: datetime) -> datetime:
        return v.replace(tzinfo=None)

# что ожидаем в запросе от пользователя (Что клиент присылает?)
class ScreeningAddSchema(ScreeningBase):
    id: UUID | None = None

# что ожидаем в ответе (Что сервер отдаёт?)
class ScreeningResponseSchema(ScreeningBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    datetime_end: datetime      # вычисляется на сервере
    hall_number: int
    is_active: bool

#для запроса информации по id сеанса
class ScreeningDetailSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    datetime_start: datetime
    datetime_end: datetime
    movie: MovieResponseSchema
    hall: HallSchema
    seats: list[SeatStateSchema]