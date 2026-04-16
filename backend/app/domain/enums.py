"""Domain enumerations."""

from enum import Enum


class UserRole(str, Enum):
    """User roles aligned with «Мобильный офис»."""

    SUPERVISOR = "supervisor"
    INSPECTOR = "inspector"


class CheckpointChecklistType(str, Enum):
    """Checklist item types on a route checkpoint (execution)."""

    BOOLEAN = "boolean"
    NUMBER = "number"
    TEXT = "text"


class TemplateFieldType(str, Enum):
    """Constructor template field types (map checkbox → boolean when executing)."""

    TEXT = "text"
    NUMBER = "number"
    CHECKBOX = "checkbox"


class SyncQueueKind(str, Enum):
    """Sync queue payload kinds from clients."""

    CHECKPOINT_COMPLETE = "checkpoint_complete"
    READING = "reading"
    PHOTO_MOCK = "photo_mock"


class EmployeeShiftStatus(str, Enum):
    """Employee status on shift (dashboard)."""

    IN_WORK = "in_work"
    DEFECT = "defect"
    OFFLINE = "offline"
    BREAK = "break"


class ShiftEventType(str, Enum):
    """Dashboard shift event types."""

    DEFECT_CRITICAL = "defect_critical"
    INSPECTION_DONE = "inspection_done"
    DEVIATION = "deviation"
    SHIFT_START = "shift_start"
    SYNC = "sync"
