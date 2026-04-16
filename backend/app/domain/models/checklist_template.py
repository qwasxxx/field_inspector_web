"""Checklist templates created in the web constructor."""

from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.models.base import Base


class ChecklistTemplate(Base):
    """Reusable checklist template (конструктор)."""

    __tablename__ = "checklist_templates"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(512))

    items: Mapped[list["ChecklistTemplateItem"]] = relationship(
        back_populates="template",
        order_by="ChecklistTemplateItem.sort_order",
        cascade="all, delete-orphan",
    )


class ChecklistTemplateItem(Base):
    """Single field in a template."""

    __tablename__ = "checklist_template_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    template_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("checklist_templates.id", ondelete="CASCADE"),
        index=True,
    )
    label: Mapped[str] = mapped_column(String(1024))
    type: Mapped[str] = mapped_column(String(16))
    required: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    template: Mapped["ChecklistTemplate"] = relationship(back_populates="items")
