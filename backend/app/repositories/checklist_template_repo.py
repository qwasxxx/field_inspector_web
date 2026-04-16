"""Checklist template persistence."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.models.checklist_template import ChecklistTemplate


class ChecklistTemplateRepository:
    """CRUD for constructor templates."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _query(self):
        return select(ChecklistTemplate).options(
            selectinload(ChecklistTemplate.items),
        )

    async def list_all(self) -> list[ChecklistTemplate]:
        """Ordered by title."""

        result = await self._session.execute(
            self._query().order_by(ChecklistTemplate.title),
        )
        return list(result.scalars().unique().all())

    async def get_by_id(self, template_id: str) -> ChecklistTemplate | None:
        """Fetch template or None."""

        result = await self._session.execute(
            self._query().where(ChecklistTemplate.id == template_id),
        )
        return result.scalars().unique().one_or_none()

    async def delete(self, template: ChecklistTemplate) -> None:
        """Delete template."""

        await self._session.delete(template)
