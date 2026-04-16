"""Sync queue persistence."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.sync_queue import SyncQueueItem


class SyncRepository:
    """Inbound sync events."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, item: SyncQueueItem) -> SyncQueueItem:
        """Persist a sync item."""

        self._session.add(item)
        await self._session.flush()
        return item
