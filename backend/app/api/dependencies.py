from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.hall import HallService
from app.services.movie import MovieService
from app.services.screening import ScreeningService
from app.services.ticket import TicketService

def get_hall_service(db: Session = Depends(get_db)) -> HallService:
    """Функция для инъекии зависимости HallService"""
    return HallService(db)

def get_movie_service(db: Session = Depends(get_db)) -> MovieService:
    """Функция для инъекии зависимости MovieService"""
    return MovieService(db)

def get_screening_service(db: Session = Depends(get_db)) -> ScreeningService:
    """Функция для инъекии зависимости ScreeningService"""
    return ScreeningService(db)

def get_ticket_service(db: Session = Depends(get_db)) -> TicketService:
    """Функция для инъекии зависимости TicketService"""
    return TicketService(db)