"""User data access."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.user import User


class UserRepository:
    """Persistence for users."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_email(self, email: str) -> User | None:
        """Find user by normalized email."""

        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        """Find user by primary key."""

        result = await self._session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
