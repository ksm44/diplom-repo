from datetime import date, datetime, timedelta
from uuid import UUID
from datetime import timezone

from sqlalchemy.orm import Session

from app.models.screenings import ScreeningORM
from app.repositories.movies import MovieRepository
from app.repositories.screenings import ScreeningRepository
from app.schemas.screenings import ScreeningAddSchema, ScreeningResponseSchema


class ScreeningNotFound(Exception): ...
class ScreeningOverlap(Exception):
    """Киносеанс пересекается по времени с другим в этом зале."""
class ScreeningOutOfDay(Exception):
    """Киносеанс выходит за пределы суток."""
class ScreeningInPast(Exception):
    """Попытка создать киносеанс в прошлом"""

class ScreeningService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ScreeningRepository(db)
        self.movie_repo = MovieRepository(db)

    def list_by_date(self, target: date) -> list[ScreeningResponseSchema]:
        return [self._to_schema(s) for s in self.repo.get_by_date(target)]

    def create_screening(self, data: ScreeningAddSchema) -> ScreeningResponseSchema:
        start = self._to_utc(data.datetime_start)
        if start <= datetime.now(timezone.utc):
            raise ScreeningInPast("Нельзя создать сеанс в прошлом")


        movie = self.movie_repo.get_by_id(data.movie_id)
        if not movie:
            raise ScreeningNotFound("Фильм не найден")

        end = start + timedelta(minutes=movie.duration)
        self._check_within_day(start, end)
        self._check_overlaps(data.hall_id, start, end)

        s = ScreeningORM(
            movie_id=data.movie_id,
            hall_id=data.hall_id,
            datetime_start=start,
        )
        self.repo.create_many([s])
        self.db.commit()
        self.db.refresh(s)
        return self._to_schema(s)

    def bulk_save(self, target: date, screenings: list[ScreeningAddSchema]) -> list[ScreeningResponseSchema]:
        """Массовое сохранение: удаляем все сеансы дня и вставляем новые."""
        # 1. удаляем существующие сеансы этого дня
        existing = self.repo.get_by_date(target)
        self.repo.delete_many([s.id for s in existing])

        # 2. проверяем новые
        to_create: list[ScreeningORM] = []
        for screening in screenings:
            movie = self.movie_repo.get_by_id(screening.movie_id)
            if not movie:
                raise ScreeningNotFound(f"Фильм {screening.movie_id} не найден")

            start = self._to_utc(screening.datetime_start)
            if start <= datetime.now(timezone.utc):
                raise ScreeningInPast(f"Сеанс {start} в прошлом")
            
            end = start + timedelta(minutes=movie.duration)

            self._check_within_day(start, end)
            to_create.append(ScreeningORM(
                movie_id=screening.movie_id,
                hall_id=screening.hall_id,
                datetime_start=start,
            ))

        self._check_all_overlaps(to_create)
        self.repo.create_many(to_create)
        self.db.commit()
        return [self._to_schema(s) for s in to_create]

    def delete_screening(self, screening_id: UUID) -> None:
        s = self.repo.get_by_id(screening_id)
        if not s:
            raise ScreeningNotFound(f"Сеанс {screening_id} не найден")
        self.db.delete(s)
        self.db.commit()

    @staticmethod #т.к. не используется self в этом методе
    def _check_within_day(start: datetime, end: datetime) -> None:
        if start.date() != end.date():
            raise ScreeningOutOfDay("Сеанс не может выходить за пределы суток")

    def _check_overlaps(self, hall_id: UUID, start: datetime, end: datetime) -> None:
        for s in self.repo.get_by_hall_and_date(hall_id, start.date()):
            movie = self.movie_repo.get_by_id(s.movie_id)
            s_end = s.datetime_start + timedelta(minutes=movie.duration)  # type: ignore[union-attr]
            if start < s_end and end > s.datetime_start:
                raise ScreeningOverlap(f"Пересечение с сеансом {s.id}")

    def _check_all_overlaps(self, screenings: list[ScreeningORM]) -> None:
        # группируем по залу
        by_hall: dict[UUID, list[ScreeningORM]] = {}
        for s in screenings:
            by_hall.setdefault(s.hall_id, []).append(s)

        for hall_id, items in by_hall.items():
            # сортируем по началу
            items.sort(key=lambda s: s.datetime_start)

            # проверяем, что каждый следующий начинается не раньше конца предыдущего
            for prev, curr in zip(items, items[1:]):
                movie = self.movie_repo.get_by_id(prev.movie_id)
                prev_end = prev.datetime_start + timedelta(minutes=movie.duration)  # type: ignore[union-attr]
                if curr.datetime_start < prev_end:
                    raise ScreeningOverlap(
                        f"Сеансы в зале {hall_id} пересекаются: "
                        f"{prev.datetime_start}–{prev_end} и {curr.datetime_start}"
                    )

    def _to_schema(self, s: ScreeningORM) -> ScreeningResponseSchema:
        movie = self.movie_repo.get_by_id(s.movie_id)
        return ScreeningResponseSchema(
            id=s.id,
            movie_id=s.movie_id,
            hall_id=s.hall_id,
            datetime_start=s.datetime_start,
            datetime_end=s.datetime_start + timedelta(minutes=movie.duration),  # type: ignore[union-attr]
        )

    @staticmethod
    def _to_utc(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)