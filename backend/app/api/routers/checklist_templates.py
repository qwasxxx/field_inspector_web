"""Checklist constructor template routes."""

from fastapi import APIRouter, Depends, status

from app.domain.models.user import User
from app.domain.schemas.checklist import (
    ChecklistTemplateCreateRequest,
    ChecklistTemplateDto,
    ChecklistTemplateUpdateRequest,
)
from app.shared.dependencies import get_checklist_template_service, get_current_user
from app.services.checklist_template_service import ChecklistTemplateService

router = APIRouter(prefix="/checklist-templates", tags=["checklist-templates"])


@router.get("", response_model=list[ChecklistTemplateDto])
async def list_templates(
    _: User = Depends(get_current_user),
    service: ChecklistTemplateService = Depends(get_checklist_template_service),
) -> list[ChecklistTemplateDto]:
    """List all templates."""

    return await service.list_templates()


@router.get("/{template_id}", response_model=ChecklistTemplateDto)
async def get_template(
    template_id: str,
    _: User = Depends(get_current_user),
    service: ChecklistTemplateService = Depends(get_checklist_template_service),
) -> ChecklistTemplateDto:
    """Return a single template."""

    return await service.get_template(template_id)


@router.post(
    "",
    response_model=ChecklistTemplateDto,
    status_code=status.HTTP_201_CREATED,
)
async def create_template(
    body: ChecklistTemplateCreateRequest,
    _: User = Depends(get_current_user),
    service: ChecklistTemplateService = Depends(get_checklist_template_service),
) -> ChecklistTemplateDto:
    """Create a template."""

    return await service.create_template(body)


@router.put("/{template_id}", response_model=ChecklistTemplateDto)
async def update_template(
    template_id: str,
    body: ChecklistTemplateUpdateRequest,
    _: User = Depends(get_current_user),
    service: ChecklistTemplateService = Depends(get_checklist_template_service),
) -> ChecklistTemplateDto:
    """Update a template."""

    return await service.update_template(template_id, body)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: str,
    _: User = Depends(get_current_user),
    service: ChecklistTemplateService = Depends(get_checklist_template_service),
) -> None:
    """Delete a template."""

    await service.delete_template(template_id)
