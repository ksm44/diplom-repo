from dataclasses import dataclass
import os
from dotenv import load_dotenv

load_dotenv()

db_user = os.getenv("POSTGRES_USER")
db_pass = os.getenv("POSTGRES_PASSWORD")
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT")
db_name = os.getenv("POSTGRES_DB")
driver = "psycopg" # Для Windows psycopg. Позже вернуть asyncpg
# driver = "asyncpg"

@dataclass(frozen=True)
class Settings:
    DATABASE_URL: str
    cors_allowed_origins: tuple[str, ...]


def get_settings() -> Settings:
    return Settings(
        DATABASE_URL = (f"postgresql+{driver}://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"),
        cors_allowed_origins = ("*",),
    )