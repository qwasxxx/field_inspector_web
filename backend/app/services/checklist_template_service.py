"""Checklist template constructor use-cases."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.errors import AppException
from app.domain.models.checklist_template import ChecklistTemplate, ChecklistTemplateItem
from app.domain.schemas.checklist import (
    ChecklistFieldDto,
    ChecklistTemplateCreateRequest,
    ChecklistTemplateDto,
    ChecklistTemplateUpdateRequest,
)
from app.repositories.checklist_template_repo import ChecklistTemplateRepository


class ChecklistTemplateService:
    """Template CRUD."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = ChecklistTemplateRepository(session)

    def _to_dto(self, tpl: ChecklistTemplate) -> ChecklistTemplateDto:
        items = sorted(tpl.items, key=lambda i: i.sort_order)
        return ChecklistTemplateDto(
            id=tpl.id,
            title=tpl.title,
            items=[
                ChecklistFieldDto(
                    id=i.id,
                    label=i.label,
                    type=i.type,  # type: ignore[arg-type]
                    required=i.required,
                )
                for i in items
            ],
        )

    async def list_templates(self) -> list[ChecklistTemplateDto]:
        """All templates."""

        rows = await self._repo.list_all()
        return [self._to_dto(r) for r in rows]

    async def get_template(self, template_id: str) -> ChecklistTemplateDto:
        """Single template."""

        row = await self._repo.get_by_id(template_id)
        if row is None:
            raise AppException(404, "Template not found")
        return self._to_dto(row)

    async def create_template(self, body: ChecklistTemplateCreateRequest) -> ChecklistTemplateDto:
        """Create template."""

        existing = await self._repo.get_by_id(body.id)
        if existing is not None:
            raise AppException(409, "Template id already exists")

        tpl = ChecklistTemplate(id=body.id, title=body.title)
        for order, field in enumerate(body.items):
            tpl.items.append(
                ChecklistTemplateItem(
                    id=field.id,
                    label=field.label,
                    type=field.type,
                    required=field.required,
                    sort_order=order,
                ),
            )
        self._session.add(tpl)
        await self._session.commit()
        await self._session.refresh(tpl)
        return self._to_dto(tpl)

    async def update_template(
        self,
        template_id: str,
        body: ChecklistTemplateUpdateRequest,
    ) -> ChecklistTemplateDto:
        """Replace template fields."""

        tpl = await self._repo.get_by_id(template_id)
        if tpl is None:
            raise AppException(404, "Template not found")

        tpl.title = body.title
        tpl.items.clear()
        for order, field in enumerate(body.items):
            tpl.items.append(
                ChecklistTemplateItem(
                    id=field.id,
                    label=field.label,
                    type=field.type,
                    required=field.required,
                    sort_order=order,
                ),
            )
        await self._session.commit()
        await self._session.refresh(tpl)
        return self._to_dto(tpl)

    async def delete_template(self, template_id: str) -> None:
        """Delete template."""

        tpl = await self._repo.get_by_id(template_id)
        if tpl is None:
            raise AppException(404, "Template not found")
        await self._repo.delete(tpl)
        await self._session.commit()
