from sqlalchemy.orm import Session

from app.repositories.halls import HallRepository
from app.schemas.halls import HallSchema, HallWithSeatsSchema, HallAddSchema
from app.models.seats import SeatORM
from app.repositories.seats import SeatRepository
from app.schemas.seats import SeatsBulkUpdateSchema


class HallNotFound(Exception):
    """Зал не найден в БД"""
class SeatNotFound(Exception):
    """Место(кресло) не найдено в БД"""

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
        return HallWithSeatsSchema.model_validate(hall)

    def create_hall(self, hall_add: HallAddSchema) -> HallSchema:
        hall = self.hall_repository.create()
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

        # один запрос за всеми креслами по списку id
        ids = [item.id for item in data.seats]
        seats = {s.id: s for s in self.seat_repository.get_by_ids(ids)}

        # применяем изменения
        for item in data.seats:
            seat = seats.get(item.id)
            if seat is None or seat.hall_id != hall.id:
                raise SeatNotFound(f"Кресло {item.id} не в зале {number}")
            seat.kind = item.kind
            seat.is_blocked = item.is_blocked

        self.db.commit()
        self.db.refresh(hall)
        return HallWithSeatsSchema.model_validate(hall)

    def delete_hall(self, number: int) -> None:
        hall_for_delete = self.hall_repository.get_by_number(number)
        if not hall_for_delete:
            raise HallNotFound(f"Зал с номером {number} не найден")
        self.hall_repository.delete(hall_for_delete)
        self.db.commit()

