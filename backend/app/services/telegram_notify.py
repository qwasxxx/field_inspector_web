"""Форматирование и отправка срочных уведомлений в Telegram (вебхук Supabase → FastAPI)."""

from __future__ import annotations

import html
from typing import Any

import httpx

from app.core.config import Settings

_HIGH_DEFECT_PRIORITIES = frozenset(
    {
        "high",
        "critical",
        "urgent",
        "высокий",
        "критический",
        "срочно",
    }
)


def _norm_priority(value: Any) -> str:
    if value is None or not isinstance(value, str):
        return ""
    return value.strip().lower()


def is_urgent_inspection_report(record: dict[str, Any]) -> bool:
    defect_found = record.get("defect_found") is True
    pr = _norm_priority(record.get("defect_priority"))
    high_priority = pr != "" and pr in _HIGH_DEFECT_PRIORITIES
    return defect_found or high_priority


def is_urgent_task_request(record: dict[str, Any], notify_medium: bool) -> bool:
    pr = _norm_priority(record.get("priority"))
    if pr == "high":
        return True
    if notify_medium and pr == "medium":
        return True
    return False


def _truncate(s: str, max_len: int) -> str:
    if len(s) <= max_len:
        return s
    return s[: max_len - 1] + "…"


def format_report_message(record: dict[str, Any]) -> str:
    rid = html.escape(str(record.get("id") or "—"))
    task_id = html.escape(str(record.get("task_id") or "—"))
    equip_id = html.escape(str(record.get("equipment_id") or "—"))
    comment = record.get("comment_text") if isinstance(record.get("comment_text"), str) else ""
    defect_desc = (
        record.get("defect_description")
        if isinstance(record.get("defect_description"), str)
        else ""
    )
    defect_priority = html.escape(str(record.get("defect_priority") or "—"))
    defect_found = record.get("defect_found") is True

    lines = [
        "🚨 <b>Field Inspector — отчёт с дефектом / срочно</b>",
        "",
        f"<b>Отчёт:</b> <code>{rid}</code>",
        f"<b>Задание:</b> <code>{task_id}</code>",
        f"<b>Позиция маршрута:</b> <code>{equip_id}</code>",
        f"<b>Дефект зафиксирован:</b> {'да' if defect_found else 'нет'}",
        f"<b>Приоритет дефекта:</b> {defect_priority}",
    ]
    if defect_desc:
        lines.extend(
            ("", "<b>Описание дефекта:</b>", html.escape(_truncate(defect_desc, 1200)))
        )
    if comment:
        lines.extend(("", "<b>Комментарий:</b>", html.escape(_truncate(comment, 800))))
    return "\n".join(lines)


def format_task_request_message(record: dict[str, Any]) -> str:
    rid = html.escape(str(record.get("id") or "—"))
    title = record.get("title") if isinstance(record.get("title"), str) else "—"
    description = record.get("description") if isinstance(record.get("description"), str) else ""
    priority = html.escape(str(record.get("priority") or "—"))
    site = record.get("site_name") if isinstance(record.get("site_name"), str) else ""
    area = record.get("area_name") if isinstance(record.get("area_name"), str) else ""

    lines = [
        "📋 <b>Field Inspector — заявка обходчика</b>",
        "",
        f"<b>ID:</b> <code>{rid}</code>",
        f"<b>Тема:</b> {html.escape(_truncate(title, 500))}",
        f"<b>Приоритет:</b> {priority}",
    ]
    if site:
        lines.append(f"<b>Площадка:</b> {html.escape(site)}")
    if area:
        lines.append(f"<b>Участок:</b> {html.escape(area)}")
    if description:
        lines.extend(("", "<b>Описание:</b>", html.escape(_truncate(description, 1500))))
    return "\n".join(lines)


def telegram_is_configured(settings: Settings) -> bool:
    return bool(settings.telegram_bot_token.strip() and settings.telegram_chat_ids.strip())


async def send_telegram_broadcast(settings: Settings, text: str) -> list[dict[str, Any]]:
    token = settings.telegram_bot_token.strip()
    chat_ids = [c.strip() for c in settings.telegram_chat_ids.split(",") if c.strip()]
    if not token or not chat_ids:
        return []

    payload_text = _truncate(text, 4000)
    results: list[dict[str, Any]] = []
    async with httpx.AsyncClient(timeout=20.0) as client:
        for chat_id in chat_ids:
            resp = await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": payload_text,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                },
            )
            results.append(
                {
                    "chat_id": chat_id,
                    "ok": resp.is_success,
                    "status_code": resp.status_code,
                }
            )
    return results
