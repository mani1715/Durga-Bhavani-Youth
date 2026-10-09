import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Explicitly load .env from backend directory or parent
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Festival & Donation Management SaaS Platform"
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./database.db")
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "5"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "1800"))
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_STORAGE_SECRET: str = os.getenv("SUPABASE_STORAGE_SECRET", "")
    SUPABASE_PUBLIC_BUCKET: str = os.getenv("SUPABASE_PUBLIC_BUCKET", "festival-public")
    SUPABASE_PRIVATE_BUCKET: str = os.getenv("SUPABASE_PRIVATE_BUCKET", "festival-private")
    
    # Storage Configuration ("supabase", "local", "s3")
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "supabase")
    LOCAL_STORAGE_DIR: str = os.getenv("LOCAL_STORAGE_DIR", "storage")
    
    # JWT Security Configuration
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-change-in-production-12345!")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS Origins (comma-separated string)
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")

    # AWS S3 Settings (if STORAGE_TYPE == "s3")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_STORAGE_BUCKET_NAME: str = os.getenv("AWS_STORAGE_BUCKET_NAME", "")
    AWS_S3_REGION_NAME: str = os.getenv("AWS_S3_REGION_NAME", "ap-south-1")

    @property
    def sanitized_database_url(self) -> str:
        """Returns a sanitized DB URL safe for logging with credentials hidden."""
        if not self.DATABASE_URL:
            return ""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(self.DATABASE_URL)
            if parsed.password:
                netloc = f"{parsed.username}:***@{parsed.hostname}"
                if parsed.port:
                    netloc += f":{parsed.port}"
                return parsed._replace(netloc=netloc).geturl()
            return self.DATABASE_URL
        except Exception:
            return "postgresql://***:***@***"

    class Config:
        case_sensitive = True
        extra = "allow"

settings = Settings()

