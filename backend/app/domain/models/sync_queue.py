"""Persisted sync queue items from mobile / web demo clients."""

from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.models.base import Base


class SyncQueueItem(Base):
    """Inbound sync payload."""

    __tablename__ = "sync_queue_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    kind: Mapped[str] = mapped_column(String(32))
    payload: Mapped[dict] = mapped_column(JSON)
    received_from_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
