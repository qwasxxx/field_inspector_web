# Деплой бэкенда (FastAPI) на Railway

Нужно, чтобы у API был **публичный HTTPS-URL** — тогда в Supabase можно указать вебхук вида  
`https://<ваш-сервис>.up.railway.app/api/v1/webhooks/supabase-db`.

Деплойте **только каталог `backend/`** (монорепозиторий).

---

## 1. Подготовка в Railway

1. Зайдите на [railway.app](https://railway.app), войдите (GitHub удобнее).
2. **New Project** → **Deploy from GitHub repo** → выберите `field_inspector_web`.
3. После создания сервиса откройте его **Settings**:
   - **Root Directory** → `backend`
   - Убедитесь, что используется **один сервис** на этот репозиторий (или отдельный сервис с root `backend`).

Railway сам соберёт Python через Nixpacks по `requirements.txt`.

---

## 2. Команда запуска

В **Settings → Deploy → Custom Start Command** (или переменные ниже) задайте:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Переменная **`PORT`** на Railway задаётся автоматически — **не** подставляйте `8000` вручную.

В репозитории есть [`backend/railway.toml`](../backend/railway.toml) с тем же `startCommand` — при связке с Railway CLI это может подхватиться; иначе команда из пункта выше в дашборде надёжна.

---

## 3. Переменные окружения (Variables)

В **Variables** добавьте всё нужное из локального `backend/.env`, важное минимум:

| Переменная | Заметки |
|------------|---------|
| `DATABASE_URL` | По умолчанию SQLite в рабочей директории. На Railway диск **эфемерный** — после redeploy файл БД пропадёт, если не подключён **Volume** (см. ниже). |
| `CORS_ORIGINS` | Укажите origin прод-фронта, например `https://ваш-фронт.ru`, через запятую при нескольких. |
| `JWT_SECRET_KEY` | Сильная случайная строка, не как в dev. |
| `TELEGRAM_BOT_TOKEN` | Для вебхука в Telegram. |
| `TELEGRAM_CHAT_IDS` | Через запятую. |
| `TELEGRAM_WEBHOOK_SECRET` | Если используете — тот же заголовок в Supabase Webhook. |
| `SUPABASE_*` | Если на проде нужны вызовы Supabase с сервера (создание обходчиков и т.д.). |

После сохранения Railway перезапустит деплой.

---

## 4. SQLite и данные (рекомендуется Volume)

Чтобы SQLite не обнулялась при каждом деплое:

1. В сервисе **Settings → Volumes** → **Add Volume**.
2. **Mount Path**, например: `/data`
3. В Variables задайте:

```env
DATABASE_URL=sqlite+aiosqlite:////data/field_inspector.db
```

(четыре слэша после схемы — путь абсолютный `/data/...`).

Либо подключите **Railway Postgres** и задайте `DATABASE_URL` на Postgres (отдельная настройка миграций под вашу схему).

---

## 5. Публичный URL

1. **Settings → Networking → Generate Domain** (или Custom Domain).
2. Проверка: `https://<ваш-домен>/health` → `{"status":"ok"}`.

---

## 6. Supabase Database Webhook

**Database → Webhooks** → новый хук:

- Таблица: `inspection_reports`, событие **Insert**
- URL: `https://<ваш-домен-railway>/api/v1/webhooks/supabase-db`
- При необходимости заголовок `X-Webhook-Sекрет` = `TELEGRAM_WEBHOOK_SECRET`

Повторите для `inspection_task_requests`, если нужны заявки.

---

## 7. Частые проблемы

- **502 / приложение не слушает порт** — проверьте `host 0.0.0.0` и **`$PORT`**, не 8000.
- **CORS** — добавьте точный origin фронта в `CORS_ORIGINS`.
- **Вебхук 401** — несовпадение `TELEGRAM_WEBHOOK_SECRET` и заголовка в Supabase.

---

## Фронтенд на Railway (кратко)

Отдельный сервис: root `frontend`, build `npm run build`, start `npx vite preview --host 0.0.0.0 --port $PORT` (или статика через nginx). В `frontend/.env` для прод задайте `VITE_API_BASE_URL=https://<backend-railway-url>` без завершающего `/`. Это уже отдельный чеклист; для Telegram достаточно задеплоенного **backend**.
