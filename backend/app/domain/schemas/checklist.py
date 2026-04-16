"""Checklist template schemas (constructor)."""

from pydantic import BaseModel, Field


class ChecklistFieldDto(BaseModel):
    """Template field."""

    id: str
    label: str
    type: str = Field(pattern="^(text|number|checkbox)$")
    required: bool = True


class ChecklistTemplateDto(BaseModel):
    """Template with ordered fields."""

    id: str
    title: str
    items: list[ChecklistFieldDto]


class ChecklistTemplateCreateRequest(BaseModel):
    """Create template."""

    id: str
    title: str
    items: list[ChecklistFieldDto]


class ChecklistTemplateUpdateRequest(BaseModel):
    """Update template."""

    title: str
    items: list[ChecklistFieldDto]
