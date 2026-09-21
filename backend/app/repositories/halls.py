from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.halls import HallORM


class HallRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_all(self) -> list[HallORM]:
        return list(self.db.scalars(select(HallORM).order_by(HallORM.number)).all())

    def get_by_id(self, hall_id: UUID) -> HallORM | None:
        return self.db.get(HallORM, hall_id) # type: ignore[return-value]

    def create(self) -> HallORM:
        new_hall = HallORM(number=self._next_number())
        self.db.add(new_hall)
        self.db.flush() # ← отправляет INSERT, БД генерирует id
        self.db.refresh(new_hall)  # ← подтягивает сгенерированный id в объект
        return new_hall

    def delete(self, hall: HallORM) -> None:
        self.db.delete(hall)
        self.db.flush()

    def get_by_number(self, number: int) -> HallORM | None:
        return self.db.scalar(
            select(HallORM)
            .options(selectinload(HallORM.seats))
            .where(HallORM.number == number)
        )

    def _next_number(self) -> int:
        existing = set(self.db.scalars(select(HallORM.number)).all())
        number = 1
        while number in existing:
            number += 1
        return number