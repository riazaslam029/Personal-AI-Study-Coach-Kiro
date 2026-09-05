#!/bin/bash
# Debug plan generation issue

echo "════════════════════════════════════════════════════════"
echo "  🔍 DEBUGGING PLAN GENERATION"
echo "════════════════════════════════════════════════════════"
echo ""

# Check if you're logged in
# Open browser console and get token
echo "📋 Open browser console (F12) and run this:"
echo "   localStorage.getItem('token')"
echo ""
read -p "Paste your token here: " TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ No token provided"
    exit 1
fi

API_BASE="http://localhost:8000/api/v1"

echo ""
echo "📋 Step 1: Check tasks"
echo "---------------------------------------------------"
TASKS_RESPONSE=$(curl -s -X GET "${API_BASE}/tasks" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$TASKS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TASKS_RESPONSE"

TASK_COUNT=$(echo "$TASKS_RESPONSE" | grep -o '"id"' | wc -l)
echo ""
echo "Total tasks: ${TASK_COUNT}"
echo ""

if [ "$TASK_COUNT" -eq 0 ]; then
    echo "⚠️  NO TASKS FOUND!"
    echo ""
    echo "The AI needs tasks to generate a study plan."
    echo "Please create some tasks first:"
    echo ""
    echo "1. Go to: http://localhost:5173/tasks"
    echo "2. Click '+ Add Task'"
    echo "3. Create at least 2-3 tasks with deadlines"
    echo "4. Then try generating the plan again"
    echo ""
    exit 1
fi

echo "📋 Step 2: Try generating plan"
echo "---------------------------------------------------"

START_DATE=$(date '+%Y-%m-%d')
END_DATE=$(date -d '+7 days' '+%Y-%m-%d')

echo "Generating plan from ${START_DATE} to ${END_DATE}..."
echo ""

PLAN_RESPONSE=$(curl -s -X POST "${API_BASE}/plan/generate" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"start_date\":\"${START_DATE}\",
    \"end_date\":\"${END_DATE}\",
    \"available_hours_per_day\":{
      \"monday\":3,
      \"tuesday\":3,
      \"wednesday\":3,
      \"thursday\":3,
      \"friday\":3,
      \"saturday\":5,
      \"sunday\":5
    }
  }")

echo "$PLAN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PLAN_RESPONSE"

echo ""
echo "---------------------------------------------------"

if echo "$PLAN_RESPONSE" | grep -q '"session_count"'; then
    SESSION_COUNT=$(echo "$PLAN_RESPONSE" | grep -o '"session_count":[0-9]*' | sed 's/"session_count"://')
    echo ""
    echo "✅ SUCCESS! Generated ${SESSION_COUNT} study sessions"
    echo ""
    
    if [ "$SESSION_COUNT" -eq 0 ]; then
        echo "⚠️  But 0 sessions were generated!"
        echo ""
        echo "Possible reasons:"
        echo "1. All tasks are already completed"
        echo "2. No tasks have deadlines"
        echo "3. Tasks are too far in the future"
        echo "4. AI couldn't fit tasks into available hours"
        echo ""
        echo "Try:"
        echo "- Add more tasks with near-term deadlines"
        echo "- Increase available hours per day"
        echo "- Make sure some tasks are NOT completed"
    fi
elif echo "$PLAN_RESPONSE" | grep -q '"detail"'; then
    ERROR=$(echo "$PLAN_RESPONSE" | grep -o '"detail":"[^"]*' | sed 's/"detail":"//')
    echo "❌ ERROR: ${ERROR}"
else
    echo "❌ Unknown error occurred"
fi

echo ""
echo "📋 Step 3: Fetch current plan"
echo "---------------------------------------------------"

CURRENT_PLAN=$(curl -s -X GET "${API_BASE}/plan/" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$CURRENT_PLAN" | python3 -m json.tool 2>/dev/null | head -50

echo ""
echo "════════════════════════════════════════════════════════"
