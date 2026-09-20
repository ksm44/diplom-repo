# Дипломный проект
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine
from app.models.base import Base #создал __init__.py чтобы не было unresolved
from app.api.routers.hall import router as hall_router


@asynccontextmanager # Контекстный менеджер создает таблицы в БД при старте приложения
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine) # сейчас синхронная работа, возможно надо будет сделать асинхронной
    yield  # после yield можно предусмотреть действия, которые будут выполняться после завершения работы приложения

app = FastAPI(lifespan=lifespan)
app.include_router(router=hall_router)

app.add_middleware(
    CORSMiddleware, # type: ignore
    allow_origins=["*"], # всем хостам доступно, либо можно "http://localhost:8000"
    allow_methods=["*"], # разрешены ВСЕ HTTP-методы
)