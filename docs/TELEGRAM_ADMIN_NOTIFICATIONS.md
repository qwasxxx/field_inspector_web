# Уведомления администратору в Telegram

Срочные события из **Supabase** (запись с мобильного приложения) дублируются в Telegram. Достаточно прописать переменные в **`backend/.env`** и один раз настроить **Database Webhook** в Supabase на URL вашего FastAPI.

## Что триггерит уведомление

| Таблица | Условие |
|---------|---------|
| `public.inspection_reports` | INSERT и (`defect_found = true` **или** приоритет дефекта: `high`, `critical`, `urgent`, `высокий`, `критический`, `срочно`) |
| `public.inspection_task_requests` | INSERT и `priority = 'high'`. Опционально и `medium`, если в `.env` задано `TELEGRAM_NOTIFY_TASK_REQUEST_MEDIUM=true` |

## 1. Бот и `backend/.env` (основной способ)

1. В Telegram у [@BotFather](https://t.me/BotFather) создайте бота, скопируйте **токен**.
2. Узнайте **chat_id** (личный чат или группа): например [@userinfobot](https://t.me/userinfobot) или `getUpdates` после сообщения боту.
3. В **`backend/.env`** (шаблон: `backend/.env.example`):

```env
TELEGRAM_BOT_TOKEN=123456789:AAH...
TELEGRAM_CHAT_IDS=111111111
# Несколько чатов через запятую: 111111111,-1001234567890
```

Опционально:

```env
# Совпадает с заголовком X-Webhook-Secret в Supabase (защита от левых вызовов)
TELEGRAM_WEBHOOK_SECRET=случайная_длинная_строка
# true — уведомлять и о заявках с priority=medium
TELEGRAM_NOTIFY_TASK_REQUEST_MEDIUM=false
```

4. Перезапустите бэкенд (`uvicorn` / `./scripts/dev.sh`), чтобы подтянулся `.env`.

5. В Supabase: **Database → Webhooks → Create hook**  
   - Таблица `inspection_reports`, событие **Insert**  
   - Тип **HTTP Request**  
   - URL: **`https://<ваш-публичный-хост>/api/v1/webhooks/supabase-db`**  
   - Если задали `TELEGRAM_WEBHOOK_SECRET`, добавьте HTTP Header: `X-Webhook-Secret` = то же значение  

6. Второй вебхук (по желанию): таблица `inspection_task_requests`, событие **Insert**, тот же URL и заголовки.

Локально Supabase до вашего ноутбука не достучится: используйте туннель (ngrok, cloudflared) на порт **8000** или тестируйте на задеплоенном API.

## 2. Edge Function (без своего сервера)

Если FastAPI снаружи недоступен, можно задеплоить функцию в Supabase и хранить секреты там — см. [`supabase/functions/admin-telegram-notify`](../supabase/functions/admin-telegram-notify/index.ts) и [`supabase/config.toml`](../supabase/config.toml). Переменные задаются через **Supabase Dashboard → Edge Functions → Secrets**, не через `backend/.env`.

## Проверка

Вставьте тестовую строку в `inspection_reports` с `defect_found = true` (SQL Editor или мобильное приложение). В Telegram должно прийти сообщение.

## Безопасность

- Токен бота только в `backend/.env` (или в Secrets Edge Function), не во фронтенде и не в git.
- `TELEGRAM_WEBHOOK_SECRET` ограничивает вызовы только вашим вебхуком Supabase.
