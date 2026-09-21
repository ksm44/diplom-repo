from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class MovieORM(Base):
    __tablename__ = "movies"
    title: Mapped[str] = mapped_column(unique=True)
    description: Mapped[str]
    duration: Mapped[int]          # продолжительность в минутах
    origin: Mapped[str]            # страна(страны)
    poster_url: Mapped[str | None] = mapped_column(default=None) # ссылка на изображение(постер)