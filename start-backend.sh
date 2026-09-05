#!/bin/bash
# Start backend development server

cd backend

# Activate virtual environment
source .venv/bin/activate

# Ensure migrations are up to date
echo "Running database migrations..."
alembic upgrade head

# Start uvicorn with auto-reload
echo "Starting backend server on http://localhost:8000"
echo "API docs available at http://localhost:8000/docs"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
