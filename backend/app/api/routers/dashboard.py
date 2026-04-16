"""Supervisor dashboard routes."""

from fastapi import APIRouter, Depends

from app.domain.models.user import User
from app.domain.schemas.dashboard import DashboardBundleDto
from app.shared.dependencies import get_current_user, get_dashboard_service
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardBundleDto, response_model_by_alias=True)
async def get_dashboard(
    _: User = Depends(get_current_user),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardBundleDto:
    """Return the full dashboard snapshot."""

    return await service.get_bundle()
