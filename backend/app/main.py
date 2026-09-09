import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.router import api_router
from app.core.config import settings
from app.core.database import engine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Warm the DB pool on startup so the first user request doesn't eat
    the TCP + TLS + Neon compute-wake latency (usually 3-6 seconds when
    the pool is cold and the DB is in a different region).
    """
    async def _warmup():
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            logger.info("DB pool warmed on startup")
        except Exception as e:  # pragma: no cover — best-effort
            logger.warning("DB pool warmup failed: %s", e)

    # Fire-and-forget so uvicorn accepts traffic immediately.
    asyncio.create_task(_warmup())
    yield
    await engine.dispose()


app = FastAPI(title="Study Coach API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https://personal-ai-study-coach-kiro.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
