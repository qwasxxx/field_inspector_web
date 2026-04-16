"""Route DTOs aligned with admin_panel `routeDtos.ts`."""

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class ChecklistItemDto(BaseModel):
    """Single checklist field on a checkpoint."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    label: str
    type: str = Field(pattern="^(boolean|number|text)$")
    required: bool = True


class CheckpointDto(BaseModel):
    """Checkpoint with equipment link and checklist."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    equipment_id: str = Field(
        serialization_alias="equipmentId",
        validation_alias=AliasChoices("equipmentId", "equipment_id"),
    )
    checklist: list[ChecklistItemDto]


class RouteDto(BaseModel):
    """Full route graph for API consumers."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    checkpoints: list[CheckpointDto]


class RouteCreateRequest(BaseModel):
    """Create route with nested checkpoints."""

    id: str
    name: str
    checkpoints: list[CheckpointDto]


class RouteUpdateRequest(BaseModel):
    """Replace route payload."""

    name: str
    checkpoints: list[CheckpointDto]
