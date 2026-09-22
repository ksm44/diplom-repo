from uuid import UUID, uuid4
from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.tickets import TicketORM
from app.models.seats import SeatKind
from app.repositories.halls import HallRepository
from app.repositories.movies import MovieRepository
from app.repositories.screenings import ScreeningRepository
from app.repositories.seats import SeatRepository
from app.repositories.tickets import TicketRepository
from app.schemas.tickets import TicketCreateSchema, TicketResponseSchema


class TicketError(Exception):
    """Базовое исключение билета."""

class HallNotFound(TicketError):
    """Зал не найден в БД"""

class ScreeningNotFound(TicketError):
    """Сеанса не найдено в БД"""

class SalesClosed(TicketError):
    """Продажа билетов приостановлена"""

class ScreeningStarted(TicketError):
    """Билеты на начавшийся сеанс не продаются"""

class SeatNotFound(TicketError):
    """Место(кресло) не найдено в БД"""

class SeatUnavailable(TicketError):
    """Место(кресло) недоступно для бронирования"""


class TicketService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.hall_repo = HallRepository(db)
        self.movie_repo = MovieRepository(db)
        self.screening_repo = ScreeningRepository(db)
        self.seat_repo = SeatRepository(db)
        self.ticket_repo = TicketRepository(db)

    def buy(self, data: TicketCreateSchema) -> TicketResponseSchema:
        screening = self.screening_repo.get_by_id(data.screening_id)
        if not screening:
            raise ScreeningNotFound("Сеанс не найден")

        hall = self.hall_repo.get_by_id(screening.hall_id)
        if not hall:
            raise HallNotFound("Зал не найден")

        if not hall.is_active:
            raise SalesClosed("Продажа билетов в этом зале приостановлена")

        if screening.datetime_start <= datetime.now(timezone.utc):
            raise ScreeningStarted("Сеанс уже начался")

        seats = self.seat_repo.get_by_ids(data.seat_ids)
        if len(seats) != len(data.seat_ids):
            raise SeatNotFound("Некоторые кресла не найдены")

        for seat in seats:
            if seat.hall_id != hall.id:
                raise SeatNotFound(f"Кресло {seat.id} не в зале {hall.number}")
            if seat.is_blocked:
                raise SeatUnavailable(f"Кресло {seat.row}-{seat.number} заблокировано")

        booked = self.ticket_repo.get_booked_seat_ids(screening.id)
        for seat in seats:
            if seat.id in booked:
                raise SeatUnavailable(f"Кресло {seat.row}-{seat.number} уже занято")

        total = sum(
            hall.price_vip if s.kind == SeatKind.VIP else hall.price_standard
            for s in seats
        )

        ticket = TicketORM(
            code=str(uuid4()),
            screening_id=screening.id,
            total_price=total,
        )
        ticket = self.ticket_repo.create(ticket, [s.id for s in seats], screening.id)
        self.db.commit()
        self.db.refresh(ticket)
        return TicketResponseSchema.model_validate(ticket)