# Локальная среда: фронтенд + бэкенд + Supabase

## Файлы окружения (локально, не в git)

| Файл | Назначение |
|------|------------|
| `frontend/.env.local` | `VITE_*`: Supabase; `VITE_API_BASE_URL` опционален в dev (см. proxy в `vite.config.ts`) |
| `backend/.env` | SQLite, CORS, `SUPABASE_*` с **service_role только на сервере** |

В репозитории остаются только **примеры без секретов**: `frontend/.env.example`, `backend/.env.example`.

## Что можно скопировать из одного проекта Supabase

- **URL проекта** — один и тот же в `VITE_SUPABASE_URL` и `SUPABASE_URL`.
- **Publishable / anon API key** — обычно один и тот же смысл для `VITE_SUPABASE_PUBLISHABLE_KEY` и `SUPABASE_ANON_KEY` (проверка сессии админа и заголовок `apikey` к Auth/REST от имени пользователя).

## Что нужно вручную и нельзя подставлять «заглушкой»

- **`SUPABASE_SERVICE_ROLE_KEY`** — только из Supabase Dashboard → Project Settings → API → `service_role`. Держать в `backend/.env`, никогда не в Vite и не в примерах в git.

## Запуск

**Бэкенд** (нужен **Python 3.10+**; из каталога `backend/`, чтобы подхватился `backend/.env`):

```bash
cd backend
./run_dev.sh
```

Либо вручную: `python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`

В **dev** Vite проксирует `/api` и `/health` на `http://127.0.0.1:8000`, чтобы не упираться в CORS и «Failed to fetch» при смешении `localhost` и `127.0.0.1`.

**Фронтенд**:

```bash
cd frontend
npm install
npm run dev
```

Откройте админку: `http://localhost:5173/` (или URL из вывода Vite).

## Проверка создания обходчика

1. Войдите в админку через **Supabase Auth** (email/password администратора).
2. Бэкенд запущен на порту **8000**; во frontend dev `VITE_API_BASE_URL` может быть пустым (прокси).
3. Страница **Обходчики** → **Создать обходчика** → заполните форму → создать.
4. В Supabase: **Authentication → Users** и таблица **`public.profiles`** должны содержать нового пользователя с `role = worker`.

## Проверка мобильного входа

1. Создайте обходчика с известным email/password.
2. В мобильном приложении войдите теми же учётными данными (Supabase Auth).
3. `profiles.id` совпадает с `auth.users.id`; назначенные задания читаются по `inspection_task_assignments.worker_user_id`.

## Если что-то не работает

- **503 при создании обходчика** — не заданы `SUPABASE_*` в `backend/.env` или бэкенд запущен не из `backend/`.
- **Сеть / CORS** — в `backend/.env` проверьте `CORS_ORIGINS` (origin Vite, например `http://localhost:5173`).
