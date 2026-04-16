"""Equipment registry routes."""

from fastapi import APIRouter, Depends

from app.domain.models.user import User
from app.domain.schemas.equipment import EquipmentDto
from app.shared.dependencies import get_current_user, get_equipment_service
from app.services.equipment_service import EquipmentService

router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.get("", response_model=list[EquipmentDto])
async def list_equipment(
    _: User = Depends(get_current_user),
    service: EquipmentService = Depends(get_equipment_service),
) -> list[EquipmentDto]:
    """List equipment entries."""

    return await service.list_equipment()


@router.get("/{equipment_id}", response_model=EquipmentDto)
async def get_equipment(
    equipment_id: str,
    _: User = Depends(get_current_user),
    service: EquipmentService = Depends(get_equipment_service),
) -> EquipmentDto:
    """Return equipment by id."""

    return await service.get_equipment(equipment_id)
