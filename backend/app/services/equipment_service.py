"""Equipment use-cases."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.errors import AppException
from app.domain.models.equipment import Equipment
from app.domain.schemas.equipment import EquipmentDto
from app.repositories.equipment_repo import EquipmentRepository


class EquipmentService:
    """Equipment registry reads."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = EquipmentRepository(session)

    def _to_dto(self, row: Equipment) -> EquipmentDto:
        return EquipmentDto(
            id=row.id,
            name=row.name,
            designation=row.designation,
        )

    async def list_equipment(self) -> list[EquipmentDto]:
        """List all equipment."""

        rows = await self._repo.list_all()
        return [self._to_dto(r) for r in rows]

    async def get_equipment(self, equipment_id: str) -> EquipmentDto:
        """Return equipment or 404."""

        row = await self._repo.get_by_id(equipment_id)
        if row is None:
            raise AppException(404, "Equipment not found")
        return self._to_dto(row)
