#!/bin/bash
# Start VisionAI — backend + frontend in parallel

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting VisionAI backend on :8000"
cd "$ROOT/backend"
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "Starting VisionAI frontend on :5173"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
