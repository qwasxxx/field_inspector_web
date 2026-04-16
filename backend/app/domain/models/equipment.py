"""Equipment ORM model."""

from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.models.base import Base


class Equipment(Base):
    """Equipment registry entry (НСИ / справочник)."""

    __tablename__ = "equipment"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(512))
    designation: Mapped[str | None] = mapped_column(String(256), nullable=True)

    checkpoints: Mapped[list["Checkpoint"]] = relationship(
        back_populates="equipment",
    )
