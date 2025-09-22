"""
Application configuration settings.

This module manages all configuration variables for the application,
including database connections, external API settings, and security parameters.
"""

import os
from typing import List
from pydantic import BaseSettings, validator


class Settings(BaseSettings):
    """Application settings."""
    
    # Project Information
    PROJECT_NAME: str = "WTI Tech N-Tier Application"
    API_V1_STR: str = "/api/v1"
    
    # Database Configuration
    DATABASE_URL: str = "postgresql://wtitech_user:wtitech_pass@localhost:5432/wtitech"
    
    # External API Configuration
    EXTERNAL_API_BASE_URL: str = "https://jsonplaceholder.typicode.com"
    
    # Security Configuration
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Environment
    ENVIRONMENT: str = "development"
    
    class Config:
        case_sensitive = True
        env_file = ".env"


# Create settings instance
settings = Settings()