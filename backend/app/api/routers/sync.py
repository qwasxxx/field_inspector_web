"""Sync ingestion routes."""

from fastapi import APIRouter, Depends

from app.domain.models.user import User
from app.domain.schemas.sync import SyncIngestRequest
from app.shared.dependencies import get_current_user, get_sync_service
from app.services.sync_service import SyncService

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/ingest")
async def ingest_sync(
    body: SyncIngestRequest,
    user: User = Depends(get_current_user),
    service: SyncService = Depends(get_sync_service),
) -> dict[str, int]:
    """
    Persist a batch of client sync queue items.

    Returns:
        dict: Count of stored rows under key ``stored``.
    """

    stored = await service.ingest(body, user)
    return {"stored": stored}
