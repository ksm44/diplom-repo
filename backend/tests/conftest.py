from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.models.users import UserORM, UserRole
from app.core.security import hash_password


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def admin_token(client):
    # создаём админа, если нет
    db = SessionLocal()
    if not db.query(UserORM).filter_by(username="test_admin").first():
        db.add(UserORM(
            username="test_admin",
            password_hash=hash_password("test1234"),
            role=UserRole.ADMINISTRATOR,
        ))
        db.commit()
    db.close()

    r = client.post("/auth/login", json={"username": "test_admin", "password": "test1234"})
    return r.json()["access_token"]

@pytest.fixture(scope="session")
def guest_token(client):
    """Регистрирует гостя и возвращает его токен."""
    username = f"guest_{uuid4()}"
    r = client.post("/auth/register", json={
        "username": username,
        "password": "guest1234",
    })
    return r.json()["access_token"]