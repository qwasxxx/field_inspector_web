#!/usr/bin/env bash
# Запуск FastAPI (backend) и Vite (frontend) одной командой.
# Использование: из корня репозитория — ./scripts/dev.sh
# Переменные: BACKEND_PORT (по умолчанию 8000)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if [[ ! -f "$ROOT/backend/run_dev.sh" ]]; then
  echo "ERROR: не найден $ROOT/backend/run_dev.sh" >&2
  exit 1
fi

PORT="$BACKEND_PORT" bash "$ROOT/backend/run_dev.sh" &
BACKEND_PID=$!

cd "$ROOT/frontend"
npm run dev
