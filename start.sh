#!/bin/sh
PORT=${PORT:-8000}
if [ -d "backend" ]; then
    cd backend
    exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
else
    exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
fi
