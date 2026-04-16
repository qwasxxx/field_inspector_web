"""Authentication use-cases."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.errors import AppException
from app.domain.schemas.auth import LoginRequest, TokenResponse, UserPublic
from app.repositories.user_repo import UserRepository
from app.shared.security import create_access_token, verify_password


class AuthService:
    """Login and token issuance."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._users = UserRepository(session)

    async def login(self, body: LoginRequest) -> TokenResponse:
        """
        Validate credentials and return JWT.

        Returns:
            TokenResponse: Access token and public user profile.
        """

        email = body.email.lower().strip()
        user = await self._users.get_by_email(email)
        if user is None or not verify_password(body.password, user.hashed_password):
            raise AppException(401, "Invalid credentials")

        token = create_access_token(
            subject=user.id,
            email=user.email,
            role=user.role,
        )
        public = UserPublic(
            id=str(user.id),
            email=user.email,
            role=user.role,
        )
        await self._session.commit()
        return TokenResponse(access_token=token, user=public)
