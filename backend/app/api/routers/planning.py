"""Planning placeholder aligned with MVP `/planning` screen."""

from fastapi import APIRouter, Depends

from app.domain.models.user import User
from app.shared.dependencies import get_current_user

router = APIRouter(prefix="/planning", tags=["planning"])


@router.get("/status")
async def planning_status(_: User = Depends(get_current_user)) -> dict[str, str]:
    """
    Placeholder until integration with mobile office scheduling.

    Returns:
        dict: Human readable status for API consumers.
    """

    return {
        "status": "placeholder",
        "message": (
            "Назначение обходов на смену/день будет выполняться через сервисы "
            "«Мобильный офис» после интеграции."
        ),
    }
