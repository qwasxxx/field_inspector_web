"""Dashboard snapshot tables (supervisor overview)."""

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.models.base import Base


class DashboardShiftContext(Base):
    """Single-row context for the current shift header."""

    __tablename__ = "dashboard_shift_context"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    shift_number: Mapped[str] = mapped_column(String(32))
    date_label: Mapped[str] = mapped_column(String(256))
    site_label: Mapped[str] = mapped_column(String(512))
    online_current: Mapped[int] = mapped_column(Integer)
    online_total: Mapped[int] = mapped_column(Integer)


class DashboardMetricRow(Base):
    """KPI card on the dashboard."""

    __tablename__ = "dashboard_metrics"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(256))
    value: Mapped[str] = mapped_column(String(64))
    caption: Mapped[str] = mapped_column(String(256))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class DashboardEmployeeRow(Base):
    """Employee row in the shift column."""

    __tablename__ = "dashboard_employees"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(256))
    initials: Mapped[str] = mapped_column(String(8))
    status: Mapped[str] = mapped_column(String(32))
    status_label: Mapped[str] = mapped_column(String(64))
    location_hint: Mapped[str] = mapped_column(String(256))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class DashboardShiftEventRow(Base):
    """Timeline event."""

    __tablename__ = "dashboard_shift_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    time: Mapped[str] = mapped_column(String(16))
    title: Mapped[str] = mapped_column(String(256))
    detail: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(32))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class DashboardShiftProgressRow(Base):
    """Per-inspector object progress."""

    __tablename__ = "dashboard_shift_progress"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(256))
    current: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class DashboardCriticalAlertRow(Base):
    """Critical defect banner."""

    __tablename__ = "dashboard_critical_alerts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    message: Mapped[str] = mapped_column(Text)
    time: Mapped[str] = mapped_column(String(16))
    object_ref: Mapped[str] = mapped_column(String(128))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
