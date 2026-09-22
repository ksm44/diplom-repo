from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_screening_service
from app.schemas.screenings import (
    ScreeningAddSchema,
    ScreeningResponseSchema,
)
from app.services.screening import (
    ScreeningService, ScreeningNotFound, ScreeningOverlap, ScreeningOutOfDay, ScreeningInPast,
)

router = APIRouter(prefix="/screenings", tags=["Сеансы"])


@router.get("", response_model=list[ScreeningResponseSchema])
def get_screenings(
    date_screening: date,
    service: ScreeningService = Depends(get_screening_service),
):
    return service.list_by_date(date_screening)


@router.post("", response_model=ScreeningResponseSchema, status_code=status.HTTP_201_CREATED)
def add_screening(
    payload: ScreeningAddSchema,
    service: ScreeningService = Depends(get_screening_service),
):
    try:
        return service.create_screening(payload)
    except ScreeningNotFound as e:
        raise HTTPException(404, detail=str(e))
    except (ScreeningOverlap, ScreeningOutOfDay) as e:
        raise HTTPException(409, detail=str(e))
    except ScreeningInPast as e:
        raise HTTPException(403, detail=str(e))

# PUT, а не PATHC т.к. происходит полное новое состояние ресурса
# PATCH - это частичное изменение
@router.put("", response_model=list[ScreeningResponseSchema])
def bulk_save(
    date_screening: date,
    payload: list[ScreeningAddSchema],
    service: ScreeningService = Depends(get_screening_service),
):
    try:
        return service.bulk_save(date_screening, payload)
    except ScreeningNotFound as e:
        raise HTTPException(404, str(e))
    except (ScreeningOverlap, ScreeningOutOfDay) as e:
        raise HTTPException(409, str(e))
    except ScreeningInPast as e:
        raise HTTPException(403, detail=str(e))


@router.delete("/{screening_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_screening(
    screening_id: UUID,
    service: ScreeningService = Depends(get_screening_service),
):
    try:
        service.delete_screening(screening_id)
    except ScreeningNotFound as e:
        raise HTTPException(404, str(e))