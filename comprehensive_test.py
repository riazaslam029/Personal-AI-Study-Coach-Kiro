#!/usr/bin/env python3
"""Comprehensive backend API testing script"""
import asyncio
import httpx
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

class TestRunner:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=BASE_URL, timeout=10.0)
        self.access_token = None
        self.cookies = {}
        self.test_user_email = f"test_{datetime.now().timestamp()}@test.com"
        self.results = []
        
    async def test(self, name, method, path, data=None, expect_status=200, use_auth=False):
        """Run a single test"""
        headers = {}
        if use_auth and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        try:
            if method == "GET":
                response = await self.client.get(path, headers=headers, cookies=self.cookies)
            elif method == "POST":
                response = await self.client.post(path, json=data, headers=headers, cookies=self.cookies)
            elif method == "PATCH":
                response = await self.client.patch(path, json=data, headers=headers, cookies=self.cookies)
            elif method == "DELETE":
                response = await self.client.delete(path, headers=headers, cookies=self.cookies)
            else:
                raise ValueError(f"Unknown method: {method}")
                
            # Update cookies
            if response.cookies:
                self.cookies.update(dict(response.cookies))
                
            status = response.status_code
            passed = status == expect_status
            
            result = {
                "name": name,
                "method": method,
                "path": path,
                "status": status,
                "expected": expect_status,
                "passed": passed,
                "response": response.text[:200] if not passed else "OK"
            }
            
            self.results.append(result)
            symbol = "✅" if passed else "❌"
            print(f"{symbol} {name}: {status} (expected {expect_status})")
            
            return response if passed else None
            
        except Exception as e:
            self.results.append({
                "name": name,
                "method": method,
                "path": path,
                "status": "ERROR",
                "expected": expect_status,
                "passed": False,
                "response": str(e)
            })
            print(f"❌ {name}: ERROR - {str(e)[:100]}")
            return None
            
    async def run_all_tests(self):
        """Run comprehensive test suite"""
        print("=" * 80)
        print("COMPREHENSIVE BACKEND API TEST SUITE")
        print("=" * 80)
        print()
        
        # PHASE 1: Health Check
        print("PHASE 1: Health Check")
        print("-" * 80)
        await self.test("Health Check", "GET", "/health")
        print()
        
        # PHASE 2: Authentication
        print("PHASE 2: Authentication Flow")
        print("-" * 80)
        
        # Register
        resp = await self.test(
            "Register New User",
            "POST",
            "/api/v1/auth/register",
            {
                "email": self.test_user_email,
                "password": "testpass123",
                "full_name": "Test User"
            },
            expect_status=201
        )
        
        # Login
        resp = await self.test(
            "Login",
            "POST",
            "/api/v1/auth/login",
            {
                "email": self.test_user_email,
                "password": "testpass123"
            }
        )
        
        if resp:
            data = resp.json()
            self.access_token = data.get("access_token")
            print(f"  → Access token received: {self.access_token[:30]}...")
            
        # Get current user
        await self.test("Get Current User", "GET", "/api/v1/auth/me", use_auth=True)
        
        # Test refresh
        await self.test("Refresh Token", "POST", "/api/v1/auth/refresh")
        
        print()
        
        # PHASE 3: Courses
        print("PHASE 3: Course Management")
        print("-" * 80)
        
        course_resp = await self.test(
            "Create Course",
            "POST",
            "/api/v1/courses",
            {
                "name": "Test Course",
                "code": "TEST101",
                "color": "#6366f1"
            },
            use_auth=True,
            expect_status=201
        )
        
        course_id = None
        if course_resp:
            course_id = course_resp.json().get("id")
            print(f"  → Created course ID: {course_id}")
            
        await self.test("List Courses", "GET", "/api/v1/courses", use_auth=True)
        
        if course_id:
            await self.test(
                "Get Course",
                "GET",
                f"/api/v1/courses/{course_id}",
                use_auth=True
            )
            await self.test(
                "Get Course Stats",
                "GET",
                f"/api/v1/courses/{course_id}/stats",
                use_auth=True
            )
            
        print()
        
        # PHASE 4: Tasks
        print("PHASE 4: Task Management")
        print("-" * 80)
        
        task_resp = await self.test(
            "Create Task",
            "POST",
            "/api/v1/tasks",
            {
                "title": "Test Task",
                "description": "Test description",
                "task_type": "assignment",
                "priority": "high",
                "difficulty": 3,
                "estimated_duration": 2.5,
                "due_date": "2026-09-10T00:00:00Z",
                "course_id": course_id
            },
            use_auth=True,
            expect_status=201
        )
        
        task_id = None
        if task_resp:
            task_id = task_resp.json().get("id")
            print(f"  → Created task ID: {task_id}")
            
        await self.test("List Tasks", "GET", "/api/v1/tasks", use_auth=True)
        
        if task_id:
            await self.test("Get Task", "GET", f"/api/v1/tasks/{task_id}", use_auth=True)
            await self.test(
                "Complete Task",
                "POST",
                f"/api/v1/tasks/{task_id}/complete",
                use_auth=True
            )
            
        print()
        
        # PHASE 5: Materials
        print("PHASE 5: Study Materials")
        print("-" * 80)
        
        material_resp = await self.test(
            "Paste Material",
            "POST",
            "/api/v1/materials/paste",
            {
                "title": "Test Notes",
                "content": "These are test notes for the comprehensive test suite.",
                "course_id": course_id
            },
            use_auth=True,
            expect_status=201
        )
        
        material_id = None
        if material_resp:
            material_id = material_resp.json().get("id")
            print(f"  → Created material ID: {material_id}")
            
        await self.test("List Materials", "GET", "/api/v1/materials", use_auth=True)
        
        if material_id:
            await self.test(
                "Get Material",
                "GET",
                f"/api/v1/materials/{material_id}",
                use_auth=True
            )
            
        print()
        
        # PHASE 6: AI Features (if we have materials)
        if material_id:
            print("PHASE 6: AI Features")
            print("-" * 80)
            
            # Note: These may fail if Gemini API is not responding
            await self.test(
                "AI Summarize",
                "POST",
                "/api/v1/ai/assistant/summarize",
                {"material_ids": [material_id]},
                use_auth=True
            )
            
            await self.test(
                "AI Key Points",
                "POST",
                "/api/v1/ai/assistant/key-points",
                {"material_ids": [material_id]},
                use_auth=True
            )
            
            await self.test(
                "AI Chat",
                "POST",
                "/api/v1/ai/assistant/chat",
                {
                    "material_ids": [material_id],
                    "question": "What is this about?",
                    "history": []
                },
                use_auth=True
            )
            
            print()
        
        # PHASE 7: Study Planner
        if task_id:
            print("PHASE 7: Study Planner")
            print("-" * 80)
            
            await self.test(
                "Generate Study Plan",
                "POST",
                "/api/v1/plan/generate",
                {
                    "start_date": "2026-09-02",
                    "end_date": "2026-09-09",
                    "available_hours_per_day": {
                        "monday": 3,
                        "tuesday": 3,
                        "wednesday": 3,
                        "thursday": 3,
                        "friday": 3,
                        "saturday": 5,
                        "sunday": 5
                    }
                },
                use_auth=True,
                expect_status=201
            )
            
            await self.test("Get Study Plan", "GET", "/api/v1/plan", use_auth=True)
            
            print()
        
        # PHASE 8: Summary
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r["passed"])
        failed = total - passed
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        print()
        
        if failed > 0:
            print("FAILED TESTS:")
            print("-" * 80)
            for r in self.results:
                if not r["passed"]:
                    print(f"❌ {r['name']}")
                    print(f"   Status: {r['status']} (expected {r['expected']})")
                    print(f"   Response: {r['response']}")
                    print()
        
        await self.client.aclose()
        
        return passed == total

async def main():
    runner = TestRunner()
    success = await runner.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit(asyncio.run(main()))
