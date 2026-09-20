from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.seats import SeatORM


class SeatRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, seat_id: UUID) -> SeatORM | None:
        return self.db.get(SeatORM, seat_id) # type: ignore[return-value]

    def get_by_hall(self, hall_id: UUID) -> list[SeatORM]:
        return list(
            self.db.scalars(
                select(SeatORM)
                .where(SeatORM.hall_id == hall_id)
                .order_by(SeatORM.row, SeatORM.number)
            ).all()
        )

    def create_many(self, seats: list[SeatORM]) -> None:
        self.db.add_all(seats)
        self.db.flush()

    def get_by_ids(self, seat_ids: list[UUID]) -> list[SeatORM]:
        """Один SELECT ... WHERE id IN (...) вместо N запросов."""
        return list(self.db.scalars(select(SeatORM).where(SeatORM.id.in_(seat_ids))).all())