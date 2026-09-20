from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.hall import HallService


def get_hall_service(db: Session = Depends(get_db)) -> HallService:
    """Функция для инъекии зависимости HallService"""
    return HallService(db)