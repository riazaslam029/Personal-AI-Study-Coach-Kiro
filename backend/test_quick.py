#!/usr/bin/env python
import asyncio
import sys
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User

async def test_db():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).limit(5))
        users = result.scalars().all()
        print(f"✓ DB connection OK - {len(users)} users found")
        return True

if __name__ == "__main__":
    try:
        asyncio.run(test_db())
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
