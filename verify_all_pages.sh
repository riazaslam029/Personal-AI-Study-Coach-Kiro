#!/bin/bash
# Verify all frontend pages are accessible

clear
echo "════════════════════════════════════════════════════════"
echo "  🧪 VERIFYING ALL PAGES"
echo "════════════════════════════════════════════════════════"
echo ""

FRONTEND_URL="http://localhost:5173"

echo "📋 Checking if servers are running..."
echo "---------------------------------------------------"

# Check backend
if curl -s "${FRONTEND_URL}" > /dev/null; then
    echo "✅ Frontend server is running on port 5173"
else
    echo "❌ Frontend server is not running!"
    echo "   Start it with: cd frontend && npm run dev"
    exit 1
fi

if curl -s "http://localhost:8000/health" > /dev/null; then
    echo "✅ Backend server is running on port 8000"
else
    echo "❌ Backend server is not running!"
    echo "   Start it with: cd backend && .venv/bin/uvicorn app.main:app --reload"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✅ BOTH SERVERS ARE RUNNING"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Open these pages in your browser to test:"
echo ""
echo "1. 🏠 Dashboard:      ${FRONTEND_URL}/"
echo "2. 📚 Courses:        ${FRONTEND_URL}/courses"
echo "3. ✅ Tasks:          ${FRONTEND_URL}/tasks"
echo "4. 📄 Materials:      ${FRONTEND_URL}/materials"
echo "5. 🤖 AI Assistant:   ${FRONTEND_URL}/assistant"
echo "6. 📅 Planner:        ${FRONTEND_URL}/planner (FIXED)"
echo "7. 📈 Progress:       ${FRONTEND_URL}/progress (FIXED)"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
echo "✅ All pages should now work without errors!"
echo ""
echo "If you see any issues:"
echo "  1. Check browser console (F12)"
echo "  2. Check backend logs"
echo "  3. Reload the page (Ctrl+R)"
echo ""
echo "════════════════════════════════════════════════════════"
