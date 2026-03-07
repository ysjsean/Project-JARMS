from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):

    APP_NAME: str = "LLM Call Centre"

    ALLOWED_ORIGINS: List[str] = ["*"]

    LLM_ENDPOINT: str = "http://localhost:8001/v1/chat/completions"
    LLM_MODEL: str = "qwen3"

    REDIS_URL: str = "redis://localhost:6379"

    AUDIO_STORAGE: str = "./audio"

    MAX_QUEUE_SIZE: int = 500


settings = Settings()