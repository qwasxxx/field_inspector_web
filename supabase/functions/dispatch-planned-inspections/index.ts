/**
 * Периодический вызов (Supabase Scheduled Functions или внешний cron):
 * материализует запланированные обходы в задания inspection_tasks и назначения.
 *
 * Секрет (опционально): CRON_SECRET — заголовок X-Cron-Secret должен совпадать.
 * Окружение: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (по умолчанию в Edge).
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const sent = req.headers.get("x-cron-secret");
    if (sent !== cronSecret) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "missing supabase env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("dispatch_planned_inspections_due");
  if (error) {
    return new Response(
      JSON.stringify({ error: error.message, code: error.code }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ dispatched: data ?? 0 }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
