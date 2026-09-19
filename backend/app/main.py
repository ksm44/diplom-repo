# Дипломный проект
from contextlib import asynccontextmanager

import fastapi
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import func, create_engine, select
from sqlalchemy.orm import Session, sessionmaker, DeclarativeBase, Mapped
from sqlalchemy.orm import mapped_column
from starlette import status
from dotenv import load_dotenv
import os


load_dotenv()



db_user = os.getenv("POSTGRES_USER")
db_pass = os.getenv("POSTGRES_PASSWORD")
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT")
db_name = os.getenv("POSTGRES_DB")
driver = "psycopg" # Для Windows psycopg. Позже вернуть asyncpg
# driver = "asyncpg"


DATABASE_URL=(f"postgresql+{driver}://"
              f"{db_user}"
              f":{db_pass}"
              f"@{db_host}"
              f":{db_port}"
              f"/{db_name}"
)

#engine = create_async_engine(DATABASE_URL) #подключаем асинхронно Алхимию к БД
engine = create_engine(
    DATABASE_URL,
    connect_args={"client_encoding": "utf8"},
    pool_pre_ping=True,
) #подключаем синхронно Алхимию к БД



# создаем фабрику сессий (причём ассинхронных), т.к. работа с БД будет осуществляться в рамках сессий
# AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class HallORM(Base):
    __tablename__ = "halls"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    number: Mapped[int] = mapped_column(unique=True)

# добавляем контекстный менеджер, который будет создавать таблицы в БД при старте приложения
# тут же после yield можно предусмотреть действия, которые будут выполняться после завершения работы приложения
@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    #async with engine.begin() as conn:
        #await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware( 
    CORSMiddleware,
    allow_origins=["*"], # всем хостам доступно, либо можно "http://localhost:8000"
    allow_methods=["*"], # разрешены ВСЕ HTTP-методы
)

#Зал (кинозал)
class HallSchema(BaseModel):
    id: int
    number: int

class AddHallSchema(BaseModel):
    id: int
    number: int


#Пользователь
class User(BaseModel):
    id: str
    role: str

#Фильм
class Movie(BaseModel):
    id: str
    title: str

# Сеанс (киносеанс)
class Screening(BaseModel):
    id: str
    date_start: str
    date_end: str
    time_start: str
    duration: str


def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()

def halls_orm_to_model(halls_orm:HallORM) -> HallSchema:
    return HallSchema(id=halls_orm.id, number=halls_orm.number)

# Получение залов
@app.get("/halls")
def get_halls(db: Session = Depends(get_db)) -> list[HallSchema]:
    halls_from_db = db.scalars(select(HallORM)).all()
    return [halls_orm_to_model(hall) for hall in halls_from_db]

# Создание(добавление) нового зала
@app.post("/halls", status_code=status.HTTP_201_CREATED)
def add_hall(payload:AddHallSchema, db: Session = Depends(get_db)) -> HallSchema:
    new_hall = HallORM()
    db.add(new_hall)
    db.commit()
    return halls_orm_to_model(new_hall)

# Удаление зала
@app.delete("/halls/{id}", status_code=fastapi.status.HTTP_204_NO_CONTENT)
def remove_hall(hall_id: int, db: Session = Depends(get_db)) -> None:
    hall_for_remove = db.get(HallORM, hall_id)
    db.delete(hall_for_remove)
    db.commit()




@app.get("/")
def create_hall():
    return {"message": "Hello, World!"}

@app.post("/")
def send():
    pass

@app.patch("/{id}")
def change(id: int):
    pass

@app.delete("/{id}")
def remove(id: int):
    pass

