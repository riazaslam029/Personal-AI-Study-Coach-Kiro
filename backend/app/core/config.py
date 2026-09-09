from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/studycoach"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_db_url_driver(cls, v: str) -> str:
        """Ensure the URL uses the asyncpg driver.

        asyncpg does not accept sslmode/channel_binding as query params —
        it uses ssl=require instead.  We strip the unsupported params and
        replace the plain postgresql:// scheme with postgresql+asyncpg://.
        """
        if not isinstance(v, str):
            return v
        # Fix scheme
        if v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        # Strip asyncpg-incompatible query params, inject ssl=require if needed
        from urllib.parse import urlparse, urlencode, parse_qs, urlunparse
        parsed = urlparse(v)
        params = parse_qs(parsed.query, keep_blank_values=True)
        needs_ssl = "sslmode" in params or "channel_binding" in params
        # Remove unsupported params
        for key in ("sslmode", "channel_binding"):
            params.pop(key, None)
        if needs_ssl and "ssl" not in params:
            params["ssl"] = ["require"]
        new_query = urlencode({k: vv[0] for k, vv in params.items()})
        v = urlunparse(parsed._replace(query=new_query))
        return v

    # Auth
    JWT_SECRET_KEY: str = "dev-secret-key-at-least-32-characters-long"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AI Providers
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # OpenRouter — primary AI provider.
    OPENROUTER_API_KEY: str = ""
    # First entry of the cascade (kept for backward compat).
    OPENROUTER_MODEL: str = "nex-agi/nex-n2.5-mini:free"
    # Comma-separated cascade. Tried in order on transient errors
    # (429 rate limit, 5xx overload, 404 retired). Ordered fastest first
    # so the median request finishes in ~2 seconds; every entry was
    # observed responding with valid structured JSON on 2026-09-09.
    OPENROUTER_MODELS: str = (
        # Fast tier (< 3s)
        "nex-agi/nex-n2.5-mini:free,"
        "nvidia/nemotron-3-super-120b-a12b:free,"
        "nex-agi/nex-n2.5-pro:free,"
        # Medium tier (3-7s)
        "inclusionai/ling-3.0-flash-sante:free,"
        "poolside/laguna-s-2.1:free,"
        "inclusionai/ling-3.0-flash-fin:free,"
        "liquid/lfm-2.5-2.6b:free,"
        # Big / slower tier (9-14s) — last resort but very reliable
        "cohere/north-mini-code:free,"
        "nvidia/nemotron-3.5-lightning:free,"
        "dots-studio/dots-3-note-preview:free,"
        "nvidia/nemotron-3-ultra-550b-a55b:free"
    )

    # Which provider to try first. "openrouter" is the default because
    # its per-model rate limits are lighter than Gemini's shared quota.
    # Set to "gemini" if you have a paid Gemini key with high quota.
    AI_PRIMARY_PROVIDER: str = "openrouter"
    OPENROUTER_SITE_URL: str = "http://localhost:5173"
    OPENROUTER_APP_NAME: str = "Personal AI Study Coach"

    # Storage
    # Backend options: "local" (dev), "supabase" (prod), "s3" (prod, AWS)
    STORAGE_BACKEND: str = "local"
    STORAGE_LOCAL_PATH: str = "./uploads"

    # Supabase Storage
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_BUCKET: str = "study-materials"

    # AWS S3 Storage
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-south-1"
    S3_BUCKET: str = ""
    # Seconds; used when generating presigned URLs for private buckets
    S3_PRESIGNED_URL_TTL: int = 3600

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
