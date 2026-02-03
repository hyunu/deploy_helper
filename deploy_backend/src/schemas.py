from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from .models import ReleaseChannel


# ============ Auth Schemas ============

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None



# ============ App Schemas ============

class AppBase(BaseModel):
    app_id: str
    name: str
    description: Optional[str] = None
    group: Optional[str] = None


class AppCreate(AppBase):
    pass


class AppUpdate(AppBase):
    """앱 정보 수정 (상세 페이지 포함)"""
    detail_html: Optional[str] = None
    custom_css: Optional[str] = None
    icon_url: Optional[str] = None
    is_public: bool = True
    manual_file_path: Optional[str] = None
    manual_file_name: Optional[str] = None
    group: Optional[str] = None


class AppResponse(AppBase):
    id: int
    detail_html: Optional[str] = None
    custom_css: Optional[str] = None
    icon_url: Optional[str] = None
    is_public: bool = True
    manual_file_path: Optional[str] = None
    manual_file_name: Optional[str] = None
    group: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AppPublicResponse(BaseModel):
    """공개 페이지용 앱 정보"""
    app_id: str
    name: str
    description: Optional[str] = None
    group: Optional[str] = None
    detail_html: Optional[str] = None
    custom_css: Optional[str] = None
    icon_url: Optional[str] = None
    latest_version: Optional[str] = None
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    manual_download_url: Optional[str] = None
    manual_file_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class AppListResponse(BaseModel):
    apps: List[AppResponse]
    total: int


# ============ Version Schemas ============

class VersionBase(BaseModel):
    version: str
    channel: ReleaseChannel = ReleaseChannel.STABLE
    release_notes: Optional[str] = None
    is_mandatory: bool = False


class VersionCreate(VersionBase):
    pass


class VersionUpdate(BaseModel):
    version: Optional[str] = None
    channel: Optional[ReleaseChannel] = None
    release_notes: Optional[str] = None
    is_mandatory: Optional[bool] = None


class VersionResponse(VersionBase):
    id: int
    app_id: int
    file_name: str
    file_size: int
    file_hash: str
    is_active: bool
    download_count: int
    created_at: datetime
    published_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class VersionListResponse(BaseModel):
    versions: List[VersionResponse]
    total: int


# ============ Update Check Schemas ============

class UpdateCheckRequest(BaseModel):
    app_id: str
    current_version: str
    channel: ReleaseChannel = ReleaseChannel.STABLE


class UpdateCheckResponse(BaseModel):
    update_available: bool
    current_version: str
    latest_version: Optional[str] = None
    is_mandatory: bool = False
    release_notes: Optional[str] = None
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    file_hash: Optional[str] = None


# ============ Statistics Schemas ============

class AppStats(BaseModel):
    app_id: str
    app_name: str
    total_versions: int
    total_downloads: int
    latest_version: Optional[str] = None


class DashboardStats(BaseModel):
    total_apps: int
    total_versions: int
    total_downloads: int
    apps: List[AppStats]
