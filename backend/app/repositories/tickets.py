from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tickets import TicketORM, TicketSeatORM


class TicketRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, ticket_id: UUID) -> TicketORM | None:
        return self.db.get(TicketORM, ticket_id)  # type: ignore[return-value]

    def get_by_code(self, code: str) -> TicketORM | None:
        return self.db.scalar(select(TicketORM).where(TicketORM.code == code))

    def get_booked_seat_ids(self, screening_id: UUID) -> set[UUID]:
        """Какие seat_id уже заняты на этом сеансе."""
        rows = self.db.scalars(
            select(TicketSeatORM.seat_id).where(TicketSeatORM.screening_id == screening_id)
        ).all()
        return set(rows)

    def get_by_user(self, user_id: UUID) -> list[TicketORM]:
        return list(self.db.scalars(
            select(TicketORM).where(TicketORM.user_id == user_id).order_by(TicketORM.created_at.desc())
        ).all())

    def create(self, ticket: TicketORM, seat_ids: list[UUID], screening_id: UUID) -> TicketORM:
        self.db.add(ticket)
        self.db.flush()
        for seat_id in seat_ids:
            self.db.add(TicketSeatORM(
                ticket_id=ticket.id,
                screening_id=screening_id,
                seat_id=seat_id,
            ))
        self.db.flush()
        self.db.refresh(ticket)
        return ticket