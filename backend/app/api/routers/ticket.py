from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_ticket_service, get_current_user
from app.schemas.tickets import TicketCreateSchema, TicketResponseSchema
from app.services.ticket import (
    TicketService, HallNotFound, ScreeningNotFound,
    SalesClosed, ScreeningStarted, SeatNotFound, SeatUnavailable,
)
from app.models.users import UserORM

router = APIRouter(prefix="/tickets", tags=["Билеты"])

@router.get("/my", response_model=list[TicketResponseSchema])
def my_tickets(
    user: UserORM = Depends(get_current_user),
    service: TicketService = Depends(get_ticket_service),
):
    return service.list_my_tickets(user.id)


@router.post("", response_model=TicketResponseSchema, status_code=status.HTTP_201_CREATED)
def buy_ticket(
    payload: TicketCreateSchema,
    service: TicketService = Depends(get_ticket_service),
    user: UserORM = Depends(get_current_user),
):
    try:
        return service.buy(payload, user)
    except (HallNotFound, ScreeningNotFound, SeatNotFound) as e:
        raise HTTPException(404, str(e))
    except (SalesClosed, ScreeningStarted, SeatUnavailable) as e:
        raise HTTPException(409, str(e))