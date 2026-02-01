import logging
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from .database import Base, engine, SessionLocal
from .models import User
from .auth import get_password_hash
from .config import get_settings
from .routers import auth, apps, versions, update, stats, users

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()


def init_db():
    """데이터베이스 초기화 및 관리자 계정 생성"""
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 관리자 계정 확인 및 생성
        admin = db.query(User).filter(User.email == settings.admin_email).first()
        if not admin:
            admin = User(
                email=settings.admin_email,
                hashed_password=get_password_hash(settings.admin_password),
                is_active=True,
                is_admin=True
            )
            db.add(admin)
            db.commit()
            print(f"관리자 계정 생성됨: {settings.admin_email}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    # 시작 시
    print("Deploy Helper API 서버 시작...")
    init_db()
    yield
    # 종료 시
    print("Deploy Helper API 서버 종료...")


app = FastAPI(
    title="Deploy Helper API",
    description="Windows 프로그램 배포 및 자동 업데이트 시스템",
    version="1.0.0",
    lifespan=lifespan
)

# 전역 예외 핸들러
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """전역 예외 핸들러 - 모든 예외를 로깅하고 적절한 응답 반환"""
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}\n"
        f"Path: {request.url.path}\n"
        f"Method: {request.method}\n"
        f"Traceback: {traceback.format_exc()}"
    )
    
    # SQLAlchemy 에러 처리
    if isinstance(exc, SQLAlchemyError):
        logger.error(f"Database error: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "데이터베이스 오류가 발생했습니다. 서버 로그를 확인해주세요.",
                "error_type": "DatabaseError"
            }
        )
    
    # 기타 예외
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "서버 내부 오류가 발생했습니다. 서버 로그를 확인해주세요.",
            "error_type": type(exc).__name__
        }
    )

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)
app.include_router(apps.router)
app.include_router(versions.router)
app.include_router(update.router)
app.include_router(stats.router)
app.include_router(users.router)


@app.get("/")
async def root():
    """API 상태 확인"""
    return {
        "name": "Deploy Helper API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy"}
