# 📘 Стандарты написания кода — Backend (Python)

Стандарты и правила написания кода для backend-сервиса на Python (FastAPI / async architecture / PostgreSQL).

---

# 📑 Содержание

* Архитектурные принципы
* Структура проекта
* API слой (Router)
* Service слой (Business Logic)
* Repository слой (Data Access)
* Domain слой
* Обработка ошибок
* Работа с данными
* Работа с БД (SQLAlchemy / SQL)
* Naming conventions
* Типизация
* Логирование
* Документация

---

# 🧠 Архитектурные принципы

## Clean Architecture (слоёная архитектура)

Проект следует Clean Architecture:

┌──────────────────────────────────────────────┐
│  main.py (entrypoint / FastAPI app)         │
├──────────────────────────────────────────────┤
│  API слой (routers/)                        │  ← только HTTP
├──────────────────────────────────────────────┤
│  Service слой (services/)                   │  ← бизнес-логика
├──────────────────────────────────────────────┤
│  Repository слой (repositories/)           │  ← доступ к данным
├──────────────────────────────────────────────┤
│  Domain слой (models / schemas / enums)    │  ← типы и доменная модель
└──────────────────────────────────────────────┘
---

## 📌 Single Responsibility Principle (SRP)

Каждый слой отвечает только за свою задачу:

### ✅ Правильно (Router слой)

@router.get("/users")
async def get_users(service: UserService = Depends()):
    return await service.get_users()
### ❌ Неправильно (бизнес-логика в API)

@router.get("/users")
async def get_users(db: Session = Depends()):
    return db.query(User).all()
---

## 📌 Dependency Inversion Principle (DIP)

Зависимости через интерфейсы / Protocol:

class IUserRepository(Protocol):
    async def get_users(self) -> list[User]: ...
---

# 📁 Структура проекта

app/
├── main.py
├── api/
│   ├── routers/
│   │   ├── users.py
│   │   ├── checklists.py
│   │   └── auth.py
│
├── services/
│   ├── user_service.py
│   ├── checklist_service.py
│   └── auth_service.py
│
├── repositories/
│   ├── user_repo.py
│   ├── checklist_repo.py
│   └── base_repo.py
│
├── domain/
│   ├── models/
│   ├── schemas/
│   ├── enums.py
│   └── errors.py
│
├── core/
│   ├── config.py
│   ├── database.py
│   ├── exceptions.py
│   └── logging.py
│
└── shared/
    ├── utils.py
    ├── security.py
    └── dependencies.py
---

# 🌐 API слой (routers)

## 📌 Правила:

* Только HTTP слой
* Только вызов service
* Никакой логики
* Никаких SQL запросов

---

## Пример:

from fastapi import APIRouter, Depends
from app.services.user_service import UserService

router = APIRouter()

@router.get("/users")
async def get_users(service: UserService = Depends()):
    try:
        return await service.get_users()
    except Exception as e:
        raise e
---

# 🧠 Service слой (business logic)

## 📌 Ответственность:

* бизнес-логика
* валидация
* orchestration
* вызов repository

---

## Пример:

class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    async def get_users(self):
        users = await self.repo.get_users()

        if not users:
            return []

        return [self._map_user(u) for u in users]

    def _map_user(self, user):
        return {
            "id": str(user.id),
            "name": user.name
        }
---

# 🗄 Repository слой

## 📌 Ответственность:

* только доступ к БД
* SQLAlchemy / raw SQL
* никаких бизнес-правил

---

## Пример:

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_users(self):
        result = await self.db.execute(
            select(User)
        )
        return result.scalars().all()
---

# 🧩 Domain слой

## 📌 Содержит:

* Pydantic схемы
* enums
* dataclasses
* ошибки

---

## Schema пример:

```python
from pydantic import BaseModel
class UserDTO(BaseModel):
    id: str
    name: str
---

## Enum пример:

```python
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
---

# ❗ Обработка ошибок

## 📌 Базовый стандарт

class AppException(Exception):
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
---

## FastAPI handler

@app.exception_handler(AppException)
async def app_exception_handler(request, exc: AppException):
    return JSONResponse(
        status_code=exc.code,
        content={"error": exc.message}
    )
---

# 📦 Работа с данными

## 📌 Pydantic входные данные

class UserCreateRequest(BaseModel):
    name: str
    email: str
---

## 📌 Валидация

* всегда через Pydantic
* без ручных if в router

---

# 🗄 Работа с SQL

## 📌 SQLAlchemy стиль

select(User).where(User.id == user_id)
---

## 📌 Правила:

* нет raw SQL без необходимости
* если raw SQL → только repository слой
* всегда параметризованные запросы

---

# 🧾 Naming conventions

## 📌 Функции

async def get_users()
async def create_user()
async def delete_user()
---

## 📌 Файлы

user_router.py
user_service.py
user_repository.py
auth_service.py
---

## 📌 Переменные

users: list[User]
user_id: str
is_active: bool
---

# 🧪 Типизация

## 📌 Обязательно:

* Python 3.10+
* strict typing

---

from typing import List, Optional
---

## ❌ нельзя:

def get_users():
---

## ✅ правильно:

async def get_users() -> List[UserDTO]:
---

# 🧾 Логирование

## 📌 Стандарт:

import logging

logger = logging.getLogger(__name__)
---

## Использование:

logger.info("User created")
logger.error("Database error", exc_info=True)
---

# 📚 Документация

## 📌 FastAPI auto docs

* OpenAPI включён по умолчанию
* /docs обязателен

---

## 📌 Docstring стандарт

async def get_users() -> list[UserDTO]:
    """
    Получение списка пользователей.

    Returns:
        list[UserDTO]: список пользователей
    """
---

# 🧱 Чеклист перед коммитом

* Следую Clean Architecture (router → service → repository)
* Нет бизнес-логики в router
* Нет SQL в service
* Используется типизация (mypy compatible)
* Используются Pydantic схемы
* Обработка ошибок через exceptions
* Есть логирование
* Все async функции помечены async
* Repository слой изолирован
* Нет циклических импортов
* Есть docstrings

---

# 🚀 Итог

Проект должен быть:

* модульным
* типизированным
* расширяемым
* тестируемым
* строго разделённым по слоям
