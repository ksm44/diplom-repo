from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

# Устраняем проблему циклического импорта для relationship
# т.к. импорт нужен только для аннотации типов и не потребуется в рантайме
if TYPE_CHECKING:
    from .seats import SeatORM
    from .screenings import ScreeningORM

class HallORM(Base):
    __tablename__ = "halls"
    number: Mapped[int] = mapped_column(unique=True)

    price_standard: Mapped[int] = mapped_column(default=300)
    price_vip: Mapped[int] = mapped_column(default=600)
    is_active: Mapped[bool] = mapped_column(default=False) # открытие/приостановка продажи билетов

    seats: Mapped[list["SeatORM"]] = relationship(
        back_populates="hall",
        cascade="all, delete-orphan", # Кресла, отвязанные от Зала, удалятся (orphan - с англ. сирота)
    )

    screenings: Mapped[list["ScreeningORM"]] = relationship(
        back_populates="hall",
        cascade="all, delete-orphan", # Сеансы, отвязанные от Зала, удалятся
    )