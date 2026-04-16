"""Auth request/response schemas."""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Supervisor / inspector login."""

    email: EmailStr
    password: str = Field(min_length=1)


class UserPublic(BaseModel):
    """User exposed to clients."""

    id: str
    email: str
    role: str


class TokenResponse(BaseModel):
    """OAuth2-style token payload."""

    access_token: str
    token_type: str = "bearer"
    user: UserPublic
