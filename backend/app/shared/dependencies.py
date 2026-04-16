"""FastAPI dependencies (DB session, auth)."""

import uuid

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.domain.errors import AppException
from app.domain.models.user import User
from app.services.auth_service import AuthService
from app.services.checklist_template_service import ChecklistTemplateService
from app.services.dashboard_service import DashboardService
from app.services.equipment_service import EquipmentService
from app.services.route_service import RouteService
from app.services.sync_service import SyncService
from app.shared.security import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Resolve the current user from Bearer JWT."""

    if credentials is None or not credentials.credentials:
        raise AppException(401, "Not authenticated")
    try:
        payload = decode_token(credentials.credentials)
        sub = payload.get("sub")
        if not sub:
            raise AppException(401, "Invalid token")
        user_id = uuid.UUID(str(sub))
    except (JWTError, ValueError, TypeError) as exc:
        raise AppException(401, "Invalid token") from exc

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise AppException(401, "User not found")
    return user


def get_auth_service(session: AsyncSession = Depends(get_session)) -> AuthService:
    """Auth service factory."""

    return AuthService(session)


def get_route_service(session: AsyncSession = Depends(get_session)) -> RouteService:
    """Route service factory."""

    return RouteService(session)


def get_equipment_service(
    session: AsyncSession = Depends(get_session),
) -> EquipmentService:
    """Equipment service factory."""

    return EquipmentService(session)


def get_dashboard_service(
    session: AsyncSession = Depends(get_session),
) -> DashboardService:
    """Dashboard service factory."""

    return DashboardService(session)


def get_checklist_template_service(
    session: AsyncSession = Depends(get_session),
) -> ChecklistTemplateService:
    """Checklist template service factory."""

    return ChecklistTemplateService(session)


def get_sync_service(session: AsyncSession = Depends(get_session)) -> SyncService:
    """Sync service factory."""

    return SyncService(session)
