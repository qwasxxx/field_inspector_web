"""Dashboard snapshot persistence."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.dashboard import (
    DashboardCriticalAlertRow,
    DashboardEmployeeRow,
    DashboardMetricRow,
    DashboardShiftContext,
    DashboardShiftEventRow,
    DashboardShiftProgressRow,
)


class DashboardRepository:
    """Read model for supervisor dashboard."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_shift_context(self) -> DashboardShiftContext | None:
        """Latest shift context row."""

        result = await self._session.execute(
            select(DashboardShiftContext).order_by(DashboardShiftContext.id).limit(1),
        )
        return result.scalar_one_or_none()

    async def list_metrics(self) -> list[DashboardMetricRow]:
        """KPI cards."""

        result = await self._session.execute(
            select(DashboardMetricRow).order_by(DashboardMetricRow.sort_order),
        )
        return list(result.scalars().all())

    async def list_employees(self) -> list[DashboardEmployeeRow]:
        """Roster."""

        result = await self._session.execute(
            select(DashboardEmployeeRow).order_by(DashboardEmployeeRow.sort_order),
        )
        return list(result.scalars().all())

    async def list_events(self) -> list[DashboardShiftEventRow]:
        """Timeline."""

        result = await self._session.execute(
            select(DashboardShiftEventRow).order_by(DashboardShiftEventRow.sort_order),
        )
        return list(result.scalars().all())

    async def list_progress(self) -> list[DashboardShiftProgressRow]:
        """Object progress rows."""

        result = await self._session.execute(
            select(DashboardShiftProgressRow).order_by(
                DashboardShiftProgressRow.sort_order,
            ),
        )
        return list(result.scalars().all())

    async def list_critical_alerts(self) -> list[DashboardCriticalAlertRow]:
        """Critical banners (first used as primary)."""

        result = await self._session.execute(
            select(DashboardCriticalAlertRow).order_by(
                DashboardCriticalAlertRow.sort_order,
            ),
        )
        return list(result.scalars().all())
