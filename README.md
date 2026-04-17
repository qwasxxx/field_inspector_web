# field_inspector_web

Монорепозиторий экосистемы **Field Inspector**: веб-панель администратора (`frontend/`), сервис на **FastAPI** (`backend/`), опционально **Supabase** (Postgres + Auth) и мобильный клиент на **Flutter** (`mobile/`). Данные и механизмы входа **полностью не унифицированы**; перед развёртыванием прочитайте разделы **7. Режимы аутентификации** и **9. Известные ограничения**.

---

## 1. Обзор проекта

| Компонент | Назначение |
|-----------|------------|
| **Веб-админка (`frontend/`)** | Интерфейс руководителя: дашборд (при использовании API), демо маршрутов, конструктор шаблонов чек-листов, обходчики/задания/заявки через Supabase при настроенных переменных. |
| **API (`backend/`)** | REST API под `/api/v1/*`: авторизация, снимок дашборда, маршруты обходов, оборудование, шаблоны чек-листов, приём sync. По умолчанию **SQLite**, защищённые маршруты — **JWT**. |
| **Supabase** | Postgres + Supabase Auth для `profiles`, таблиц заданий и связанных сценариев веб-панели. |
| **Мобильное (`mobile/`)** | Приложение Flutter для полевых сотрудников; тот же проект **Supabase** для заданий и связанных данных (см. `mobile/README.md` и `mobile/docs/`). |

---

## 2. Архитектура (схема)

```
                    +------------------+
                    |   Браузер        |
                    |   (React SPA)    |
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |                                       |
         v                                       v
+-------------------+                 +------------------------+
| Supabase          |                 | FastAPI + SQLite       |
| Postgres + Auth   |                 | JWT в Authorization    |
| (profiles, tasks, |                 | /api/v1/dashboard      |
|  task_requests,   |                 | /api/v1/routes и др.  |
|  …)               |                 +------------------------+
+-------------------+
         ^
         |
+-------------------+
| Мобильный Flutter |
| (тот же Supabase) |
+-------------------+
```

Веб-приложение может одновременно обращаться и к **Supabase**, и к базовому URL **FastAPI**. Это **разные базы данных и разные модели идентичности**, пока вы явно не согласуете их.

---

## 3. Структура репозитория

```
field_inspector_web/
├── frontend/          # Vite + React + TypeScript + MUI
├── backend/           # FastAPI, SQLAlchemy async, SQLite по умолчанию
├── mobile/            # Flutter (Dart)
├── supabase/          # SQL-миграции для Supabase (применять в своём проекте)
└── README.md
```

---

## 4. Стек технологий

| Область | Стек |
|---------|------|
| Веб | Vite, React 19, TypeScript, MUI, React Router v6, React Hook Form, Zod, клиент Supabase JS |
| API | FastAPI, Pydantic, SQLAlchemy 2 async, `python-jose` (JWT), bcrypt, SQLite через `aiosqlite` (по умолчанию) |
| Мобильное | Flutter (см. `mobile/pubspec.yaml`) |
| Общая удалённая БД | Supabase (Postgres + Auth + RLS — по настройкам вашего проекта) |

---

## 5. Переменные окружения

### Фронтенд (`frontend/.env.local`)

Vite читает `.env*` **только из каталога `frontend/`**. Скопируйте `frontend/.env.example` в `frontend/.env.local`.

| Переменная | Назначение |
|------------|------------|
| `VITE_SUPABASE_URL` | URL проекта Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Ключ anon/publishable (имя в `.env.example`) |
| `VITE_SUPABASE_ANON_KEY` | Альтернатива publishable-ключу (поддерживается в `shared/lib/supabase/client.ts`) |
| `VITE_API_BASE_URL` | Необязательно. Базовый URL FastAPI **без** завершающего слэша (например `http://127.0.0.1:8000`). Если не задан, вызовы `apiFetch` пропускаются или где реализовано используются локальные моки. |

### Бэкенд (`backend/.env` или переменные процесса)

Задаются через `pydantic-settings` в `backend/app/core/config.py`:

| Параметр (env) | Значение по умолчанию / заметки |
|----------------|----------------------------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./field_inspector.db` |
| `JWT_SECRET_KEY` | Заглушка по умолчанию; **смените в продакшене** |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24 ч) |
| `API_V1_PREFIX` | `/api/v1` |
| `CORS_ORIGINS` | Список через запятую; по умолчанию есть `http://localhost:5173` и `127.0.0.1:5173`. **Добавьте origin, который реально используете** (включая порт), иначе запросы из браузера будут отклоняться CORS. |
| `SEED_ADMIN_EMAIL` | По умолчанию `admin@example.com` |
| `SEED_ADMIN_PASSWORD` | По умолчанию `admin` |

---

## 6. Запуск

