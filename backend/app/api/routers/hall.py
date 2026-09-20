from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.halls import HallSchema, HallAddSchema
from app.api.dependencies import get_hall_service
from app.services.hall import HallService, HallNotFound

router = APIRouter(prefix="/halls")

# Получение залов
@router.get("", tags=["Залы кинотеатра"])
def get_halls(hall_service: HallService = Depends(get_hall_service)) -> list[HallSchema]:
    return hall_service.list_halls()


# Создание(добавление) нового зала
@router.post("", status_code=status.HTTP_201_CREATED, tags=["Залы кинотеатра"])
def add_hall(hall_service: HallService = Depends(get_hall_service)) -> HallSchema:
    return hall_service.create_hall()

# Удаление зала
@router.delete("/{number}", status_code=status.HTTP_204_NO_CONTENT, tags=["Залы кинотеатра"])
def remove_hall(number: int, hall_service: HallService = Depends(get_hall_service)) -> None:
    try:
        hall_service.delete_hall(number=number)
    except HallNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,)