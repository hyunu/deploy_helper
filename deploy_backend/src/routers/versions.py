import os
import hashlib
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional

from ..database import get_db
from ..models import App, AppVersion, User, ReleaseChannel
from ..schemas import VersionResponse, VersionListResponse, VersionUpdate
from ..auth import get_current_active_user
from ..config import get_settings

router = APIRouter(prefix="/api/apps/{app_id}/versions", tags=["버전 관리"])
settings = get_settings()


def calculate_file_hash(file_path: str) -> str:
    """파일 SHA256 해시 계산"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def parse_version(version: str) -> tuple:
    """버전 문자열을 비교 가능한 튜플로 변환"""
    try:
        parts = version.split(".")
        return tuple(int(p) for p in parts)
    except (ValueError, AttributeError):
        return (0, 0, 0)


def compare_versions(v1: str, v2: str) -> int:
    """버전 비교: v1 > v2 이면 1, v1 < v2 이면 -1, 같으면 0"""
    t1 = parse_version(v1)
    t2 = parse_version(v2)
    if t1 > t2:
        return 1
    elif t1 < t2:
        return -1
    return 0


@router.get("", response_model=VersionListResponse)
async def get_versions(
    app_id: str,
    channel: Optional[ReleaseChannel] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """앱의 버전 목록 조회"""
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="앱을 찾을 수 없습니다"
        )
    
    query = db.query(AppVersion).filter(AppVersion.app_id == app.id)
    
    if channel:
        query = query.filter(AppVersion.channel == channel)
    
    total = query.count()
    versions = query.order_by(desc(AppVersion.created_at)).offset(skip).limit(limit).all()
    
    return VersionListResponse(versions=versions, total=total)


@router.post("", response_model=VersionResponse, status_code=status.HTTP_201_CREATED)
async def upload_version(
    app_id: str,
    version: str = Form(...),
    channel: ReleaseChannel = Form(ReleaseChannel.STABLE),
    release_notes: Optional[str] = Form(None),
    is_mandatory: bool = Form(False),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """새 버전 업로드"""
    # 앱 확인
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="앱을 찾을 수 없습니다"
        )
    
    # 버전 중복 체크
    existing = db.query(AppVersion).filter(
        AppVersion.app_id == app.id,
        AppVersion.version == version,
        AppVersion.channel == channel
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 버전입니다"
        )
    
    # 파일 저장
    upload_dir = os.path.join(settings.upload_dir, app_id, version)
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"파일 저장 실패: {str(e)}"
        )
    
    # 파일 정보 계산
    file_size = os.path.getsize(file_path)
    file_hash = calculate_file_hash(file_path)
    
    # 버전 생성
    new_version = AppVersion(
        app_id=app.id,
        version=version,
        channel=channel,
        release_notes=release_notes,
        is_mandatory=is_mandatory,
        file_name=file.filename,
        file_path=file_path,
        file_size=file_size,
        file_hash=file_hash,
        is_active=True,
        published_at=datetime.utcnow()
    )
    
    db.add(new_version)
    db.commit()
    db.refresh(new_version)
    
    return new_version


@router.get("/{version_id}", response_model=VersionResponse)
async def get_version(
    app_id: str,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """버전 상세 조회"""
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="앱을 찾을 수 없습니다"
        )
    
    version = db.query(AppVersion).filter(
        AppVersion.id == version_id,
        AppVersion.app_id == app.id
    ).first()
    
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="버전을 찾을 수 없습니다"
        )
    
    return version


@router.patch("/{version_id}", response_model=VersionResponse)
async def update_version(
    app_id: str,
    version_id: int,
    version_update: VersionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """버전 정보 수정 (릴리즈 노트 등)"""
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="앱을 찾을 수 없습니다")
    
    version = db.query(AppVersion).filter(
        AppVersion.id == version_id,
        AppVersion.app_id == app.id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="버전을 찾을 수 없습니다")
    
    update_data = version_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(version, key, value)
    
    db.commit()
    db.refresh(version)
    
    return version


@router.patch("/{version_id}/activate")
async def activate_version(
    app_id: str,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """버전 활성화"""
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="앱을 찾을 수 없습니다")
    
    version = db.query(AppVersion).filter(
        AppVersion.id == version_id,
        AppVersion.app_id == app.id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="버전을 찾을 수 없습니다")
    
    version.is_active = True
    db.commit()
    
    return {"message": "버전이 활성화되었습니다"}


@router.patch("/{version_id}/deactivate")
async def deactivate_version(
    app_id: str,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """버전 비활성화 (롤백용)"""
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="앱을 찾을 수 없습니다")
    
    version = db.query(AppVersion).filter(
        AppVersion.id == version_id,
        AppVersion.app_id == app.id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="버전을 찾을 수 없습니다")
    
    version.is_active = False
    db.commit()
    
    return {"message": "버전이 비활성화되었습니다"}


@router.delete("/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_version(
    app_id: str,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """버전 삭제"""
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="앱을 찾을 수 없습니다")
    
    version = db.query(AppVersion).filter(
        AppVersion.id == version_id,
        AppVersion.app_id == app.id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="버전을 찾을 수 없습니다")
    
    # 파일 삭제
    if os.path.exists(version.file_path):
        os.remove(version.file_path)
    
    db.delete(version)
    db.commit()
