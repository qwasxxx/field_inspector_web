"""Создание worker: auth.users через Admin API + строка в public.profiles (service role, только на сервере)."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.domain.errors import AppException
from app.domain.schemas.supabase_workers import CreateSupabaseWorkerRequest

logger = logging.getLogger(__name__)


def _require_supabase_config(settings: Settings) -> tuple[str, str, str]:
    base = (settings.supabase_url or "").strip().rstrip("/")
    anon = (settings.supabase_anon_key or "").strip()
    service = (settings.supabase_service_role_key or "").strip()
    if not base or not anon or not service:
        raise AppException(
            503,
            "Сервер не настроен для создания обходчиков: задайте SUPABASE_URL, "
            "SUPABASE_ANON_KEY и SUPABASE_SERVICE_ROLE_KEY в окружении бэкенда.",
        )
    return base, anon, service


async def _auth_get_user(base: str, anon: str, access_token: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(
            f"{base}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "apikey": anon,
            },
        )
        if r.status_code != 200:
            if logger.isEnabledFor(logging.DEBUG):
                logger.debug("auth/v1/user failed %s %s", r.status_code, r.text)
            raise AppException(401, "Недействительная или просроченная сессия Supabase.")
        return r.json()


async def _rest_fetch_profile_row(
    base: str,
    anon: str,
    access_token: str,
    user_id: str,
) -> dict[str, Any] | None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(
            f"{base}/rest/v1/profiles",
            params={"id": f"eq.{user_id}", "select": "role,is_active"},
            headers={
                "Authorization": f"Bearer {access_token}",
                "apikey": anon,
            },
        )
        if r.status_code != 200:
            logger.error("profiles select failed %s %s", r.status_code, r.text)
            raise AppException(403, "Не удалось проверить права администратора.")
        rows = r.json()
        if isinstance(rows, list) and rows:
            return rows[0]
        return None


async def _admin_create_user(
    base: str,
    service: str,
    email: str,
    password: str,
) -> str:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{base}/auth/v1/admin/users",
            headers={
                "Authorization": f"Bearer {service}",
                "apikey": service,
                "Content-Type": "application/json",
            },
            json={
                "email": email,
                "password": password,
                "email_confirm": True,
            },
        )
        body: Any = None
        try:
            body = r.json()
        except Exception:  # noqa: BLE001
            body = None

        if r.status_code not in (200, 201):
            text = r.text or ""
            msg = ""
            if isinstance(body, dict):
                msg = str(body.get("msg") or body.get("message") or body.get("error_description") or "")
            low = f"{msg} {text}".lower()
            logger.error(
                "admin create user failed status=%s body=%s",
                r.status_code,
                text[:500],
            )
            if "already been registered" in low or "already exists" in low or r.status_code == 422:
                raise AppException(400, "Пользователь с таким email уже зарегистрирован.")
            raise AppException(
                502,
                f"Создание учётной записи в Supabase Auth не удалось (код {r.status_code}).",
            )

        if not isinstance(body, dict):
            raise AppException(502, "Неожиданный ответ Supabase при создании пользователя.")

        uid = body.get("id")
        if not uid and isinstance(body.get("user"), dict):
            uid = body["user"].get("id")
        if not uid:
            raise AppException(502, "Supabase не вернул id нового пользователя.")
        return str(uid)


async def _admin_delete_user(base: str, service: str, user_id: str) -> None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.delete(
            f"{base}/auth/v1/admin/users/{user_id}",
            headers={
                "Authorization": f"Bearer {service}",
                "apikey": service,
            },
        )
        if r.status_code not in (200, 204):
            logger.error(
                "rollback: delete auth user failed %s %s for %s",
                r.status_code,
                r.text[:300],
                user_id,
            )


async def _rest_insert_profile(
    base: str,
    service: str,
    user_id: str,
    body: CreateSupabaseWorkerRequest,
) -> None:
    payload = {
        "id": user_id,
        "full_name": body.full_name.strip(),
        "username": body.username.strip(),
        "employee_code": body.employee_code.strip(),
        "role": "worker",
        "is_active": body.is_active,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{base}/rest/v1/profiles",
            headers={
                "Authorization": f"Bearer {service}",
                "apikey": service,
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            json=payload,
        )
        if r.status_code in (200, 201):
            return

        err_body: Any = None
        try:
            err_body = r.json()
        except Exception:  # noqa: BLE001
            err_body = None

        details = ""
        code = ""
        if isinstance(err_body, dict):
            details = str(err_body.get("details") or "")
            code = str(err_body.get("code") or "")

        low = details.lower()
        logger.error(
            "profiles insert failed status=%s code=%s details=%s",
            r.status_code,
            code,
            details[:500],
        )

        if code == "23505" or "unique" in low:
            if "username" in low or "(username)" in low:
                raise AppException(400, "Логин (username) уже занят.")
            if "employee_code" in low or "(employee_code)" in low:
                raise AppException(400, "Код сотрудника уже занят.")
            raise AppException(400, "Нарушение уникальности данных (профиль).")

        raise AppException(
            502,
            f"Запись профиля не создана: {details or r.text or r.status_code}",
        )


async def create_worker_as_supabase_admin(
    access_token: str,
    body: CreateSupabaseWorkerRequest,
) -> str:
    """
    Проверить JWT админа (через anon + RLS), затем создать auth user и profiles (service role).
    """

    settings = get_settings()
    base, anon, service = _require_supabase_config(settings)

    auth_user = await _auth_get_user(base, anon, access_token)
    uid = str(auth_user.get("id") or "")
    if not uid:
        raise AppException(401, "Не удалось определить пользователя Supabase.")

    prof = await _rest_fetch_profile_row(base, anon, access_token, uid)
    if not prof:
        raise AppException(403, "Профиль администратора не найден.")
    if str(prof.get("role") or "") != "admin":
        raise AppException(403, "Только администратор может создавать обходчиков.")
    if prof.get("is_active") is False:
        raise AppException(403, "Учётная запись администратора неактивна.")

    new_id = await _admin_create_user(
        base,
        service,
        email=str(body.email),
        password=body.password,
    )
    try:
        await _rest_insert_profile(base, service, new_id, body)
    except AppException:
        await _admin_delete_user(base, service, new_id)
        raise
    except Exception as exc:
        await _admin_delete_user(base, service, new_id)
        logger.exception("Неожиданная ошибка при вставке profiles после создания auth user")
        raise AppException(
            500,
            "Внутренняя ошибка при создании профиля; учётная запись в Auth отменена.",
        ) from exc

    return new_id
