import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

class Settings(BaseModel):
    google_safe_browsing_api_key: str = Field(
        default_factory=lambda: os.getenv("GOOGLE_SAFE_BROWSING_API_KEY", "").strip()
    )
    allowed_origins: list[str] = Field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv(
                "ALLOWED_ORIGINS",
                "http://localhost:3000,http://127.0.0.1:3000,https://sheildlink.aliahmedxdev9.workers.dev"
            ).split(",")
            if origin.strip()
        ]
    )
    rate_limit_per_minute: int = Field(
        default_factory=lambda: int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    )
    reputation_timeout_seconds: float = 5.0
    max_url_length: int = 2048
    screenshot_service_url: str = Field(
        default_factory=lambda: os.getenv("SCREENSHOT_SERVICE_URL", "https://api.microlink.io").strip()
    )
    preview_cache_ttl_seconds: int = Field(
        default_factory=lambda: int(os.getenv("PREVIEW_CACHE_TTL_SECONDS", "600"))
    )
    preview_timeout_seconds: float = 8.0

settings = Settings()
