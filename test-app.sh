#!/bin/bash
# Quick test script for Study Coach app

echo "🧪 Testing Study Coach Application..."
echo ""

# Check if backend is running
echo "1. Checking backend health..."
response=$(curl -s http://localhost:8000/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✓ Backend is running"
    echo "   Response: $response"
else
    echo "✗ Backend is NOT running"
    echo "   Start it with: cd backend && uvicorn app.main:app --reload"
fi

echo ""

# Check if frontend is accessible
echo "2. Checking frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✓ Frontend is running on http://localhost:5173"
else
    echo "✗ Frontend is NOT running"
    echo "   Start it with: cd frontend && npm run dev"
fi

echo ""
echo "📋 Manual Testing Checklist:"
echo "   1. Register a new account"
echo "   2. Create a course (e.g., 'Computer Science')"
echo "   3. Create a task with:"
echo "      - Title, description, type (assignment/exam/task)"
echo "      - Priority, difficulty, estimated hours"
echo "      - Deadline date"
echo "   4. Upload a PDF file or paste text as study material"
echo "   5. Check if materials appear in the list"
echo "   6. Mark a task as complete"
echo "   7. View dashboard - check if data displays correctly"
echo ""
echo "🐛 If you see errors:"
echo "   - Check browser console (F12)"
echo "   - Check Network tab for failed API calls"
echo "   - Check backend terminal for Python errors"

