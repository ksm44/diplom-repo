# Дипломный проект
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.session import engine
from app.models.base import Base
from app.api.routers.hall import router as hall_router
from app.api.routers.movie import router as movie_router
from app.api.routers.screening import router as screening_router
from app.api.routers.ticket import router as ticket_router
from app.api.routers.auth import router as auth_router

@asynccontextmanager # Контекстный менеджер создает таблицы в БД при старте приложения
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine) # сейчас синхронная работа, возможно надо будет сделать асинхронной
    yield  # после yield можно предусмотреть действия, которые будут выполняться после завершения работы приложения

app = FastAPI(lifespan=lifespan)

STATIC_DIR = Path("static")
STATIC_DIR.mkdir(exist_ok=True)

# статика и QR-коды тут http://localhost:8000/static/qrcodes/{code}.png
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(router=hall_router)
app.include_router(router=movie_router)
app.include_router(router=screening_router)
app.include_router(router=ticket_router)
app.include_router(router=auth_router)

app.add_middleware(
    CORSMiddleware, # type: ignore
    allow_origins=["*"], # всем хостам доступно, либо можно "http://localhost:8000"
    allow_methods=["*"], # разрешены ВСЕ HTTP-методы
)