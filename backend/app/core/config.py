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
    
    # OpenRouter (fallback AI provider)
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "google/gemini-2.0-flash-exp:free"
    OPENROUTER_SITE_URL: str = "http://localhost:5173"
    OPENROUTER_APP_NAME: str = "Personal AI Study Coach"

    # Storage
    STORAGE_BACKEND: str = "local"
    STORAGE_LOCAL_PATH: str = "./uploads"
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_BUCKET: str = "study-materials"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
