-- Если таблица была создана с колонкой `content`, а мобильное приложение и админка используют `body`:
-- однократно переименовать. Идемпотентно.
-- После применения при необходимости обновите кэш схемы в Supabase Dashboard.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'task_chat_messages'
      AND column_name = 'content'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'task_chat_messages'
      AND column_name = 'body'
  ) THEN
    ALTER TABLE public.task_chat_messages RENAME COLUMN content TO body;
  END IF;
END $$;
