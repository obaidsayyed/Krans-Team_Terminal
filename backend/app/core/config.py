from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_SECRET_KEY: str = ""
    LYZR_API_URL: str = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/"
    LYZR_API_KEY: str = ""
    LYZR_USER_ID: str = ""
    LYZR_AGENT_ID: str = "6a97b13e5579d60760072668"
    LYZR_TIMEOUT_SECONDS: float = Field(default=60.0, gt=0)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
