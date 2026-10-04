from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

# базовая схема (чтобы не дублировать поля в схемах-наследниках)
class ScreeningBase(BaseModel):
    movie_id: UUID
    hall_id: UUID
    datetime_start: datetime

# что ожидаем в запросе от пользователя (Что клиент присылает?)
class ScreeningAddSchema(ScreeningBase):
    id: UUID | None = None

# что ожидаем в ответе (Что сервер отдаёт?)
class ScreeningResponseSchema(ScreeningBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    datetime_end: datetime      # вычисляется на сервере
    hall_number: int