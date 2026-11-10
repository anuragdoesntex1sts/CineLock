from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json
from pathlib import Path

BACKEND_ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_ENV_FILE, env_file_encoding="utf-8", case_sensitive=False)

    # App
    APP_NAME: str = "CineLock"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    CORS_ORIGINS: str = '["http://localhost:5173","http://127.0.0.1:5173"]'

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-key-change-in-production-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # TMDB
    TMDB_API_KEY: str = ""
    TMDB_BASE_URL: str = "https://api.themoviedb.org/3"
    TMDB_IMAGE_BASE_URL: str = "https://image.tmdb.org/t/p/w500"
    GEOAPIFY_API_KEY: str = ""
    YOUPI_API_BASE_URL: str = "http://localhost:6100"
    YOUPI_CHECKOUT_BASE_URL: str = "http://localhost:7000"
    YOUPI_MERCHANT_ID: str = ""
    YOUPI_MERCHANT_API_KEY: str = ""
    YOUPI_WEBHOOK_SECRET: str = ""

    # File Storage
    DATA_DIR: str = "./data"

    # Seat Locking
    SEAT_LOCK_TTL_MINUTES: int = 5
    SEAT_LOCK_CLEANUP_INTERVAL_SECONDS: int = 60


settings = Settings()
