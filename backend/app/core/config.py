from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DomCafe"
    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://dom_cafe_user:change_me@pgbouncer:6432/dom_cafe"
    redis_url: str = "redis://" + "redis" + ":" + "6379" + "/0"
    jwt_secret: str = "change_me_long_random"
    jwt_expires_minutes: int = 1440
    # Admin access also happens over plain-HTTP LAN/Tailscale paths, so the
    # Secure attribute is opt-in; set ADMIN_COOKIE_SECURE=true for HTTPS-only.
    admin_cookie_secure: bool = False
    agent_api_key: str = "change_me_long_random_agent_key"
    admin_default_username: str = "admin"
    admin_default_password: str = "change_me"
    upload_dir: str = "/app/uploads"
    max_upload_mb: int = 5
    discord_webhook_url: str = ""
    discord_notifications_enabled: bool = False

    # No dotenv source: Docker Compose injects .env into the container
    # environment (env_file: in docker-compose.yml); a dotenv path here
    # resolved nowhere in-container and only masked that fact.
    model_config = SettingsConfigDict(extra="ignore")

    @property
    def sqlalchemy_database_url(self) -> str:
        if "prepared_statement_cache_size" in self.database_url:
            return self.database_url
        if not self.database_url.startswith("postgresql+asyncpg://"):
            return self.database_url
        separator = "&" if "?" in self.database_url else "?"
        return f"{self.database_url}{separator}prepared_statement_cache_size=0"


@lru_cache
def get_settings() -> Settings:
    return Settings()
