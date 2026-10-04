from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.halls import HallRepository
from app.schemas.halls import HallSchema, HallWithSeatsSchema, HallAddSchema, HallPricesUpdateSchema
from app.models.seats import SeatORM, SeatKind
from app.repositories.seats import SeatRepository
from app.schemas.seats import SeatsBulkUpdateSchema


class HallNotFound(Exception):
    """Зал не найден в БД"""
class SeatNotFound(Exception):
    """Место(кресло) не найдено в БД"""
class HallHasTickets(Exception):
    """В зале есть проданные билеты — схему зала менять нельзя!"""


class HallService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.hall_repository = HallRepository(db)
        self.seat_repository = SeatRepository(db)

    def list_halls(self) -> list[HallSchema]:
        halls_orm = self.hall_repository.get_all()
        return [HallSchema.model_validate(hall) for hall in halls_orm]

    def get_hall_with_seats(self, number: int) -> HallWithSeatsSchema:
        hall = self.hall_repository.get_by_number(number)
        if not hall:
            raise HallNotFound(f"Зал с номером {number} не найден")

        seats = hall.seats
        rows = max((s.row for s in seats), default=0)
        cols = max((s.number for s in seats), default=0)

        schema = HallWithSeatsSchema.model_validate(hall)
        schema.rows = rows
        schema.cols = cols
        return schema

    def create_hall(self, hall_add: HallAddSchema) -> HallSchema:
        hall = self.hall_repository.create(rows=hall_add.rows, cols=hall_add.cols)
        self.db.flush()

        seats = [
            SeatORM(hall_id=hall.id, row=r, number=n)
            for r in range(1, hall_add.rows + 1)
            for n in range(1, hall_add.cols + 1)
        ]
        self.seat_repository.create_many(seats)

        self.db.commit()
        self.db.refresh(hall)
        return HallSchema.model_validate(hall)

    def bulk_update_seats(self, number: int, data: SeatsBulkUpdateSchema) -> HallWithSeatsSchema:
        hall = self.hall_repository.get_by_number(number)
        if not hall:
            raise HallNotFound(f"Зал {number} не найден")

        if self._hall_has_tickets(hall.id):
            raise HallHasTickets("Нельзя менять схему зала с проданными билетами")

        # удаляем старые кресла
        self.seat_repository.delete_by_hall(hall.id)

        # обновляем размеры
        hall.rows = data.rows
        hall.cols = data.cols

        # генерируем новые кресла с оверрайдами
        overrides = {(s.row, s.number): s for s in data.seats}
        seats = []
        for r in range(1, data.rows + 1):
            for n in range(1, data.cols + 1):
                o = overrides.get((r, n))
                seats.append(SeatORM(
                    hall_id=hall.id,
                    row=r,
                    number=n,
                    kind=o.kind if o else SeatKind.STANDARD,
                    is_blocked=o.is_blocked if o else False,
                ))
        self.seat_repository.create_many(seats)

        self.db.commit()
        self.db.refresh(hall)
        return HallWithSeatsSchema.model_validate(hall)

    def _hall_has_tickets(self, hall_id: UUID) -> bool:
        from app.models.tickets import TicketSeatORM
        return self.db.scalar(
            select(TicketSeatORM.seat_id)
            .join(SeatORM, SeatORM.id == TicketSeatORM.seat_id)
            .where(SeatORM.hall_id == hall_id)
            .limit(1)
        ) is not None

    def update_prices(self, number: int, data: HallPricesUpdateSchema) -> HallSchema:
        hall = self.hall_repository.get_by_number(number)
        if not hall:
            raise HallNotFound(f"Зал {number} не найден")
        hall.price_standard = data.price_standard
        hall.price_vip = data.price_vip
        self.db.commit()
        self.db.refresh(hall)
        return HallSchema.model_validate(hall)

    def toggle_active(self, number: int) -> HallSchema:
        hall = self.hall_repository.get_by_number(number)
        if not hall:
            raise HallNotFound(f"Зал {number} не найден")
        hall.is_active = not hall.is_active
        self.db.commit()
        self.db.refresh(hall)
        return HallSchema.model_validate(hall)

    def delete_hall(self, number: int) -> None:
        hall_for_delete = self.hall_repository.get_by_number(number)
        if not hall_for_delete:
            raise HallNotFound(f"Зал с номером {number} не найден")
        self.hall_repository.delete(hall_for_delete)
        self.db.commit()

