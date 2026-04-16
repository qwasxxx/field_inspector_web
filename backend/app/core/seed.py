"""Idempotent database seed (demo data + default supervisor)."""

import logging
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.domain.enums import UserRole
from app.domain.models import (
    Checkpoint,
    CheckpointChecklistItem,
    DashboardCriticalAlertRow,
    DashboardEmployeeRow,
    DashboardMetricRow,
    DashboardShiftContext,
    DashboardShiftEventRow,
    DashboardShiftProgressRow,
    Equipment,
    InspectionRoute,
    User,
)
from app.shared.security import hash_password

logger = logging.getLogger(__name__)


async def run_seed(session: AsyncSession) -> None:
    """
    Seed the database once (skips when a user already exists).

    Args:
        session: Open async SQLAlchemy session.
    """

    settings = get_settings()
    count = await session.scalar(select(func.count(User.id)))
    if count and count > 0:
        logger.info("Seed skipped: database already initialized")
        return

    logger.info("Running initial seed")

    admin = User(
        email=settings.seed_admin_email.lower(),
        hashed_password=hash_password(settings.seed_admin_password),
        role=UserRole.SUPERVISOR.value,
    )
    session.add(admin)

    equipment_rows = [
        Equipment(
            id="eq-tr-01",
            name="Трансформатор Т-1",
            designation="ТМГ-6300/10",
        ),
        Equipment(
            id="eq-tr-02",
            name="Трансформатор Т-2",
            designation="ТМГ-6300/10",
        ),
        Equipment(
            id="eq-sw-01",
            name="Ячейка РУ-10 кВ, секция А",
            designation="КРУЭ-10",
        ),
    ]
    session.add_all(equipment_rows)

    route_main = InspectionRoute(
        id="route-main-transformers",
        name="Главный трансформаторный блок",
    )
    cp1 = Checkpoint(
        id="cp-t1",
        route=route_main,
        equipment_id="eq-tr-01",
        sort_order=0,
    )
    cp1.checklist_items.extend(
        [
            CheckpointChecklistItem(
                id="cl-t1-1",
                label="Визуально: нет подтёков масла",
                type="boolean",
                required=True,
                sort_order=0,
            ),
            CheckpointChecklistItem(
                id="cl-t1-2",
                label="Температура верхнего слоя масла, °C",
                type="number",
                required=True,
                sort_order=1,
            ),
            CheckpointChecklistItem(
                id="cl-t1-3",
                label="Комментарий по дефектам",
                type="text",
                required=True,
                sort_order=2,
            ),
        ],
    )
    cp2 = Checkpoint(
        id="cp-t2",
        route=route_main,
        equipment_id="eq-tr-02",
        sort_order=1,
    )
    cp2.checklist_items.extend(
        [
            CheckpointChecklistItem(
                id="cl-t2-1",
                label="Шум/вибрация в норме",
                type="boolean",
                required=True,
                sort_order=0,
            ),
            CheckpointChecklistItem(
                id="cl-t2-2",
                label="Показание счётчика обходов",
                type="number",
                required=True,
                sort_order=1,
            ),
        ],
    )
    route_main.checkpoints.extend([cp1, cp2])

    route_sw = InspectionRoute(
        id="route-switchgear",
        name="РУ-10 кВ распределительное",
    )
    cp_sg = Checkpoint(
        id="cp-sg1",
        route=route_sw,
        equipment_id="eq-sw-01",
        sort_order=0,
    )
    cp_sg.checklist_items.extend(
        [
            CheckpointChecklistItem(
                id="cl-sg1-1",
                label="Индикация положения разъединителей",
                type="boolean",
                required=True,
                sort_order=0,
            ),
            CheckpointChecklistItem(
                id="cl-sg1-2",
                label="Замечания по изоляторам",
                type="text",
                required=True,
                sort_order=1,
            ),
        ],
    )
    route_sw.checkpoints.append(cp_sg)

    session.add_all([route_main, route_sw])

    session.add(
        DashboardShiftContext(
            shift_number="482",
            date_label="Сегодня, 16 апреля 2026",
            site_label="Энергоцех №3, площадка Томинская",
            online_current=4,
            online_total=5,
        ),
    )

    metrics = [
        DashboardMetricRow(
            id="m1",
            title="Выполнено объектов",
            value="18 / 26",
            caption="69% смены",
            sort_order=0,
        ),
        DashboardMetricRow(
            id="m2",
            title="Активных обходчиков",
            value="4",
            caption="1 на связи нет 12 мин",
            sort_order=1,
        ),
        DashboardMetricRow(
            id="m3",
            title="Дефектов за смену",
            value="3",
            caption="1 критический",
            sort_order=2,
        ),
        DashboardMetricRow(
            id="m4",
            title="Ср. время на объект",
            value="14 мин",
            caption="норма: 12 мин",
            sort_order=3,
        ),
    ]
    session.add_all(metrics)

    employees = [
        DashboardEmployeeRow(
            id="e1",
            name="Петров Д.О.",
            initials="ПД",
            status="defect",
            status_label="Дефект",
            location_hint="Э-114 · 14:28",
            sort_order=0,
        ),
        DashboardEmployeeRow(
            id="e2",
            name="Котов А.В.",
            initials="КА",
            status="in_work",
            status_label="В работе",
            location_hint="Э-109",
            sort_order=1,
        ),
        DashboardEmployeeRow(
            id="e3",
            name="Михайлов И.С.",
            initials="МИ",
            status="in_work",
            status_label="В работе",
            location_hint="Насосная",
            sort_order=2,
        ),
        DashboardEmployeeRow(
            id="e4",
            name="Сидоров П.К.",
            initials="СП",
            status="offline",
            status_label="Нет связи",
            location_hint="12 мин",
            sort_order=3,
        ),
        DashboardEmployeeRow(
            id="e5",
            name="Орлов В.Н.",
            initials="ОВ",
            status="break",
            status_label="Перерыв",
            location_hint="Столовая",
            sort_order=4,
        ),
    ]
    session.add_all(employees)

    events = [
        DashboardShiftEventRow(
            id="ev1",
            time="14:32",
            title="Критический дефект",
            detail=(
                "Трансформатор ТМ-630 (обходчик: Петров Д.О., фото прикреплено)."
            ),
            type="defect_critical",
            sort_order=0,
        ),
        DashboardShiftEventRow(
            id="ev2",
            time="13:58",
            title="Обход завершён",
            detail="Объект Э-109 (Котов А.В., 11 параметров в норме).",
            type="inspection_done",
            sort_order=1,
        ),
        DashboardShiftEventRow(
            id="ev3",
            time="13:41",
            title="Отклонение давления",
            detail="Насос НС-4 (Михайлов И.С., 4.8 атм, норма 5.2).",
            type="deviation",
            sort_order=2,
        ),
        DashboardShiftEventRow(
            id="ev4",
            time="13:20",
            title="Смена начата",
            detail="5 сотрудников, 26 объектов.",
            type="shift_start",
            sort_order=3,
        ),
        DashboardShiftEventRow(
            id="ev5",
            time="13:18",
            title="Синхронизация устройств",
            detail="Офлайн-данные выгружены.",
            type="sync",
            sort_order=4,
        ),
    ]
    session.add_all(events)

    progress = [
        DashboardShiftProgressRow(
            id="p1",
            name="Котов А.В.",
            current=6,
            total=8,
            sort_order=0,
        ),
        DashboardShiftProgressRow(
            id="p2",
            name="Петров Д.О.",
            current=5,
            total=8,
            sort_order=1,
        ),
        DashboardShiftProgressRow(
            id="p3",
            name="Михайлов И.С.",
            current=3,
            total=6,
            sort_order=2,
        ),
        DashboardShiftProgressRow(
            id="p4",
            name="Сидоров П.К.",
            current=2,
            total=6,
            sort_order=3,
        ),
    ]
    session.add_all(progress)

    session.add(
        DashboardCriticalAlertRow(
            id="alert-1",
            message=(
                "Критический дефект: Трансформатор ТМ-630, объект Э-114 — "
                "перегрев обмотки."
            ),
            time="14:32",
            object_ref="Э-114",
            sort_order=0,
        ),
    )

    await session.commit()
    logger.info("Seed completed")
