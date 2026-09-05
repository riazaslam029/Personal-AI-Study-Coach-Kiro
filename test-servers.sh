#!/bin/bash

echo "========================================="
echo "Testing Study Coach Application"
echo "========================================="
echo ""

# Test Backend
echo "📡 Testing Backend (http://localhost:8000)..."
if timeout 3 bash -c 'curl -sf http://localhost:8000/health' > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:8000/health 2>&1)
    echo "✅ Backend is RUNNING"
    echo "   Response: $HEALTH"
    echo "   API Docs: http://localhost:8000/docs"
else
    echo "❌ Backend is NOT responding"
fi

echo ""

# Test Frontend
echo "🎨 Testing Frontend (http://localhost:5173)..."
if timeout 3 bash -c 'curl -sf http://localhost:5173' > /dev/null 2>&1; then
    echo "✅ Frontend is RUNNING"
    echo "   App URL: http://localhost:5173"
else
    echo "❌ Frontend is NOT responding"
fi

echo ""
echo "========================================="
echo "Process Status:"
echo "========================================="
ps aux | grep -E "(uvicorn|vite|node)" | grep -v grep | awk '{print $11" (PID "$2")"}'

echo ""
echo "========================================="
