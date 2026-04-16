"""Equipment DTOs."""

from pydantic import BaseModel


class EquipmentDto(BaseModel):
    """Equipment card."""

    id: str
    name: str
    designation: str | None = None
