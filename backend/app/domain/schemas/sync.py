"""Sync ingestion schemas."""

from typing import Any

from pydantic import BaseModel, Field


class SyncQueueItemCreate(BaseModel):
    """Single item from client queue."""

    id: str | None = None
    kind: str = Field(pattern="^(checkpoint_complete|reading|photo_mock)$")
    payload: dict[str, Any]


class SyncIngestRequest(BaseModel):
    """Batch ingest."""

    items: list[SyncQueueItemCreate]
