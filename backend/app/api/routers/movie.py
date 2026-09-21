from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_movie_service
from app.services.movie import MovieService, MovieNotFound, MovieAlreadyExists
from app.schemas.movies import MovieResponseSchema, MovieAddSchema

router = APIRouter(prefix="/movies", tags=["Фильмы"])

# Получение фильмов
@router.get("")
def get_movies(
        movie_service: MovieService = Depends(get_movie_service)
    ) -> list[MovieResponseSchema]:
    return movie_service.list_movies()

# Создание(добавление) фильма
@router.post("", status_code=status.HTTP_201_CREATED)
def add_movie(
        payload: MovieAddSchema,
        movie_service: MovieService = Depends(get_movie_service)
    ) -> MovieResponseSchema:
    try:
        return movie_service.create_movie(payload)
    except MovieAlreadyExists as e:
        raise HTTPException(409, detail=str(e))


# Удаление фильма
@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movie(
        movie_id: UUID,
        movie_service: MovieService = Depends(get_movie_service)
    ) -> None:
    try:
        movie_service.delete_movie(movie_id)
    except MovieNotFound as e:
        raise HTTPException(404, detail=str(e))