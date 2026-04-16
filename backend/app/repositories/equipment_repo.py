"""Equipment data access."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.equipment import Equipment


class EquipmentRepository:
    """Persistence for equipment registry."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[Equipment]:
        """Return all equipment ordered by id."""

        result = await self._session.execute(select(Equipment).order_by(Equipment.id))
        return list(result.scalars().all())

    async def get_by_id(self, equipment_id: str) -> Equipment | None:
        """Return equipment or None."""

        result = await self._session.execute(
            select(Equipment).where(Equipment.id == equipment_id),
        )
        return result.scalar_one_or_none()
