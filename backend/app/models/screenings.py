from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID
from sqlalchemy import ForeignKey, CheckConstraint, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.halls import HallORM
    from app.models.movies import MovieORM

# сеанс
class ScreeningORM(Base):
    __tablename__ = "screenings"

    # неформальное условие: фильм/сеанс не может начаться в одном дне недели, а закончиться в другом дне недели
    __table_args__ = (
        CheckConstraint(
            "EXTRACT(HOUR FROM datetime_start) BETWEEN 0 AND 23",
            name="ck_screening_start_within_day",
        ),
    )

    movie_id: Mapped[UUID] = mapped_column(ForeignKey("movies.id", ondelete="CASCADE"))
    hall_id: Mapped[UUID] = mapped_column(ForeignKey("halls.id", ondelete="CASCADE"))
    datetime_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    movie: Mapped["MovieORM"] = relationship()
    hall: Mapped["HallORM"] = relationship(back_populates="screenings")