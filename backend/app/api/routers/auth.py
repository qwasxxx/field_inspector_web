"""Authentication routes."""

from fastapi import APIRouter, Depends

from app.domain.models.user import User
from app.domain.schemas.auth import LoginRequest, TokenResponse, UserPublic
from app.shared.dependencies import get_auth_service, get_current_user
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """
    Issue JWT for supervisor / inspector accounts.

    Returns:
        TokenResponse: Bearer token and public user profile.
    """

    return await service.login(body)


@router.get("/me", response_model=UserPublic)
async def me(user: User = Depends(get_current_user)) -> UserPublic:
    """
    Return the authenticated user profile.

    Returns:
        UserPublic: Stable user identity for the web panel.
    """

    return UserPublic(id=str(user.id), email=user.email, role=user.role)
