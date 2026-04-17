"""Application configuration."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Field Inspector API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    database_url: str = "sqlite+aiosqlite:///./field_inspector.db"

    jwt_secret_key: str = "change-me-in-production-use-openssl-rand"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174"
    )

    seed_admin_email: str = "admin@example.com"
    seed_admin_password: str = "admin"

    # Supabase (server-only): создание auth.users + profiles из админки. Ключ service_role никогда не отдавать клиенту.
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""

    return Settings()
