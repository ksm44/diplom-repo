from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password, hash_password
from app.repositories.users import UserRepository
from app.schemas.users import LoginSchema, TokenSchema, RegisterSchema
from app.models.users import UserRole


class InvalidCredentials(Exception):
    """Неверный логин или пароль"""
class UserAlreadyExists(Exception):
    """Такое имя пользователя уже занято"""


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.user_repo = UserRepository(db)

    def login(self, data: LoginSchema) -> TokenSchema:
        user = self.user_repo.get_by_username(data.username)
        if not user or not verify_password(data.password, user.password_hash):
            raise InvalidCredentials("Неверный логин или пароль")
        token = create_access_token(str(user.id), user.role.value)
        return TokenSchema(access_token=token)

    def register(self, data: RegisterSchema) -> TokenSchema:
        if self.user_repo.get_by_username(data.username):
            raise UserAlreadyExists(f"Имя {data.username} занято, укажите другое")

        user = self.user_repo.create(
            username=data.username,
            password_hash=hash_password(data.password),
            role=UserRole.GUEST,               # ← по дефолту всегда GUEST будет создаваться
        )
        self.db.commit()
        self.db.refresh(user)
        return TokenSchema(access_token=create_access_token(str(user.id), user.role.value))