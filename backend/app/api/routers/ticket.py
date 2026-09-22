from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_ticket_service
from app.schemas.tickets import TicketCreateSchema, TicketResponseSchema
from app.services.ticket import (
    TicketService, HallNotFound, ScreeningNotFound,
    SalesClosed, ScreeningStarted, SeatNotFound, SeatUnavailable,
)

router = APIRouter(prefix="/tickets", tags=["Билеты"])


@router.post("", response_model=TicketResponseSchema, status_code=status.HTTP_201_CREATED)
def buy_ticket(
    payload: TicketCreateSchema,
    service: TicketService = Depends(get_ticket_service),
):
    try:
        return service.buy(payload)
    except (HallNotFound, ScreeningNotFound, SeatNotFound) as e:
        raise HTTPException(404, str(e))
    except (SalesClosed, ScreeningStarted, SeatUnavailable) as e:
        raise HTTPException(409, str(e))