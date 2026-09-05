#!/usr/bin/env python
"""Quick test script for auth endpoints."""
import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.services.auth_service import register_user, authenticate_user, create_refresh_token_record
from app.core.config import settings

async def test_auth():
    """Test registration and login flow."""
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # Test registration
            print("Testing registration...")
            user = await register_user(
                session,
                email="test@example.com",
                password="testpass123",
                full_name="Test User"
            )
            print(f"✓ User created: {user.email} (ID: {user.id})")
            
            # Test authentication
            print("\nTesting login...")
            auth_user = await authenticate_user(
                session,
                email="test@example.com",
                password="testpass123"
            )
            print(f"✓ Login successful: {auth_user.email}")
            
            # Test refresh token creation
            print("\nTesting refresh token...")
            refresh_token = await create_refresh_token_record(
                session,
                user_id=str(auth_user.id)
            )
            print(f"✓ Refresh token created: {refresh_token[:20]}...")
            
            print("\n✅ All auth tests passed!")
            return True
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            await engine.dispose()

if __name__ == "__main__":
    result = asyncio.run(test_auth())
    sys.exit(0 if result else 1)
