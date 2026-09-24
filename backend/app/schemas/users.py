from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.models.users import UserRole


class UserSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    username: str
    role: UserRole


class LoginSchema(BaseModel):
    username: str
    password: str


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"

# требования к длинне логина и пароля
class RegisterSchema(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=3, max_length=20) # bcrypt обрезает пароль до 72 байт