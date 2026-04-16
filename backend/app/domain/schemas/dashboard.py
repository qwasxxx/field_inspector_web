"""Dashboard bundle DTOs."""

from pydantic import BaseModel, ConfigDict, Field


class ShiftContextDto(BaseModel):
    """Header context for supervisor dashboard."""

    model_config = ConfigDict(populate_by_name=True)

    shift_number: str = Field(serialization_alias="shiftNumber")
    date_label: str = Field(serialization_alias="dateLabel")
    site_label: str = Field(serialization_alias="siteLabel")
    online_current: int = Field(serialization_alias="onlineCurrent")
    online_total: int = Field(serialization_alias="onlineTotal")


class DashboardMetricDto(BaseModel):
    """KPI card."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    value: str
    caption: str


class DashboardEmployeeDto(BaseModel):
    """Shift roster row."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    initials: str
    status: str
    status_label: str = Field(serialization_alias="statusLabel")
    location_hint: str = Field(serialization_alias="locationHint")


class ShiftEventDto(BaseModel):
    """Timeline row."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    time: str
    title: str
    detail: str
    type: str


class ShiftProgressItemDto(BaseModel):
    """Object progress per inspector."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    current: int
    total: int


class CriticalDefectAlertDto(BaseModel):
    """Critical banner."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    message: str
    time: str
    object_ref: str = Field(serialization_alias="objectRef")


class DashboardBundleDto(BaseModel):
    """Full dashboard snapshot for the web panel."""

    model_config = ConfigDict(populate_by_name=True)

    shift_context: ShiftContextDto = Field(serialization_alias="shiftContext")
    metrics: list[DashboardMetricDto]
    employees: list[DashboardEmployeeDto]
    events: list[ShiftEventDto]
    progress: list[ShiftProgressItemDto]
    critical_alert: CriticalDefectAlertDto | None = Field(
        serialization_alias="criticalAlert",
    )
