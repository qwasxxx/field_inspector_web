/**
 * Уведомления администратору в Telegram при срочных событиях из БД.
 * Вызывается Supabase Database Webhook (INSERT) на таблицы:
 *   - public.inspection_reports — дефект или высокий приоритет дефекта
 *   - public.inspection_task_requests — заявка с priority = high
 *
 * Секреты (Dashboard → Edge Functions → Secrets или `supabase secrets set`):
 *   TELEGRAM_BOT_TOKEN — токен от @BotFather
 *   TELEGRAM_CHAT_IDS — chat_id через запятую (личка или группа)
 * Опционально:
 *   WEBHOOK_SECRET — если задан, заголовок X-Webhook-Secret должен совпадать
 *   NOTIFY_TASK_REQUEST_MEDIUM — "true" = уведомлять и о заявках priority=medium
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type DbWebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normPriority(v: unknown): string {
  if (v == null || typeof v !== "string") return "";
  return v.trim().toLowerCase();
}

const HIGH_DEFECT_PRIORITIES = new Set([
  "high",
  "critical",
  "urgent",
  "высокий",
  "критический",
  "срочно",
]);

function isUrgentInspectionReport(record: Record<string, unknown>): boolean {
  const defectFound = record.defect_found === true;
  const p = normPriority(record.defect_priority);
  const highPriority = p !== "" && HIGH_DEFECT_PRIORITIES.has(p);
  return defectFound || highPriority;
}

function isUrgentTaskRequest(
  record: Record<string, unknown>,
  notifyMedium: boolean,
): boolean {
  const p = normPriority(record.priority);
  if (p === "high") return true;
  if (notifyMedium && p === "medium") return true;
  return false;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function formatReportMessage(record: Record<string, unknown>): string {
  const id = String(record.id ?? "—");
  const taskId = String(record.task_id ?? "—");
  const equipId = String(record.equipment_id ?? "—");
  const comment = typeof record.comment_text === "string" ? record.comment_text : "";
  const defectDesc =
    typeof record.defect_description === "string" ? record.defect_description : "";
  const defectPriority = String(record.defect_priority ?? "—");
  const defectFound = record.defect_found === true;

  const lines = [
    "🚨 <b>Field Inspector — отчёт с дефектом / срочно</b>",
    "",
    `<b>Отчёт:</b> <code>${escapeHtml(id)}</code>`,
    `<b>Задание:</b> <code>${escapeHtml(taskId)}</code>`,
    `<b>Позиция маршрута:</b> <code>${escapeHtml(equipId)}</code>`,
    `<b>Дефект зафиксирован:</b> ${defectFound ? "да" : "нет"}`,
    `<b>Приоритет дефекта:</b> ${escapeHtml(defectPriority)}`,
  ];
  if (defectDesc) {
    lines.push("", `<b>Описание дефекта:</b>`, escapeHtml(truncate(defectDesc, 1200)));
  }
  if (comment) {
    lines.push("", `<b>Комментарий:</b>`, escapeHtml(truncate(comment, 800)));
  }
  return lines.join("\n");
}

function formatTaskRequestMessage(record: Record<string, unknown>): string {
  const id = String(record.id ?? "—");
  const title = typeof record.title === "string" ? record.title : "—";
  const description = typeof record.description === "string" ? record.description : "";
  const priority = String(record.priority ?? "—");
  const site = typeof record.site_name === "string" ? record.site_name : "";
  const area = typeof record.area_name === "string" ? record.area_name : "";

  const lines = [
    "📋 <b>Field Inspector — заявка обходчика</b>",
    "",
    `<b>ID:</b> <code>${escapeHtml(id)}</code>`,
    `<b>Тема:</b> ${escapeHtml(truncate(title, 500))}`,
    `<b>Приоритет:</b> ${escapeHtml(priority)}`,
  ];
  if (site) lines.push(`<b>Площадка:</b> ${escapeHtml(site)}`);
  if (area) lines.push(`<b>Участок:</b> ${escapeHtml(area)}`);
  if (description) {
    lines.push("", `<b>Описание:</b>`, escapeHtml(truncate(description, 1500)));
  }
  return lines.join("\n");
}

async function sendTelegram(
  token: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; status: number; body: string }> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId.trim(),
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (secret) {
    const hdr = req.headers.get("x-webhook-secret") ?? "";
    const auth = req.headers.get("authorization") ?? "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (hdr !== secret && bearer !== secret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const token = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
  const chatIdsRaw = Deno.env.get("TELEGRAM_CHAT_IDS") ?? "";
  if (!token || !chatIdsRaw.trim()) {
    console.error("admin-telegram-notify: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_IDS");
    return new Response(
      JSON.stringify({ error: "Server misconfigured: Telegram secrets missing" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const chatIds = chatIdsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  if (chatIds.length === 0) {
    return new Response(JSON.stringify({ error: "No chat IDs" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: DbWebhookPayload;
  try {
    payload = (await req.json()) as DbWebhookPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const table = payload.table ?? "";
  const eventType = (payload.type ?? "").toUpperCase();
  const record = payload.record;

  if (eventType !== "INSERT" || !record || typeof record !== "object") {
    return new Response(JSON.stringify({ notified: false, reason: "not_insert_or_no_record" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const notifyMedium =
    (Deno.env.get("NOTIFY_TASK_REQUEST_MEDIUM") ?? "").toLowerCase() === "true";

  let message: string | null = null;

  if (table === "inspection_reports" && isUrgentInspectionReport(record)) {
    message = formatReportMessage(record);
  } else if (table === "inspection_task_requests" && isUrgentTaskRequest(record, notifyMedium)) {
    message = formatTaskRequestMessage(record);
  }

  if (!message) {
    return new Response(JSON.stringify({ notified: false, reason: "not_urgent_or_unknown_table" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results: { chatId: string; ok: boolean; status: number }[] = [];
  for (const chatId of chatIds) {
    const r = await sendTelegram(token, chatId, truncate(message, 4000));
    results.push({ chatId, ok: r.ok, status: r.status });
    if (!r.ok) {
      console.error(`Telegram send failed for ${chatId}: ${r.status} ${r.body}`);
    }
  }

  const allOk = results.every((x) => x.ok);
  return new Response(
    JSON.stringify({ notified: true, results }),
    {
      status: allOk ? 200 : 502,
      headers: { "Content-Type": "application/json" },
    },
  );
});
