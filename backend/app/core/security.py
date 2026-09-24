from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

secret_key = os.getenv("SECRET_KEY", "change-me")
algorithm = os.getenv("ALGORITHM", "HS256")
access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


def hash_password(password: str) -> str:
    # bcrypt возвращает bytes — преобразуем в str для хранения в БД
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=access_token_expire_minutes),
    }
    return jwt.encode(payload, secret_key, algorithm=algorithm)

def decode_token(token: str) -> dict:
    return jwt.decode(token, secret_key, algorithms=[algorithm])