import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "Google Maps Competitor Intelligence API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./data/app.db"
    
    # AI Providers
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    DEFAULT_AI_PROVIDER: str = "gemini"  # "gemini" or "openai"
    
    # Scraper Settings
    SELENIUM_HEADLESS: bool = True
    CHROME_BINARY_PATH: str = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    SCRAPE_DELAY_SECONDS: int = 3
    SCRAPE_TIMEOUT_SECONDS: int = 25
    SIMULATE_ON_FAILURE: bool = True  # If Google blocks or headless fails, gracefully fallback to realistic scraper simulation
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://localhost:8000"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
