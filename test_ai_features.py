#!/usr/bin/env python3
"""Test AI features with Gemini API key"""
import httpx
import json

BASE_URL = "http://localhost:8000"

print("=" * 80)
print("AI FEATURES TEST (With Gemini API Key)")
print("=" * 80)
print()

# Create client
client = httpx.Client(base_url=BASE_URL, timeout=30.0)

# Step 1: Login to get access token
print("Step 1: Login")
print("-" * 80)
try:
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    
    if response.status_code == 200:
        data = response.json()
        access_token = data["access_token"]
        print(f"✅ Login successful")
        headers = {"Authorization": f"Bearer {access_token}"}
    elif response.status_code == 401:
        # Try creating a test user first
        print("⚠️  User not found, registering...")
        reg_response = client.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "password": "testpass123",
            "full_name": "Test User"
        })
        
        if reg_response.status_code == 201:
            print("✅ Registration successful")
            # Login again
            response = client.post("/api/v1/auth/login", json={
                "email": "test@example.com",
                "password": "testpass123"
            })
            data = response.json()
            access_token = data["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}
        else:
            print(f"❌ Registration failed: {reg_response.status_code}")
            exit(1)
    else:
        print(f"❌ Login failed: {response.status_code}")
        exit(1)
except Exception as e:
    print(f"❌ Login error: {e}")
    exit(1)

print()

# Step 2: Create a course
print("Step 2: Create Test Course")
print("-" * 80)
try:
    response = client.post("/api/v1/courses", json={
        "name": "AI Test Course",
        "code": "AI101",
        "color": "#6366f1"
    }, headers=headers)
    
    if response.status_code == 201:
        course_id = response.json()["id"]
        print(f"✅ Course created: {course_id}")
    else:
        print(f"❌ Course creation failed: {response.status_code}")
        course_id = None
except Exception as e:
    print(f"❌ Error: {e}")
    course_id = None

print()

# Step 3: Create study material
print("Step 3: Create Study Material")
print("-" * 80)
material_id = None
if course_id:
    try:
        response = client.post("/api/v1/materials/paste", json={
            "title": "Introduction to Machine Learning",
            "content": """
Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. 

Key concepts:
1. Supervised Learning: Training on labeled data
2. Unsupervised Learning: Finding patterns in unlabeled data
3. Neural Networks: Models inspired by the human brain
4. Deep Learning: Multi-layer neural networks

Applications include image recognition, natural language processing, and recommendation systems.
            """,
            "course_id": course_id
        }, headers=headers)
        
        if response.status_code == 201:
            material_id = response.json()["id"]
            print(f"✅ Material created: {material_id}")
        else:
            print(f"❌ Material creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

print()

# Step 4: Test AI Summarize
print("Step 4: Test AI Summarize")
print("-" * 80)
if material_id:
    try:
        response = client.post("/api/v1/ai/assistant/summarize", json={
            "material_id": material_id
        }, headers=headers, timeout=30.0)
        
        if response.status_code == 200:
            summary = response.json()["summary"]
            print(f"✅ AI Summarize working!")
            print(f"   Summary: {summary[:200]}...")
        else:
            print(f"❌ Summarize failed: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
    except Exception as e:
        print(f"❌ Error: {e}")
else:
    print("⚠️  Skipped (no material)")

print()

# Step 5: Test AI Key Points
print("Step 5: Test AI Key Points")
print("-" * 80)
if material_id:
    try:
        response = client.post("/api/v1/ai/assistant/key-points", json={
            "material_id": material_id
        }, headers=headers, timeout=30.0)
        
        if response.status_code == 200:
            key_points = response.json()["key_points"]
            print(f"✅ AI Key Points working!")
            print(f"   Found {len(key_points)} key points:")
            for i, kp in enumerate(key_points[:3], 1):
                print(f"   {i}. {kp.get('point', 'N/A')[:80]}")
        else:
            print(f"❌ Key Points failed: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
    except Exception as e:
        print(f"❌ Error: {e}")
else:
    print("⚠️  Skipped (no material)")

print()

# Step 6: Test AI Chat
print("Step 6: Test AI Chat")
print("-" * 80)
if material_id:
    try:
        response = client.post("/api/v1/ai/assistant/chat", json={
            "material_ids": [material_id],
            "question": "What is supervised learning?",
            "history": []
        }, headers=headers, timeout=30.0)
        
        if response.status_code == 200:
            answer = response.json()["answer"]
            print(f"✅ AI Chat working!")
            print(f"   Q: What is supervised learning?")
            print(f"   A: {answer[:200]}...")
        else:
            print(f"❌ Chat failed: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
    except Exception as e:
        print(f"❌ Error: {e}")
else:
    print("⚠️  Skipped (no material)")

print()

# Step 7: Test AI Quiz Generation
print("Step 7: Test AI Quiz Generation")
print("-" * 80)
if material_id:
    try:
        response = client.post("/api/v1/ai/assistant/quiz", json={
            "material_id": material_id,
            "num_questions": 3
        }, headers=headers, timeout=30.0)
        
        if response.status_code == 200:
            questions = response.json()["questions"]
            print(f"✅ AI Quiz working!")
            print(f"   Generated {len(questions)} questions:")
            for i, q in enumerate(questions, 1):
                print(f"   {i}. {q.get('question', 'N/A')[:80]}")
        else:
            print(f"❌ Quiz failed: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
    except Exception as e:
        print(f"❌ Error: {e}")
else:
    print("⚠️  Skipped (no material)")

print()

# Summary
print("=" * 80)
print("TEST COMPLETE")
print("=" * 80)
print()
print("If all tests passed, your Gemini API key is working correctly! ✅")
print()

client.close()
