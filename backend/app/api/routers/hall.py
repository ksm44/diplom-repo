from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.halls import HallSchema, HallAddSchema, HallWithSeatsSchema
from app.api.dependencies import get_hall_service
from app.services.hall import HallService, HallNotFound, SeatNotFound
from app.schemas.seats import SeatsBulkUpdateSchema

router = APIRouter(prefix="/halls", tags=["Залы кинотеатра"])

# Получение залов
@router.get("", tags=["Залы кинотеатра"])
def get_halls(hall_service: HallService = Depends(get_hall_service)) -> list[HallSchema]:
    return hall_service.list_halls()

@router.get("/{number}", tags=["Залы кинотеатра"])
def get_hall(
        number: int,
        service: HallService = Depends(get_hall_service)
    ) -> HallWithSeatsSchema:
    try:
        return service.get_hall_with_seats(number)
    except HallNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)


# Создание(добавление) нового зала
@router.post("", status_code=status.HTTP_201_CREATED, tags=["Залы кинотеатра"])
def add_hall(
        payload: HallAddSchema,
        hall_service: HallService = Depends(get_hall_service)
    ) -> HallSchema:
    return hall_service.create_hall(payload)

# Обновление мест(кресел) - по сути Конфигурирование зала
@router.patch("/{number}/seats", response_model=HallWithSeatsSchema)
def bulk_update_seats(
    number: int,
    payload: SeatsBulkUpdateSchema,
    service: HallService = Depends(get_hall_service),
):
    try:
        return service.bulk_update_seats(number, payload)
    except (HallNotFound, SeatNotFound):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

# Удаление зала
@router.delete("/{number}", status_code=status.HTTP_204_NO_CONTENT, tags=["Залы кинотеатра"])
def remove_hall(number: int,
                hall_service: HallService = Depends(get_hall_service)
    ) -> None:
    try:
        hall_service.delete_hall(number=number)
    except HallNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)