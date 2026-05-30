from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DomCafe"
    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://dom_cafe_user:change_me@pgbouncer:6432/dom_cafe"
    redis_url: str = "redis://" + "redis" + ":" + "6379" + "/0"
    jwt_secret: str = "change_me_long_random"
    jwt_expires_minutes: int = 1440
    admin_default_username: str = "admin"
    admin_default_password: str = "change_me"

    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8", extra="ignore")

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
