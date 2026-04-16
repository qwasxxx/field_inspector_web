"""Dashboard aggregation use-cases."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.errors import AppException
from app.domain.schemas.dashboard import (
    CriticalDefectAlertDto,
    DashboardBundleDto,
    DashboardEmployeeDto,
    DashboardMetricDto,
    ShiftContextDto,
    ShiftEventDto,
    ShiftProgressItemDto,
)
from app.repositories.dashboard_repo import DashboardRepository


class DashboardService:
    """Build supervisor dashboard snapshot."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = DashboardRepository(session)

    async def get_bundle(self) -> DashboardBundleDto:
        """
        Load dashboard tables into a single DTO.

        Returns:
            DashboardBundleDto: Snapshot for the web panel.
        """

        ctx = await self._repo.get_shift_context()
        if ctx is None:
            raise AppException(503, "Dashboard is not seeded")

        metrics = await self._repo.list_metrics()
        employees = await self._repo.list_employees()
        events = await self._repo.list_events()
        progress = await self._repo.list_progress()
        alerts = await self._repo.list_critical_alerts()

        shift = ShiftContextDto(
            shift_number=ctx.shift_number,
            date_label=ctx.date_label,
            site_label=ctx.site_label,
            online_current=ctx.online_current,
            online_total=ctx.online_total,
        )
        alert_dto = None
        if alerts:
            a = alerts[0]
            alert_dto = CriticalDefectAlertDto(
                id=a.id,
                message=a.message,
                time=a.time,
                object_ref=a.object_ref,
            )

        return DashboardBundleDto(
            shift_context=shift,
            metrics=[
                DashboardMetricDto(
                    id=m.id,
                    title=m.title,
                    value=m.value,
                    caption=m.caption,
                )
                for m in metrics
            ],
            employees=[
                DashboardEmployeeDto(
                    id=e.id,
                    name=e.name,
                    initials=e.initials,
                    status=e.status,
                    status_label=e.status_label,
                    location_hint=e.location_hint,
                )
                for e in employees
            ],
            events=[
                ShiftEventDto(
                    id=ev.id,
                    time=ev.time,
                    title=ev.title,
                    detail=ev.detail,
                    type=ev.type,
                )
                for ev in events
            ],
            progress=[
                ShiftProgressItemDto(
                    id=p.id,
                    name=p.name,
                    current=p.current,
                    total=p.total,
                )
                for p in progress
            ],
            critical_alert=alert_dto,
        )
