from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # 데이터베이스
    database_url: str = "postgresql://postgres:postgres@localhost:5432/deploy_helper"
    
    # 보안
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24시간
    
    # 파일 업로드
    upload_dir: str = "/app/uploads"
    max_upload_size: int = 500 * 1024 * 1024  # 500MB
    
    # 관리자 초기 계정
    admin_email: str = "admin@company.com"
    admin_password: str = "admin123"
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
