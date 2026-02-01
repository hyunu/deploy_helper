from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from .database import Base


class ReleaseChannel(str, enum.Enum):
    """배포 채널"""
    STABLE = "stable"
    BETA = "beta"
    ALPHA = "alpha"


class User(Base):
    """관리자 사용자"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class App(Base):
    """배포 대상 애플리케이션"""
    __tablename__ = "apps"
    
    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(String(100), unique=True, index=True, nullable=False)  # 고유 식별자 (예: com.company.myapp)
    name = Column(String(255), nullable=False)
    description = Column(Text)  # 간단한 설명
    
    # 상세 페이지 설정
    detail_html = Column(Text)  # 상세 페이지 HTML 콘텐츠 (WYSIWYG 에디터로 작성)
    custom_css = Column(Text)  # 사용자 정의 CSS
    icon_url = Column(String(500))  # 앱 아이콘 URL
    is_public = Column(Boolean, default=True)  # 공개 페이지 활성화 여부
    
    # 설명서 파일
    manual_file_path = Column(String(500))  # 설명서 파일 경로 (PDF 등)
    manual_file_name = Column(String(255))  # 설명서 파일명
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    versions = relationship("AppVersion", back_populates="app", cascade="all, delete-orphan")


class AppVersion(Base):
    """앱 버전"""
    __tablename__ = "app_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(Integer, ForeignKey("apps.id"), nullable=False)
    version = Column(String(50), nullable=False)  # Semantic versioning (예: 1.0.0)
    channel = Column(Enum(ReleaseChannel), default=ReleaseChannel.STABLE)
    release_notes = Column(Text)
    
    # 파일 정보
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # bytes
    file_hash = Column(String(64), nullable=False)  # SHA256
    
    # 상태
    is_active = Column(Boolean, default=True)  # 활성화 여부
    is_mandatory = Column(Boolean, default=False)  # 필수 업데이트 여부
    
    # 통계
    download_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    published_at = Column(DateTime(timezone=True))
    
    app = relationship("App", back_populates="versions")
    
    class Config:
        # 같은 앱에서 버전+채널 조합은 유일해야 함
        unique_together = [("app_id", "version", "channel")]
