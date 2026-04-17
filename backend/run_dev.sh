#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

PORT="${PORT:-8000}"

free_port() {
  if command -v lsof &>/dev/null; then
    local pids
    pids="$(lsof -ti ":$PORT" 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      echo "Port $PORT kullanımda; eski süreç(ler) kapatılıyor: $pids" >&2
      kill -9 $pids 2>/dev/null || true
      sleep 0.3
    fi
  fi
}

free_port

if [[ -x .venv/bin/python ]]; then
  .venv/bin/pip install -r requirements.txt -q
  exec .venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port "$PORT"
fi

pick_python() {
  for c in python3.12 python3.11 python3.10 python3; do
    if command -v "$c" &>/dev/null; then
      if "$c" -c 'import sys; assert sys.version_info >= (3,10)' 2>/dev/null; then
        echo "$c"
        return 0
      fi
    fi
  done
  return 1
}

PY="$(pick_python)" || {
  echo "Python 3.10+ gerekli (örn. brew install python@3.12)." >&2
  exit 1
}

"${PY}" -m venv .venv
.venv/bin/pip install -r requirements.txt -q
exec .venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port "$PORT"
