from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    redis_url: str = "redis://localhost:6379"
    secret_key: str
    base_url: str = "http://localhost:8000"
    slug_length: int = 7
    cors_origins: str = "http://localhost:5173"

    model_config = {"env_file": ".env"}

    @field_validator("database_url")
    @classmethod
    def force_asyncpg(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        return v


settings = Settings()
