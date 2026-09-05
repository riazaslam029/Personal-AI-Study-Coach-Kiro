#!/bin/bash
# Test the planner functionality

echo "════════════════════════════════════════════════════════"
echo "  🧪 TESTING AI PLAN GENERATION"
echo "════════════════════════════════════════════════════════"
echo ""

# Test credentials
EMAIL="test@example.com"
PASSWORD="testpass123"
API_BASE="http://localhost:8000/api/v1"

echo "📋 Step 1: Login"
echo "---------------------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed. Creating test user..."
    
    # Register
    curl -s -X POST "${API_BASE}/auth/register" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"full_name\":\"Test User\"}" > /dev/null
    
    # Login again
    LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
fi

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get auth token"
    exit 1
fi

echo "✅ Logged in successfully"
echo ""

echo "📋 Step 2: Check existing tasks"
echo "---------------------------------------------------"
TASKS=$(curl -s -X GET "${API_BASE}/tasks" \
  -H "Authorization: Bearer ${TOKEN}")

TASK_COUNT=$(echo "$TASKS" | grep -o '"id"' | wc -l)
echo "Found ${TASK_COUNT} tasks"
echo ""

if [ "$TASK_COUNT" -lt 2 ]; then
    echo "📝 Creating sample tasks for testing..."
    
    # Create a course first
    COURSE_RESPONSE=$(curl -s -X POST "${API_BASE}/courses" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"name":"Computer Science","description":"CS courses","color":"#3B82F6"}')
    
    COURSE_ID=$(echo "$COURSE_RESPONSE" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
    
    if [ -n "$COURSE_ID" ]; then
        echo "✅ Created course: ${COURSE_ID}"
        
        # Create tasks
        curl -s -X POST "${API_BASE}/tasks" \
          -H "Authorization: Bearer ${TOKEN}" \
          -H "Content-Type: application/json" \
          -d "{
            \"course_id\":\"${COURSE_ID}\",
            \"title\":\"Data Structures Assignment\",
            \"description\":\"Complete tree traversal problems\",
            \"task_type\":\"assignment\",
            \"status\":\"not_started\",
            \"priority\":\"high\",
            \"difficulty\":8,
            \"estimated_hours\":4.0,
            \"deadline\":\"$(date -d '+3 days' '+%Y-%m-%d')\"
          }" > /dev/null
        
        curl -s -X POST "${API_BASE}/tasks" \
          -H "Authorization: Bearer ${TOKEN}" \
          -H "Content-Type: application/json" \
          -d "{
            \"course_id\":\"${COURSE_ID}\",
            \"title\":\"Algorithms Midterm Prep\",
            \"description\":\"Study sorting algorithms\",
            \"task_type\":\"exam\",
            \"status\":\"not_started\",
            \"priority\":\"high\",
            \"difficulty\":9,
            \"estimated_hours\":6.0,
            \"deadline\":\"$(date -d '+7 days' '+%Y-%m-%d')\"
          }" > /dev/null
        
        curl -s -X POST "${API_BASE}/tasks" \
          -H "Authorization: Bearer ${TOKEN}" \
          -H "Content-Type: application/json" \
          -d "{
            \"course_id\":\"${COURSE_ID}\",
            \"title\":\"Read Chapter 5\",
            \"description\":\"Graph algorithms chapter\",
            \"task_type\":\"reading\",
            \"status\":\"not_started\",
            \"priority\":\"medium\",
            \"difficulty\":5,
            \"estimated_hours\":2.0,
            \"deadline\":\"$(date -d '+5 days' '+%Y-%m-%d')\"
          }" > /dev/null
        
        echo "✅ Created 3 sample tasks"
    fi
    echo ""
fi

echo "📋 Step 3: Generate AI Study Plan"
echo "---------------------------------------------------"

START_DATE=$(date '+%Y-%m-%d')
END_DATE=$(date -d '+7 days' '+%Y-%m-%d')

echo "Date range: ${START_DATE} to ${END_DATE}"
echo "Calling AI to generate plan..."
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

echo "$PLAN_RESPONSE" | head -50

if echo "$PLAN_RESPONSE" | grep -q '"session_count"'; then
    SESSION_COUNT=$(echo "$PLAN_RESPONSE" | grep -o '"session_count":[0-9]*' | sed 's/"session_count"://')
    echo ""
    echo "════════════════════════════════════════════════════════"
    echo "  ✅ SUCCESS! Generated ${SESSION_COUNT} study sessions"
    echo "════════════════════════════════════════════════════════"
    echo ""
    echo "🌐 View the plan in your browser at:"
    echo "   http://localhost:5173/planner"
    echo ""
else
    echo ""
    echo "════════════════════════════════════════════════════════"
    echo "  ❌ PLAN GENERATION FAILED"
    echo "════════════════════════════════════════════════════════"
    echo ""
    echo "Check the backend logs for errors."
    echo ""
fi

echo "📋 Step 4: Fetch the plan"
echo "---------------------------------------------------"
curl -s -X GET "${API_BASE}/plan/" \
  -H "Authorization: Bearer ${TOKEN}" | head -100

echo ""
echo ""
echo "════════════════════════════════════════════════════════"
echo "Test complete!"
echo "════════════════════════════════════════════════════════"
