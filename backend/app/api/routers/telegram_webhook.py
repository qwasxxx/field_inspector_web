"""Входящий вебхук от Supabase Database Webhook → Telegram."""

from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, ConfigDict

from app.core.config import get_settings
from app.services import telegram_notify as tg

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


class SupabaseDbWebhookBody(BaseModel):
    """Тело Database Webhook Supabase (INSERT и др.)."""

    model_config = ConfigDict(extra="ignore")

    type: str | None = None
    table: str | None = None
    record: dict[str, Any] | None = None


@router.post("/supabase-db")
async def supabase_database_webhook(
    body: SupabaseDbWebhookBody,
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    """
    Принимает событие БД от Supabase и при срочных условиях шлёт сообщение в Telegram.

    Секрет (опционально): задайте TELEGRAM_WEBHOOK_SECRET в backend/.env и передайте тот же
    строку в заголовке X-Webhook-Secret или Authorization: Bearer <секрет>.
    """

    settings = get_settings()
    expected = (settings.telegram_webhook_secret or "").strip()
    if expected:
        bearer: str | None = None
        if authorization and authorization.startswith("Bearer "):
            bearer = authorization[7:].strip()
        got = (x_webhook_secret or "").strip() or (bearer or "")
        if got != expected:
            raise HTTPException(status_code=401, detail="Invalid webhook secret")

    if not tg.telegram_is_configured(settings):
        return {"notified": False, "reason": "telegram_not_configured"}

    event = (body.type or "").upper()
    if event != "INSERT" or not body.record:
        return {"notified": False, "reason": "not_insert_or_no_record"}

    table = body.table or ""
    record = body.record
    notify_medium = settings.telegram_notify_task_request_medium

    message: str | None = None
    if table == "inspection_reports" and tg.is_urgent_inspection_report(record):
        message = tg.format_report_message(record)
    elif table == "inspection_task_requests" and tg.is_urgent_task_request(
        record, notify_medium
    ):
        message = tg.format_task_request_message(record)

    if not message:
        return {"notified": False, "reason": "not_urgent_or_unknown_table"}

    results = await tg.send_telegram_broadcast(settings, message)
    all_ok = all(r.get("ok") for r in results) if results else False
    if not all_ok:
        raise HTTPException(
            status_code=502,
            detail={"message": "telegram_send_failed", "results": results},
        )
    return {"notified": True, "results": results}
