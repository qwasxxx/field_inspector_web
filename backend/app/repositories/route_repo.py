"""Inspection routes data access."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.models.route import Checkpoint, CheckpointChecklistItem, InspectionRoute


class RouteRepository:
    """Persistence for routes and nested checkpoints."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _base_query(self):
        return (
            select(InspectionRoute)
            .options(
                selectinload(InspectionRoute.checkpoints).selectinload(
                    Checkpoint.checklist_items,
                ),
            )
            .order_by(InspectionRoute.id)
        )

    async def list_all(self) -> list[InspectionRoute]:
        """List routes with checkpoints and checklist items."""

        result = await self._session.execute(self._base_query())
        return list(result.scalars().unique().all())

    async def get_by_id(self, route_id: str) -> InspectionRoute | None:
        """Return route graph or None."""

        result = await self._session.execute(
            self._base_query().where(InspectionRoute.id == route_id),
        )
        return result.scalars().unique().one_or_none()

    async def delete(self, route: InspectionRoute) -> None:
        """Remove route (cascades to checkpoints)."""

        await self._session.delete(route)
