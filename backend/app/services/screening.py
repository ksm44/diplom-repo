from datetime import date, datetime, timedelta
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.screenings import ScreeningORM

from app.repositories.halls import HallRepository
from app.repositories.movies import MovieRepository
from app.repositories.screenings import ScreeningRepository
from app.repositories.seats import SeatRepository
from app.repositories.tickets import TicketRepository

from app.schemas.screenings import ScreeningAddSchema, ScreeningResponseSchema, ScreeningDetailSchema
from app.schemas.halls import HallSchema
from app.schemas.movies import MovieResponseSchema
from app.schemas.seats import SeatStateSchema, SeatSchema


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
        self.hall_repo = HallRepository(db)
        self.seat_repo = SeatRepository(db)
        self.ticket_repo = TicketRepository(db)

    def list_by_date(self, target: date) -> list[ScreeningResponseSchema]:
        return [self._to_schema(s) for s in self.repo.get_by_date(target)]

    def create_screening(self, data: ScreeningAddSchema) -> ScreeningResponseSchema:
        start = data.datetime_start
        if start <= datetime.now():
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
        # удаляем существующие сеансы этого дня
        existing = self.repo.get_by_date(target)
        self.repo.delete_many([s.id for s in existing])

        # проверяем новые
        to_create: list[ScreeningORM] = []
        for screening in screenings:
            start = screening.datetime_start

            # проверка "не в прошлом" — только если id не передан (новый сеанс)
            if screening.id is None and start <= datetime.now():
                raise ScreeningInPast(f"Сеанс {start} в прошлом")

            movie = self.movie_repo.get_by_id(screening.movie_id)
            if not movie:
                raise ScreeningNotFound(f"Фильм {screening.movie_id} не найден")

            start = screening.datetime_start
            if start <= datetime.now():
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

    def get_detail(self, screening_id: UUID) -> ScreeningDetailSchema:
        screening = self.repo.get_by_id(screening_id)
        if not screening:
            raise ScreeningNotFound(f"Сеанс {screening_id} не найден")

        movie = self.movie_repo.get_by_id(screening.movie_id)
        hall = self.hall_repo.get_by_id(screening.hall_id)
        seats = self.seat_repo.get_by_hall(screening.hall_id)
        taken = self.ticket_repo.get_booked_seat_ids(screening_id)

        return ScreeningDetailSchema(
            id=screening.id,
            datetime_start=screening.datetime_start,
            datetime_end=screening.datetime_start + timedelta(minutes=movie.duration),
            movie=MovieResponseSchema.model_validate(movie),
            hall=HallSchema.model_validate(hall),
            seats=[
                SeatStateSchema(
                    **SeatSchema.model_validate(s).model_dump(),
                    is_taken=s.id in taken,
                )
                for s in seats
            ],
        )

    def delete_screening(self, screening_id: UUID) -> None:
        s = self.repo.get_by_id(screening_id)
        if not s:
            raise ScreeningNotFound(f"Сеанс {screening_id} не найден")
        self.db.delete(s)
        self.db.commit()

    @staticmethod
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
        #группируем по залу
        by_hall: dict[UUID, list[ScreeningORM]] = {}
        for s in screenings:
            by_hall.setdefault(s.hall_id, []).append(s)

        for hall_id, items in by_hall.items():
            #сортируем по началу
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
        hall = self.hall_repo.get_by_id(s.hall_id)
        return ScreeningResponseSchema(
            id=s.id,
            movie_id=s.movie_id,
            hall_id=s.hall_id,
            datetime_start=s.datetime_start,
            datetime_end=s.datetime_start + timedelta(minutes=movie.duration),  # type: ignore[union-attr]
            hall_number=hall.number if hall else 0,
            is_active=hall.is_active,
        )