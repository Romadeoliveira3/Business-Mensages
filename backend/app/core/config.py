from functools import lru_cache
from typing import Optional

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    project_name: str = "Business Messages Manager API"
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    postgres_server: str = "db"
    postgres_port: int = 5432
    postgres_db: str = "business_messages"
    postgres_user: str = "business_user"
    postgres_password: str = "business_pass"
    database_url: Optional[str] = None

    @computed_field
    @property
    def sqlalchemy_database_uri(self) -> str:
        """Construct the SQLAlchemy database URI."""

        if self.database_url:
            return self.database_url

        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_server}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()


settings = get_settings()
