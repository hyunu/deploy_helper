from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import logging

from .config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# 데이터베이스 연결 풀 설정 개선 (원격 서버 안정성 향상)
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # 연결 전 ping으로 연결 유효성 확인
    pool_recycle=3600,   # 1시간마다 연결 재사용
    pool_size=10,        # 연결 풀 크기
    max_overflow=20,     # 최대 오버플로우
    echo=False           # SQL 로깅 비활성화
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """데이터베이스 세션 의존성"""
    db = SessionLocal()
    try:
        # 연결 테스트
        db.execute("SELECT 1")
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database connection error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()
