from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DomCafe"
    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://dom_cafe_user:change_me@pgbouncer:6432/dom_cafe"
    redis_url: str = "redis://" + "redis" + ":" + "6379" + "/0"

    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
