#!/usr/bin/env python3
"""Test authentication flow including refresh token"""
import httpx
import time

BASE_URL = "http://localhost:8000"

print("=" * 80)
print("AUTHENTICATION FLOW TEST")
print("=" * 80)
print()

# Create client with cookie support
client = httpx.Client(base_url=BASE_URL, timeout=5.0)

# Test 1: Login with existing user
print("TEST 1: Login")
print("-" * 80)
response = client.post("/api/v1/auth/login", json={
    "email": "test@example.com",
    "password": "testpass123"
})

if response.status_code == 200:
    data = response.json()
    access_token = data["access_token"]
    print(f"✅ Login successful")
    print(f"   Access token: {access_token[:30]}...")
    print(f"   Expires in: {data.get('expires_in')} seconds")
    print(f"   Cookies received: {list(response.cookies.keys())}")
else:
    print(f"❌ Login failed: {response.status_code}")
    print(f"   Response: {response.text}")
    exit(1)

print()

# Test 2: Access protected endpoint
print("TEST 2: Access Protected Endpoint (/api/v1/auth/me)")
print("-" * 80)
response = client.get("/api/v1/auth/me", headers={
    "Authorization": f"Bearer {access_token}"
})

if response.status_code == 200:
    user = response.json()
    print(f"✅ Protected endpoint accessible")
    print(f"   User: {user.get('email')}")
    print(f"   ID: {user.get('id')}")
else:
    print(f"❌ Failed: {response.status_code}")
    print(f"   Response: {response.text}")

print()

# Test 3: Refresh token
print("TEST 3: Refresh Token (should use httpOnly cookie)")
print("-" * 80)
response = client.post("/api/v1/auth/refresh")

if response.status_code == 200:
    data = response.json()
    new_access_token = data["access_token"]
    print(f"✅ Token refresh successful")
    print(f"   New token: {new_access_token[:30]}...")
    print(f"   Expires in: {data.get('expires_in')} seconds")
    print(f"   Token changed: {new_access_token != access_token}")
    access_token = new_access_token
else:
    print(f"❌ Refresh failed: {response.status_code}")
    print(f"   Response: {response.text}")

print()

# Test 4: Logout
print("TEST 4: Logout")
print("-" * 80)
response = client.post("/api/v1/auth/logout")

if response.status_code == 200:
    print(f"✅ Logout successful")
else:
    print(f"❌ Logout failed: {response.status_code}")

print()

# Test 5: Try to refresh after logout (should fail)
print("TEST 5: Refresh After Logout (should fail)")
print("-" * 80)
response = client.post("/api/v1/auth/refresh")

if response.status_code == 401:
    print(f"✅ Correctly rejected (401)")
else:
    print(f"❌ Unexpected status: {response.status_code}")

print()
print("=" * 80)
print("AUTHENTICATION FLOW TEST COMPLETE")
print("=" * 80)
