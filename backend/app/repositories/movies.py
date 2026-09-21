from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.movies import MovieORM
from app.schemas.movies import MovieAddSchema


class MovieRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_all(self) -> list[MovieORM]:
        return list(self.db.scalars(select(MovieORM).order_by(MovieORM.title)).all())

    def get_by_id(self, movie_id: UUID) -> MovieORM | None:
        return self.db.get(MovieORM, movie_id) # type: ignore[return-value]

    def create(self, data: MovieAddSchema) -> MovieORM:
        movie = MovieORM(**data.model_dump())
        self.db.add(movie)
        self.db.flush()
        self.db.refresh(movie)
        return movie

    def delete(self, movie: MovieORM) -> None:
        self.db.delete(movie)
        self.db.flush()