from datetime import datetime
from uuid import UUID
from sqlalchemy import ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from .seats import SeatORM


class TicketSeatORM(Base):
    """Вспомогательная таблица: какой билет на какие кресла."""
    __tablename__ = "ticket_seats"

    #в одном сеансе не может быть двух одинаковых кресел(мест)
    __table_args__ = (
        UniqueConstraint("screening_id", "seat_id", name="uq_seat_per_screening"),
    )

    ticket_id: Mapped[UUID] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"))
    screening_id: Mapped[UUID] = mapped_column(ForeignKey("screenings.id", ondelete="CASCADE"))
    seat_id: Mapped[UUID] = mapped_column(ForeignKey("seats.id", ondelete="CASCADE"))


class TicketORM(Base):
    __tablename__ = "tickets"

    code: Mapped[str] = mapped_column(unique=True)          # UUID-строка, основа для QR-кода
    screening_id: Mapped[UUID] = mapped_column(ForeignKey("screenings.id", ondelete="CASCADE"))
    total_price: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    ###SQLAlchemy сам поймёт как использовать вспомогательную(промежуточную) таблицу
    seats: Mapped[list["SeatORM"]] = relationship(secondary="ticket_seats")
    qr_code_url: Mapped[str] = mapped_column(default="")  # путь к PNG на бэкенде