from datetime import date, datetime, time, timezone, timedelta
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.screenings import ScreeningORM

MSK = timezone(timedelta(hours=3))

class ScreeningRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_date(self, target: date) -> list[ScreeningORM]:
        # границы дня в МСК, потом в UTC
        start_msk = datetime.combine(target, time.min, tzinfo=MSK)
        end_msk = datetime.combine(target, time.max, tzinfo=MSK)
        start = start_msk.astimezone(timezone.utc)
        end = end_msk.astimezone(timezone.utc)

        return list(
            self.db.scalars(
                select(ScreeningORM)
                .where(ScreeningORM.datetime_start.between(start, end))
                .order_by(ScreeningORM.datetime_start)
            ).all()
        )

    def get_by_hall_and_date(self, hall_id: UUID, target: date) -> list[ScreeningORM]:
        start_msk = datetime.combine(target, time.min, tzinfo=MSK)
        end_msk = datetime.combine(target, time.max, tzinfo=MSK)
        start = start_msk.astimezone(timezone.utc)
        end = end_msk.astimezone(timezone.utc)
        return list(
            self.db.scalars(
                select(ScreeningORM)
                .where(
                    ScreeningORM.hall_id == hall_id,
                    ScreeningORM.datetime_start.between(start, end),
                )
                .order_by(ScreeningORM.datetime_start)
            ).all()
        )

    def get_by_id(self, screening_id: UUID) -> ScreeningORM | None:
        return self.db.get(ScreeningORM, screening_id)  # type: ignore[return-value]

    def create_many(self, screenings: list[ScreeningORM]) -> None:
        self.db.add_all(screenings)
        self.db.flush()

    def delete_many(self, ids: list[UUID]) -> None:
        self.db.query(ScreeningORM).filter(ScreeningORM.id.in_(ids)).delete(
            synchronize_session=False
        )