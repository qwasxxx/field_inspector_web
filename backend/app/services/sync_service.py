"""Sync ingestion use-cases."""

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.sync_queue import SyncQueueItem
from app.domain.models.user import User
from app.domain.schemas.sync import SyncIngestRequest, SyncQueueItemCreate
from app.repositories.sync_repo import SyncRepository
from app.shared.utils import new_id


class SyncService:
    """Persist client sync queue batches."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = SyncRepository(session)

    def _make_row(self, item: SyncQueueItemCreate, user: User | None) -> SyncQueueItem:
        row_id = item.id or new_id("sync-")
        return SyncQueueItem(
            id=row_id,
            created_at=datetime.now(timezone.utc),
            kind=item.kind,
            payload=dict(item.payload),
            received_from_user_id=str(user.id) if user else None,
        )

    async def ingest(self, body: SyncIngestRequest, user: User | None) -> int:
        """
        Store sync items from a client batch.

        Returns:
            int: Number of stored rows.
        """

        count = 0
        for item in body.items:
            row = self._make_row(item, user)
            await self._repo.add(row)
            count += 1
        await self._session.commit()
        return count
