from uuid import UUID
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.schemas.movies import MovieResponseSchema, MovieAddSchema
from app.repositories.movies import MovieRepository


class MovieNotFound(Exception):
    """Фильм не найден в БД"""

class MovieAlreadyExists(Exception):
    """Фильм уже есть в БД"""

class MovieService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.movie_repository = MovieRepository(db)

    def list_movies(self) -> list[MovieResponseSchema]:
        return [MovieResponseSchema.model_validate(m) for m in self.movie_repository.get_all()]

    def create_movie(self, data: MovieAddSchema) -> MovieResponseSchema:
        try:
            movie = self.movie_repository.create(data)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise MovieAlreadyExists(f"Фильм {data.title} уже существует")
        return MovieResponseSchema.model_validate(movie)

    def delete_movie(self, movie_id: UUID) -> None:
        movie = self.movie_repository.get_by_id(movie_id)
        if not movie:
            raise MovieNotFound(f"Фильм с id:{movie_id} не найден")
        self.movie_repository.delete(movie)
        self.db.commit()