from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.users import UserORM


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: UUID) -> UserORM | None:
        return self.db.get(UserORM, user_id)  # type: ignore[return-value]

    def get_by_username(self, username: str) -> UserORM | None:
        return self.db.scalar(select(UserORM).where(UserORM.username == username))

    def create(self, username: str, password_hash: str, role) -> UserORM:
        user = UserORM(username=username, password_hash=password_hash, role=role)
        self.db.add(user)
        self.db.flush()
        self.db.refresh(user)
        return user