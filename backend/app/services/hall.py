from sqlalchemy.orm import Session

from app.repositories.halls import HallRepository
from app.schemas.halls import HallSchema, HallAddSchema

class HallNotFound(Exception):
    """Зал не найден в БД"""


class HallService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.hall_repository = HallRepository(db)

    def list_halls(self) -> list[HallSchema]:
        halls_orm = self.hall_repository.get_all()
        return [HallSchema.model_validate(hall) for hall in halls_orm]

    def create_hall(self) -> HallSchema:
        hall_orm = self.hall_repository.create()
        self.db.commit()
        return HallSchema.model_validate(hall_orm)

    def delete_hall(self, number: int) -> None:
        hall_for_delete = self.hall_repository.get_by_number(number)
        if not hall_for_delete:
            raise HallNotFound(f"Зал с номером {number} не найден")
        self.hall_repository.delete(hall_for_delete)
        self.db.commit()

