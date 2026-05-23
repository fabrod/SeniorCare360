from pydantic import model_validator
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    PHARMACY_API_URL: Optional[str] = None
    PHARMACY_API_KEY: Optional[str] = None

    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    EXPO_ACCESS_TOKEN: Optional[str] = None

    APP_NAME: str = "SeniorCare360"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:19006,http://localhost:8081"
    SHOW_API_DOCS: bool = False

    @model_validator(mode="after")
    def validate_production_security(self):
        if self.ENVIRONMENT.lower() in {"production", "prod"}:
            if self.SECRET_KEY == "seniorcare360-dev-secret-key-change-in-production":
                raise ValueError("SECRET_KEY must be changed for production.")
            if "*" in self.cors_origins:
                raise ValueError("CORS_ORIGINS must not contain '*' in production.")
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT.lower() in {"development", "dev", "local"}

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
