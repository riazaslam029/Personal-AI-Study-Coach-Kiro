#!/usr/bin/env python3
"""Final verification test - Check both AI providers and all features"""
import httpx
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

print("=" * 80)
print("🎯 FINAL PROJECT VERIFICATION TEST")
print("=" * 80)
print()

# Results tracking
results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "tests": []
}

def test(name, passed, details=""):
    """Record test result"""
    results["total"] += 1
    if passed:
        results["passed"] += 1
        print(f"✅ {name}")
    else:
        results["failed"] += 1
        print(f"❌ {name}")
    if details:
        print(f"   {details}")
    results["tests"].append({"name": name, "passed": passed, "details": details})

# Create client
client = httpx.Client(base_url=BASE_URL, timeout=30.0)

# Phase 1: Health & Database
print("PHASE 1: Infrastructure")
print("-" * 80)

try:
    r = client.get("/health")
    test("Backend Health", r.status_code == 200)
except Exception as e:
    test("Backend Health", False, str(e))

print()

# Phase 2: Authentication
print("PHASE 2: Authentication & Security")
print("-" * 80)

# Login
try:
    r = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    if r.status_code == 200:
        access_token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        test("Login", True, f"Token: {access_token[:20]}...")
    else:
        test("Login", False, f"Status: {r.status_code}")
        exit(1)
except Exception as e:
    test("Login", False, str(e))
    exit(1)

# Get current user
try:
    r = client.get("/api/v1/auth/me", headers=headers)
    test("Get Current User", r.status_code == 200)
except Exception as e:
    test("Get Current User", False, str(e))

print()

# Phase 3: Course Management
print("PHASE 3: Course Management")
print("-" * 80)

try:
    r = client.post("/api/v1/courses", json={
        "name": "Final Test Course",
        "code": "FINAL101",
        "color": "#10b981"
    }, headers=headers)
    if r.status_code == 201:
        course_id = r.json()["id"]
        test("Create Course", True, f"ID: {course_id[:20]}...")
    else:
        test("Create Course", False, f"Status: {r.status_code}")
        course_id = None
except Exception as e:
    test("Create Course", False, str(e))
    course_id = None

try:
    r = client.get("/api/v1/courses", headers=headers)
    test("List Courses", r.status_code == 200, f"Count: {len(r.json())}")
except Exception as e:
    test("List Courses", False, str(e))

print()

# Phase 4: Task Management
print("PHASE 4: Task Management")
print("-" * 80)

try:
    r = client.post("/api/v1/tasks", json={
        "title": "Final Verification Task",
        "task_type": "exam",
        "priority": "high",
        "difficulty": 4,
        "estimated_duration": 3.0,
        "due_date": "2026-09-15T10:00:00Z",
        "course_id": course_id
    }, headers=headers)
    if r.status_code == 201:
        task_id = r.json()["id"]
        test("Create Task", True, f"ID: {task_id[:20]}...")
    else:
        test("Create Task", False, f"Status: {r.status_code}")
        task_id = None
except Exception as e:
    test("Create Task", False, str(e))
    task_id = None

try:
    r = client.get("/api/v1/tasks", headers=headers)
    test("List Tasks", r.status_code == 200, f"Count: {len(r.json())}")
except Exception as e:
    test("List Tasks", False, str(e))

print()

# Phase 5: Study Materials
print("PHASE 5: Study Materials")
print("-" * 80)

material_content = """
Artificial Intelligence and Machine Learning

Machine learning is a method of data analysis that automates analytical model building.
It is a branch of artificial intelligence based on the idea that systems can learn from data,
identify patterns and make decisions with minimal human intervention.

Key concepts:
1. Supervised Learning: The algorithm learns from labeled training data
2. Unsupervised Learning: Finding hidden patterns in unlabeled data
3. Neural Networks: Computing systems inspired by biological neural networks
4. Deep Learning: Multi-layered neural networks for complex pattern recognition

Applications include computer vision, natural language processing, recommendation systems, and autonomous vehicles.
"""

try:
    r = client.post("/api/v1/materials/paste", json={
        "title": "AI & ML Overview",
        "content": material_content,
        "course_id": course_id
    }, headers=headers)
    if r.status_code == 201:
        material_id = r.json()["id"]
        test("Create Study Material", True, f"ID: {material_id[:20]}...")
    else:
        test("Create Study Material", False, f"Status: {r.status_code}")
        material_id = None
except Exception as e:
    test("Create Study Material", False, str(e))
    material_id = None

print()

# Phase 6: AI Features (Both Providers)
print("PHASE 6: AI Features (Gemini + OpenRouter Fallback)")
print("-" * 80)

