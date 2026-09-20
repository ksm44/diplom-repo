from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import get_settings

setting = get_settings()

#engine = create_async_engine(DATABASE_URL) #подключаем асинхронно Алхимию к БД

engine = create_engine(
    setting.DATABASE_URL,
    connect_args={"client_encoding": "utf8"},
    pool_pre_ping=True,
) #подключаем синхронно Алхимию к БД



# создаем фабрику сессий (причём ассинхронных), т.к. работа с БД будет осуществляться в рамках сессий
# AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

SessionLocal = sessionmaker[Session](bind=engine, expire_on_commit=False)


def get_db():
    """Функция для инъекии сессии Базы данных"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()