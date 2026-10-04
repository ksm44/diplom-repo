from uuid import UUID, uuid4
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File

from app.api.dependencies import get_movie_service, require_admin, get_current_user
from app.services.movie import MovieService, MovieNotFound, MovieAlreadyExists
from app.schemas.movies import MovieResponseSchema, MovieAddSchema, PosterUploadResponse

router = APIRouter(prefix="/movies", tags=["Фильмы"])

POSTER_DIR = Path("static/posters")

# Получение фильмов
@router.get("", dependencies=[Depends(get_current_user)])
def get_movies(
        movie_service: MovieService = Depends(get_movie_service)
    ) -> list[MovieResponseSchema]:
    return movie_service.list_movies()

# Создание(добавление) фильма
@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def add_movie(
        payload: MovieAddSchema,
        movie_service: MovieService = Depends(get_movie_service)
    ) -> MovieResponseSchema:
    try:
        return movie_service.create_movie(payload)
    except MovieAlreadyExists as e:
        raise HTTPException(409, detail=str(e))

# Создание(добавление) постера фильма
@router.post("/upload-poster", response_model=PosterUploadResponse,
             dependencies=[Depends(require_admin)])
async def upload_poster(file: UploadFile = File(...)):
    # проверка типа
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Только JPEG, PNG или WebP")

    POSTER_DIR.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "").suffix.lower() or ".jpg"
    filename = f"{uuid4()}{ext}"
    filepath = POSTER_DIR / filename

    # сохраняем потоком, чтобы не грузить в память целиком
    with filepath.open("wb") as f:
        while chunk := await file.read(1024 * 1024):   # по 1 МБ
            f.write(chunk)

    return PosterUploadResponse(poster_url=f"/static/posters/{filename}")


# Удаление фильма
@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_movie(
        movie_id: UUID,
        movie_service: MovieService = Depends(get_movie_service)
    ) -> None:
    try:
        movie_service.delete_movie(movie_id)
    except MovieNotFound as e:
        raise HTTPException(404, detail=str(e))