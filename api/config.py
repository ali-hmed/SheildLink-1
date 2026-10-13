import os
from pydantic import BaseModel, Field

class Settings(BaseModel):
    google_safe_browsing_api_key: str = Field(
        default_factory=lambda: os.getenv("GOOGLE_SAFE_BROWSING_API_KEY", "").strip()
    )
    allowed_origins: list[str] = Field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
            if origin.strip()
        ]
    )
    rate_limit_per_minute: int = Field(
        default_factory=lambda: int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    )
    reputation_timeout_seconds: float = 5.0
    max_url_length: int = 2048

settings = Settings()
