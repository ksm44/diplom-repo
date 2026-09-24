from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_auth_service
from app.schemas.users import LoginSchema, TokenSchema, RegisterSchema
from app.services.auth import AuthService, InvalidCredentials, UserAlreadyExists

router = APIRouter(prefix="/auth", tags=["Управление учетными записями"])


@router.post("/login")
def login(payload: LoginSchema, service: AuthService = Depends(get_auth_service)) -> TokenSchema:
    try:
        return service.login(payload)
    except InvalidCredentials as e:
        raise HTTPException(401, str(e))


@router.post("/register", response_model=TokenSchema, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterSchema, service: AuthService = Depends(get_auth_service)):
    try:
        return service.register(payload)
    except UserAlreadyExists as e:
        raise HTTPException(409, str(e))