"""Application configuration using Pydantic BaseSettings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 1440  # 24h

    # URLs
    FRONTEND_URL: str = "http://localhost:5173"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/callback"

    # Snowflake
    SNOWFLAKE_ACCOUNT: str = ""
    SNOWFLAKE_USER: str = ""
    SNOWFLAKE_PASSWORD: str = ""
    SNOWFLAKE_DATABASE: str = "BUDGETBRAWL_DB"
    SNOWFLAKE_SCHEMA: str = "APP"
    SNOWFLAKE_WAREHOUSE: str = "BUDGETBRAWL_WH"
    SNOWFLAKE_ROLE: str = "BUDGETBRAWL_ROLE"

    # Encryption key for Google refresh tokens (Fernet)
    ENCRYPTION_KEY: str = ""

    # Cortex model: mistral-large2 (best quality for JSON); mistral-7b fallback if cross-region disabled
    CORTEX_MODEL: str = "mistral-large2"


settings = Settings()
