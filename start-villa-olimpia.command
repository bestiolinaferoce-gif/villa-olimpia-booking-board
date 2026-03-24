#!/usr/bin/env bash
# Avvio locale Villa Olimpia — doppio clic da Finder (Booking Board + Preventivi).
# Se macOS blocca: tasto destro → Apri (prima volta).

set +e

DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3030}"
cd "$DIR" || exit 1

# PATH completo (Finder non carica .zprofile: serve per trovare npm/node)
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
if [ -x /opt/homebrew/bin/brew ]; then
  eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null)" || true
fi

# nvm (installazione tipica)
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  nvm use default 2>/dev/null || nvm use node 2>/dev/null || true
fi

if ! command -v npm >/dev/null 2>&1; then
  echo ""
  echo "══════════════════════════════════════════════════════════════"
  echo "  npm NON trovato nel PATH (tipico se avvii con doppio clic)."
  echo "  Soluzione: apri Terminale, vai nella cartella del progetto e:"
  echo "    cd \"$DIR\""
  echo "    nvm use --lts   # se usi nvm"
  echo "    npm install"
  echo "    npm run dev:3030"
  echo "══════════════════════════════════════════════════════════════"
  echo ""
  read -r -p "Premi Invio per chiudere…"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installazione dipendenze (npm install)…"
  npm install || {
    echo "npm install fallito."
    read -r -p "Premi Invio per chiudere…"
    exit 1
  }
fi

echo "Libero la porta $PORT…"
for pid in $(lsof -ti:"$PORT" 2>/dev/null); do
  kill -9 "$pid" 2>/dev/null || true
done

echo ""
echo "  → http://localhost:$PORT/        (Booking Board)"
echo "  → http://localhost:$PORT/preventivi  (Preventivi)"
echo ""
echo "Chiudi questa finestra per fermare il server."
echo ""

npm run dev -- -p "$PORT" &
SERVER_PID=$!

# Attendi risposta HTTP (curl opzionale)
for _ in $(seq 1 45); do
  if command -v curl >/dev/null 2>&1; then
    if curl -sf "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
      break
    fi
  else
    sleep 2
    break
  fi
  sleep 1
done

sleep 1
open "http://localhost:${PORT}/" 2>/dev/null || true

wait "$SERVER_PID" 2>/dev/null
EXIT=$?
echo ""
echo "Server terminato (codice $EXIT)."
read -r -p "Premi Invio per chiudere…" 2>/dev/null || true
exit "$EXIT"
