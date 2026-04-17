"""Админ-операции Supabase: создание обходчика (auth + profiles) на сервере."""

from fastapi import APIRouter, Header

from app.domain.errors import AppException
from app.domain.schemas.supabase_workers import (
    CreateSupabaseWorkerRequest,
    CreateSupabaseWorkerResponse,
)
from app.services.supabase_worker_admin_service import create_worker_as_supabase_admin

router = APIRouter(prefix="/admin/supabase", tags=["admin-supabase"])


@router.post("/workers", response_model=CreateSupabaseWorkerResponse)
async def create_worker(
    body: CreateSupabaseWorkerRequest,
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> CreateSupabaseWorkerResponse:
    """
    Создать реального пользователя Supabase Auth и строку public.profiles (role=worker).

    Клиент передаёт **тот же** Bearer access_token, что и для Supabase (не JWT FastAPI).
    """

    if not authorization or not authorization.lower().startswith("bearer "):
        raise AppException(401, "Нужен заголовок Authorization: Bearer <access_token Supabase>.")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise AppException(401, "Пустой токен в заголовке Authorization.")

    new_id = await create_worker_as_supabase_admin(token, body)
    return CreateSupabaseWorkerResponse(id=new_id)
