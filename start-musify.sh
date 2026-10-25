#!/usr/bin/env bash
set -e

echo "========================================================"
echo "          Musify - Liquid Glass Music Player            "
echo "========================================================"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Trap interrupt and terminate children
cleanup() {
  echo ""
  echo "Shutting down Musify services..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "[1/2] Starting Musify Backend on port 3001..."
(cd backend && npm start) &

sleep 2

echo "[2/2] Starting Musify Web Frontend on port 3000..."
(cd frontend && npm run preview) &

echo ""
echo "========================================================"
echo "Musify is running!"
echo "Access on Desktop:  http://localhost:3000"
echo "Press Ctrl+C to stop all services."
echo "========================================================"

wait
