"""Схемы для создания обходчика через Supabase Admin API."""

from pydantic import BaseModel, EmailStr, Field


class CreateSupabaseWorkerRequest(BaseModel):
    """Тело запроса: данные профиля и учётной записи."""

    full_name: str = Field(..., min_length=1, max_length=500)
    username: str = Field(..., min_length=1, max_length=200)
    employee_code: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=200)
    is_active: bool = True


class CreateSupabaseWorkerResponse(BaseModel):
    """Ответ: id нового пользователя (совпадает с auth.users и profiles)."""

    id: str
