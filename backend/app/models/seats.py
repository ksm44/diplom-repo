import enum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import UniqueConstraint, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

# Устраняем проблему циклического импорта для relationship
# т.к. импорт нужен только для аннотации типов и не потребуется в рантайме
if TYPE_CHECKING:
    from .halls import HallORM

class SeatKind(str, enum.Enum):
    STANDARD = "standard"
    VIP = "vip"

class SeatORM(Base):
    __tablename__ = "seats"

    # в SQL это CONSTRAINT uq_seat_in_hall UNIQUE (hall_id, row, number)
    # т.е. в пределах одного зала не может быть двух кресел с одинаковыми row и number
    __table_args__ = (
        UniqueConstraint("hall_id", "row", "number", name="unique_seat_in_hall"),
    )

    hall_id: Mapped[UUID] = mapped_column(
        ForeignKey("halls.id", ondelete="CASCADE"),
    )

    row: Mapped[int] # ряд
    number: Mapped[int] # место в ряду
    kind: Mapped[SeatKind] = mapped_column( # тип кресла обычное/vip
        Enum(SeatKind, name="seat_kind"),
        default=SeatKind.STANDARD,
    )
    is_blocked: Mapped[bool] = mapped_column(default=False)  # заблокировано Админом
    is_booked: Mapped[bool] = mapped_column(default=False)  # занято Пользователем

    # это Python-объект для удобства (например print(seat.hall.number)  ← получаем зал через relationship)
    hall: Mapped["HallORM"] = relationship(back_populates="seats")