### Веб-панель и API одной командой (рекомендуется)

Из **корня репозитория** поднимаются **FastAPI** (фон) и **Vite** (передний план). Скрипт: `scripts/dev.sh`.

**Подготовка (один раз):**

1. Скопируйте переменные окружения по разделу [5. Переменные окружения](#5-переменные-окружения) (`frontend/.env.local`, при необходимости `backend/.env`).
2. Установите зависимости фронтенда: `cd frontend && npm install`.

**Запуск:**

```bash
./scripts/dev.sh
```

Если файл не исполняемый: `chmod +x scripts/dev.sh` или `bash scripts/dev.sh`.

| Что | Адрес / примечание |
|-----|-------------------|
| Фронтенд (Vite) | По умолчанию [http://localhost:5173/](http://localhost:5173/) (если порт занят, Vite выберет следующий — смотрите вывод в терминале). |
| API | [http://127.0.0.1:8000](http://127.0.0.1:8000), префикс `/api/v1` |
| Порт бэкенда | Переменная `BACKEND_PORT` (по умолчанию `8000`), передаётся в `backend/run_dev.sh`. |

**Остановка:** **Ctrl+C** в том же терминале — завершаются и Vite, и процесс uvicorn.

### Фронтенд (отдельно)

```bash
cd frontend
npm install   # при первом клонировании
npm run dev
```

Сборка и проверка типов:

```bash
npm run build
npm run lint
```

### Бэкенд (отдельно)

Вариант с готовым скриптом (venv, при необходимости установка зависимостей, освобождение порта):

```bash
cd backend
bash run_dev.sh
```

Или вручную:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Проверка живости: `GET /health`
- База API: `{origin}{API_V1_PREFIX}` (по умолчанию `http://127.0.0.1:8000/api/v1`)

При первом запуске с пустой БД приложение создаёт таблицы и выполняет **однократный seed** (демо-пользователь, маршруты, строки дашборда и т.д.), если пользователей ещё нет (`backend/app/core/seed.py`).

### Мобильное

Проект Flutter в `mobile/`. Типичный цикл:

```bash
cd mobile
flutter pub get
flutter run
```

Настройку Supabase и окружения приложения см. в `mobile/lib/core/config/` и в документации мобильного проекта; здесь не дублируется.

---

## 7. Режимы аутентификации

Веб-`AuthProvider` (`frontend/src/features/auth/model/auth-context.tsx`) выбирает вход в таком порядке:

1. Если заданы переменные **Supabase** (`VITE_SUPABASE_URL` + ключ): вход через **Supabase Auth** (`signInWithPassword`). Сессию хранит клиент Supabase.
2. Иначе, если задан **`VITE_API_BASE_URL`**: вход через **`POST /api/v1/auth/login`**, JWT сохраняется в **`localStorage`** под ключом `fi_access_token`.
3. Иначе: **устаревший демо-флаг** в `localStorage` (без реальной безопасности).

Защищённые маршруты UI учитывают сессию Supabase, сохранённый JWT или этот флаг; логика в `isAuthenticated()` в том же файле.

**Важно:** вызовы `apiFetch` (`frontend/src/shared/api/client.ts`) подставляют **только** `fi_access_token`. Сессия Supabase **не** передаётся. FastAPI принимает **только Bearer JWT** (`backend/app/shared/dependencies.py`).

### Рекомендуемые режимы использования

| Режим | Когда уместен | Заметки |
|-------|---------------|---------|
| **(A) Только Supabase** | Нужны сценарии админки по Postgres: задания, обходчики, заявки. | **Не задавайте** `VITE_API_BASE_URL`. Дашборд/маршрут/чек-листы с API либо на моках, либо не активны — зависит от страницы. |
| **(B) Только API** | Опираетесь на FastAPI + SQLite: дашборд, маршруты, оборудование, шаблоны. | Задайте `VITE_API_BASE_URL`. **Не задавайте** переменные Supabase, иначе вход пойдёт в Supabase и **JWT бэкенда не появится**. |
| **(C) Гибрид** | Нужны и данные Supabase, и FastAPI в одной сессии. | **Сквозная реализация отсутствует:** нет обмена сессии Supabase на JWT FastAPI. Нужен отдельный «мост» (доработка бэкенда и фронта). Пока его нет — при входе только через Supabase при включённом `VITE_API_BASE_URL` ожидайте **401** на `/api/v1/*`. |

---

## 8. Базы данных

### Supabase (Postgres)

Используется веб-приложением для прямых запросов и мобильным клиентом. Типичные таблицы (имена как в `frontend/src/features/factory/services/` и связанных хуках):

- `profiles`
- `inspection_tasks`, `inspection_task_items`, `inspection_task_assignments`
- `inspection_task_requests` (заявки работников; в старых упоминаниях могло быть `task_requests`)
- `inspection_reports` (отчёты с мобильного клиента; дефекты и вложения)

**Срочные уведомления администратору в Telegram** (переменные в `backend/.env`, вебхук Supabase на `POST /api/v1/webhooks/supabase-db`; опционально Edge Function): [`docs/TELEGRAM_ADMIN_NOTIFICATIONS.md`](docs/TELEGRAM_ADMIN_NOTIFICATIONS.md).

SQL-миграции лежат в `supabase/migrations/` (дополнительная копия — в `mobile/supabase/migrations/`). **Применяйте тот набор, который считаете каноническим** в своём проекте Supabase; не накатывайте два конфликтующих набора без понимания.

**Согласование схемы:** в репозитории миграции могут задавать **другие имена колонок**, чем вставляет веб-клиент (например `task_id` и `inspection_task_id`). Рабочая БД должна совпадать с тем, что **отправляет код клиента**, иначе вставки/выборки завершатся ошибкой.

### Бэкенд (SQLite)

Один файл по умолчанию (`field_inspector.db` в рабочей директории, если не переопределён `DATABASE_URL`). Хранит пользователей API (seed-админ), граф маршрутов обхода (демо), оборудование, таблицы снимка дашборда, шаблоны чек-листов, очередь sync и т.д. Это **не** та же база, что Supabase.

---

## 9. Известные ограничения (текущий код)

- **Двойная авторизация:** при входе через **Supabase** токен `fi_access_token` **не** заполняется. Защищённые маршруты FastAPI без Bearer возвращают **401**. Одновременное включение Supabase и `VITE_API_BASE_URL` без моста легко настроить неверно.
- **Дашборд и ошибки API:** при заданном `VITE_API_BASE_URL` `DashboardPage` запрашивает `/api/v1/dashboard` и `/api/v1/routes`. Если ответ не OK, интерфейс **остаётся на моках** без явного состояния ошибки (`frontend/src/pages/Dashboard/DashboardPage.tsx`).
- **Разделённая предметная область:** обходчики и задания из Supabase **не** совпадают с маршрутами/оборудованием/дашбордом в SQLite, пока вы не реплицируете или не интегрируете данные отдельно.
- **Действия по заявкам:** в `taskRequestsApi.ts` одобрение/отклонение может вернуть успех даже при сбое обновления в БД; до исправления относитесь к результату осторожно.
- **Роль admin:** `useAdminProfile` читает `profiles`, но **не** подключён к роутингу; текст в сайдбаре может подразумевать разделы только для admin без проверки в коде.
- **CORS:** по умолчанию ориентир на порт **5173**; другой порт Vite требует обновить `CORS_ORIGINS` на API.

---

## 10. Рекомендуемая настройка для разработчиков

1. Для локальной работы выберите режим **(A) или (B)**, если вы не делаете мост между системами.
2. Для **(A):** только `frontend/.env.local` с Supabase; URL API не задавайте, если не запускаете API и не понимаете разрыв авторизации.
3. Для **(B):** запустите бэкенд, задайте `VITE_API_BASE_URL`, **не** задавайте ключи Supabase, войдите учётными данными из seed (см. `SEED_ADMIN_*`), проверьте совпадение `CORS_ORIGINS` с origin Vite.
4. Миграции SQL применяйте к проекту Supabase осознанно; проверьте имена таблиц и колонок под используемые веб- и мобильные клиенты.

---

## 11. Направления развития

- Унификация входа (например выдача JWT FastAPI после проверки Supabase или единый IdP).
- Единый источник истины по заданиям/маршрутам или документированный слой синхронизации между Postgres и БД API.
- Явные состояния ошибки и пустых данных на всех страницах с API; убрать немой откат к мокам при ошибках HTTP, где это вводит в заблуждение.

---

## Дополнительные материалы

- **Описание проекта решения** (проблема, аудитория, архитектура, MVP, риски): [`docs/PROJECT_DESCRIPTION_RU.md`](docs/PROJECT_DESCRIPTION_RU.md)
- **Telegram-уведомления админу** (дефекты в отчётах, срочные заявки): [`docs/TELEGRAM_ADMIN_NOTIFICATIONS.md`](docs/TELEGRAM_ADMIN_NOTIFICATIONS.md)
- **Деплой FastAPI на Railway** (публичный URL для вебхуков): [`docs/DEPLOY_RAILWAY.md`](docs/DEPLOY_RAILWAY.md)
- Подробнее о веб-панели: [`frontend/README.md`](frontend/README.md)
- Стандарты кода фронтенда: [`frontend/docs/CODING_STANDARTS.md`](frontend/docs/CODING_STANDARTS.md)
- Стандарты кода бэкенда: [`backend/docs/CODING_STANDARTS.md`](backend/docs/CODING_STANDARTS.md)
