from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.models.users import UserRole, UserORM
from app.db.session import get_db
from app.services.hall import HallService
from app.services.movie import MovieService
from app.services.screening import ScreeningService
from app.services.ticket import TicketService
from app.repositories.users import UserRepository
from app.services.auth import AuthService

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> UserORM:
    if creds is None:
        raise HTTPException(401, "Требуется авторизация")
    try:
        payload = decode_token(creds.credentials)
    except Exception:
        raise HTTPException(401, "Невалидный токен")

    user = UserRepository(db).get_by_id(UUID(payload["sub"]))
    if not user:
        raise HTTPException(401, "Пользователь не найден")
    return user


def require_admin(user: UserORM = Depends(get_current_user)) -> UserORM:
    if user.role != UserRole.ADMINISTRATOR:
        raise HTTPException(403, "Доступ только для администратора")
    return user


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)



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