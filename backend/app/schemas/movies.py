from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


# базовая схема (чтобы не дублировать поля в схемах-наследниках)
class MovieBase(BaseModel):
    title: str
    description: str
    duration: int = Field(gt=0, le=600)
    origin: str
    poster_url: str | None = None


# что ожидаем в запросе от пользователя (Что клиент присылает?)
class MovieAddSchema(MovieBase):
    pass

# что ожидаем в ответе (Что сервер отдаёт?)
class MovieResponseSchema(MovieBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID