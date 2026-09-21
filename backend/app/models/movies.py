from sqlalchemy import CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class MovieORM(Base):
    __tablename__ = "movies"

    #неформальное условие: продолжительность фильма <= макс. длит. сеанса <= минут в сутках
    # т.е. фильм/сеанс не может начаться в одном дне недели, а закончиться в другом дне недели
    __table_args__ = (
        CheckConstraint("duration > 0 AND duration <= 1440", name="ck_movie_duration"),
    )

    title: Mapped[str] = mapped_column(unique=True)
    description: Mapped[str]
    duration: Mapped[int]          # продолжительность в минутах от 0 до 1440 (сутки)
    countries: Mapped[str]            # страна(страны)
    poster_url: Mapped[str | None] = mapped_column(default=None)    # ссылка на изображение(постер)