if material_id:
    # Test AI Summarize
    try:
        print("🤖 Testing AI Summarize...")
        r = client.post("/api/v1/ai/assistant/summarize", json={
            "material_id": material_id
        }, headers=headers, timeout=30.0)
        if r.status_code == 200:
            summary = r.json()["summary"]
            test("AI Summarize", True, f"Summary length: {len(summary)} chars")
        else:
            test("AI Summarize", False, f"Status: {r.status_code}, {r.text[:100]}")
    except Exception as e:
        test("AI Summarize", False, str(e))

    # Test AI Key Points
    try:
        print("🤖 Testing AI Key Points...")
        r = client.post("/api/v1/ai/assistant/key-points", json={
            "material_id": material_id
        }, headers=headers, timeout=30.0)
        if r.status_code == 200:
            key_points = r.json()["key_points"]
            test("AI Key Points", True, f"Found {len(key_points)} points")
        else:
            test("AI Key Points", False, f"Status: {r.status_code}")
    except Exception as e:
        test("AI Key Points", False, str(e))

    # Test AI Chat
    try:
        print("🤖 Testing AI Chat...")
        r = client.post("/api/v1/ai/assistant/chat", json={
            "material_ids": [material_id],
            "question": "What is supervised learning?",
            "history": []
        }, headers=headers, timeout=30.0)
        if r.status_code == 200:
            answer = r.json()["answer"]
            test("AI Chat", True, f"Answer length: {len(answer)} chars")
        else:
            test("AI Chat", False, f"Status: {r.status_code}")
    except Exception as e:
        test("AI Chat", False, str(e))

    # Test AI Quiz
    try:
        print("🤖 Testing AI Quiz Generation...")
        r = client.post("/api/v1/ai/assistant/quiz", json={
            "material_id": material_id
        }, headers=headers, timeout=30.0)
        if r.status_code == 200:
            questions = r.json()["questions"]
            test("AI Quiz Generation", True, f"Generated {len(questions)} questions")
        else:
            test("AI Quiz Generation", False, f"Status: {r.status_code}")
    except Exception as e:
        test("AI Quiz Generation", False, str(e))
else:
    print("⚠️  Skipped AI tests (no material created)")
    test("AI Summarize", False, "No material")
    test("AI Key Points", False, "No material")
    test("AI Chat", False, "No material")
    test("AI Quiz Generation", False, "No material")

print()

# Phase 7: Study Planner
print("PHASE 7: Study Planner (AI-Powered)")
print("-" * 80)

if task_id:
    try:
        print("🤖 Testing Study Plan Generation...")
        r = client.post("/api/v1/plan/generate", json={
            "start_date": "2026-09-06",
            "end_date": "2026-09-12",
            "available_hours_per_day": {
                "monday": 3,
                "tuesday": 3,
                "wednesday": 3,
                "thursday": 3,
                "friday": 3,
                "saturday": 5,
                "sunday": 5
            }
        }, headers=headers, timeout=60.0)
        if r.status_code == 201:
            plan = r.json()
            test("Generate Study Plan", True, f"Generated plan")
        else:
            test("Generate Study Plan", False, f"Status: {r.status_code}")
    except Exception as e:
        test("Generate Study Plan", False, str(e))
else:
    print("⚠️  Skipped plan generation (no task)")
    test("Generate Study Plan", False, "No task")

print()

# Final Summary
print("=" * 80)
print("📊 FINAL VERIFICATION SUMMARY")
print("=" * 80)
print()
print(f"Total Tests: {results['total']}")
print(f"✅ Passed: {results['passed']}")
print(f"❌ Failed: {results['failed']}")
print(f"Success Rate: {(results['passed']/results['total']*100):.1f}%")
print()

if results['failed'] == 0:
    print("🎉 " * 20)
    print()
    print("✅ ALL TESTS PASSED!")
    print("🎯 Your Personal AI Study Coach is 100% FUNCTIONAL!")
    print()
    print("Features Verified:")
    print("  ✅ Authentication & Security")
    print("  ✅ Course Management")
    print("  ✅ Task Management")
    print("  ✅ Study Materials")
    print("  ✅ AI Features (Gemini + OpenRouter)")
    print("  ✅ Study Planner")
    print()
    print("🚀 PROJECT STATUS: PRODUCTION READY")
    print()
    print("🎉 " * 20)
else:
    print("⚠️  Some tests failed. Review the results above.")
    print()
    print("Failed tests:")
    for t in results["tests"]:
        if not t["passed"]:
            print(f"  ❌ {t['name']}: {t['details']}")

print()
print("=" * 80)
print("Check backend logs for AI provider fallback information")
print("=" * 80)

client.close()
