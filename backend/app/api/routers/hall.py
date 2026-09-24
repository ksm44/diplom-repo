from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.halls import HallSchema, HallAddSchema, HallWithSeatsSchema, HallPricesUpdateSchema
from app.api.dependencies import get_hall_service, require_admin, get_current_user
from app.services.hall import HallService, HallNotFound, SeatNotFound
from app.schemas.seats import SeatsBulkUpdateSchema

router = APIRouter(prefix="/halls", tags=["Залы кинотеатра"])

# Получение залов
@router.get("", dependencies=[Depends(get_current_user)])
def get_halls(hall_service: HallService = Depends(get_hall_service)) -> list[HallSchema]:
    return hall_service.list_halls()

@router.get("/{number}", dependencies=[Depends(get_current_user)])
def get_hall(
        number: int,
        service: HallService = Depends(get_hall_service)
    ) -> HallWithSeatsSchema:
    try:
        return service.get_hall_with_seats(number)
    except HallNotFound as e:
        raise HTTPException(404, detail=str(e))

# Создание(добавление) нового зала
@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def add_hall(
        payload: HallAddSchema,
        hall_service: HallService = Depends(get_hall_service)
    ) -> HallSchema:
    return hall_service.create_hall(payload)

# Обновление мест(кресел) - по сути Конфигурирование зала
@router.patch("/{number}/seats", dependencies=[Depends(require_admin)])
def bulk_update_seats(
    number: int,
    payload: SeatsBulkUpdateSchema,
    service: HallService = Depends(get_hall_service),
) -> HallWithSeatsSchema:
    try:
        return service.bulk_update_seats(number, payload)
    except (HallNotFound, SeatNotFound) as e:
        raise HTTPException(404, detail=str(e))

@router.patch("/{number}/activate", dependencies=[Depends(require_admin)])
def toggle_active(number: int, service: HallService = Depends(get_hall_service)) -> HallSchema:
    try:
        return service.toggle_active(number)
    except HallNotFound as e:
        raise HTTPException(404, detail=str(e))


# Обновление цен на места(кресла) - по сути Конфигурирование цен
@router.patch("/{number}/prices", dependencies=[Depends(require_admin)])
def update_prices(
    number: int,
    payload: HallPricesUpdateSchema,
    service: HallService = Depends(get_hall_service),
) -> HallSchema:
    try:
        return service.update_prices(number, payload)
    except HallNotFound as e:
        raise HTTPException(404, detail=str(e))

# Удаление зала
@router.delete("/{number}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def remove_hall(number: int,
                hall_service: HallService = Depends(get_hall_service)
    ) -> None:
    try:
        hall_service.delete_hall(number=number)
    except HallNotFound as e:
        raise HTTPException(404, detail=str(e))