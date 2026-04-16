"""Inspection route, checkpoints, and embedded checklist items."""

from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.models.base import Base


class InspectionRoute(Base):
    """Planned inspection route (маршрут обхода)."""

    __tablename__ = "inspection_routes"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    name: Mapped[str] = mapped_column(String(512))

    checkpoints: Mapped[list["Checkpoint"]] = relationship(
        back_populates="route",
        order_by="Checkpoint.sort_order",
        cascade="all, delete-orphan",
    )


class Checkpoint(Base):
    """Single stop on a route."""

    __tablename__ = "checkpoints"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    route_id: Mapped[str] = mapped_column(
        String(128),
        ForeignKey("inspection_routes.id", ondelete="CASCADE"),
        index=True,
    )
    equipment_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("equipment.id", ondelete="RESTRICT"),
        index=True,
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    route: Mapped["InspectionRoute"] = relationship(back_populates="checkpoints")
    equipment: Mapped["Equipment"] = relationship(back_populates="checkpoints")
    checklist_items: Mapped[list["CheckpointChecklistItem"]] = relationship(
        back_populates="checkpoint",
        order_by="CheckpointChecklistItem.sort_order",
        cascade="all, delete-orphan",
    )


class CheckpointChecklistItem(Base):
    """Checklist field definition at a checkpoint (execution types)."""

    __tablename__ = "checkpoint_checklist_items"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    checkpoint_id: Mapped[str] = mapped_column(
        String(128),
        ForeignKey("checkpoints.id", ondelete="CASCADE"),
        index=True,
    )
    label: Mapped[str] = mapped_column(String(1024))
    type: Mapped[str] = mapped_column(String(16))
    required: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    checkpoint: Mapped["Checkpoint"] = relationship(back_populates="checklist_items")
