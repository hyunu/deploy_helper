import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..database import get_db
from ..models import App, AppVersion, User, ReleaseChannel
from ..schemas import AppCreate, AppUpdate, AppResponse, AppListResponse, AppPublicResponse
from ..auth import get_current_active_user
from ..config import get_settings

settings = get_settings()

router = APIRouter(prefix="/api/apps", tags=["앱 관리"])


@router.get("", response_model=AppListResponse)
async def get_apps(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """앱 목록 조회"""
    total = db.query(func.count(App.id)).scalar()
    apps = db.query(App).offset(skip).limit(limit).all()
    return AppListResponse(apps=apps, total=total)


@router.post("", response_model=AppResponse, status_code=status.HTTP_201_CREATED)
async def create_app(
    app_data: AppCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """새 앱 등록"""
    # app_id 중복 체크
    existing_app = db.query(App).filter(App.app_id == app_data.app_id).first()
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 앱 ID입니다"
        )
    
    new_app = App(**app_data.model_dump())
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    
    return new_app


@router.post("/{app_id}/manual")
async def upload_manual(
    app_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """설명서 파일 업로드"""
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="앱을 찾을 수 없습니다"
        )
    
    # 설명서 파일 저장 디렉토리
    manual_dir = os.path.join(settings.upload_dir, app_id, "manual")
    os.makedirs(manual_dir, exist_ok=True)
    
    # 기존 설명서 파일이 있으면 삭제
    if app.manual_file_path and os.path.exists(app.manual_file_path):
        try:
            os.remove(app.manual_file_path)
        except Exception:
            pass  # 삭제 실패해도 계속 진행
    
    # 새 파일 저장
    file_path = os.path.join(manual_dir, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"파일 저장 실패: {str(e)}"
        )
    
    # 앱 정보 업데이트
    app.manual_file_path = file_path
    app.manual_file_name = file.filename
    
    db.commit()
    db.refresh(app)
    
    return {"message": "설명서 파일이 업로드되었습니다", "file_name": file.filename, "file_path": file_path}


@router.delete("/{app_id}/manual")
async def delete_manual(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """설명서 파일 삭제"""
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="앱을 찾을 수 없습니다"
        )
    
    if not app.manual_file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="등록된 설명서 파일이 없습니다"
        )
    
    # 파일 삭제
    if os.path.exists(app.manual_file_path):
        try:
            os.remove(app.manual_file_path)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"파일 삭제 실패: {str(e)}"
            )
    
    # 앱 정보 업데이트
    app.manual_file_path = None
    app.manual_file_name = None
    
    db.commit()
    db.refresh(app)
    
    return {"message": "설명서 파일이 삭제되었습니다"}


@router.get("/{app_id}", response_model=AppResponse)
async def get_app(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """앱 상세 조회"""
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="앱을 찾을 수 없습니다"
        )
    return app


@router.put("/{app_id}", response_model=AppResponse)
async def update_app(
    app_id: str,
    app_data: AppUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """앱 정보 수정 (상세 페이지 포함)"""
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="앱을 찾을 수 없습니다"
        )
    
    # app_id 변경 시 중복 체크
    if app_data.app_id != app_id:
        existing = db.query(App).filter(App.app_id == app_data.app_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 앱 ID입니다"
            )
    
    for key, value in app_data.model_dump().items():
        setattr(app, key, value)
    
    db.commit()
    db.refresh(app)
    
    return app


# ============ 공개 API (인증 불필요) ============

@router.get("/public/{app_id}", response_model=AppPublicResponse)
async def get_public_app(
    app_id: str,
    db: Session = Depends(get_db)
):
    """
    공개 앱 상세 페이지 조회 (인증 불필요)
    
    - 앱 정보, 상세 HTML, 커스텀 CSS 반환
    - 최신 버전 다운로드 URL 포함
    """
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="앱을 찾을 수 없습니다"
        )
    
    if not app.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비공개 앱입니다"
        )
    
    # 최신 활성 버전 조회 (버전 번호 기준)
    active_versions = db.query(AppVersion).filter(
        AppVersion.app_id == app.id,
        AppVersion.channel == ReleaseChannel.STABLE,
        AppVersion.is_active == True
    ).all()
    
    # 버전 번호 기준으로 최신 버전 선택
    def parse_version(version: str) -> tuple:
        try:
            return tuple(int(p) for p in version.split("."))
        except (ValueError, AttributeError):
            return (0, 0, 0)
    
    latest_version = max(active_versions, key=lambda v: parse_version(v.version)) if active_versions else None
    
    # 설명서 다운로드 URL 생성
    manual_download_url = None
    if app.manual_file_path:
        manual_download_url = f"/api/apps/public/{app.app_id}/manual"
    
    return AppPublicResponse(
        app_id=app.app_id,
        name=app.name,
        description=app.description,
        detail_html=app.detail_html,
        custom_css=app.custom_css,
        icon_url=app.icon_url,
        latest_version=latest_version.version if latest_version else None,
        download_url=f"/api/update/download/{latest_version.id}" if latest_version else None,
        file_size=latest_version.file_size if latest_version else None,
        manual_download_url=manual_download_url,
        manual_file_name=app.manual_file_name
    )


@router.get("/public/{app_id}/manual")
async def download_manual(
    app_id: str,
    db: Session = Depends(get_db)
):
    """
    설명서 파일 다운로드 (인증 불필요)
    """
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="앱을 찾을 수 없습니다"
        )
    
    if not app.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비공개 앱입니다"
        )
    
    if not app.manual_file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="설명서 파일이 없습니다"
        )
    
    if not os.path.exists(app.manual_file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="설명서 파일을 찾을 수 없습니다"
        )
    
    file_name = app.manual_file_name or os.path.basename(app.manual_file_path)
    
    return FileResponse(
        path=app.manual_file_path,
        filename=file_name,
        media_type="application/pdf" if file_name.lower().endswith('.pdf') else "application/octet-stream"
    )


@router.get("/public", response_model=AppListResponse)
async def get_public_apps_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """공개 앱 목록 조회 (인증 불필요)"""
    query = db.query(App).filter(App.is_public == True)
    total = query.count()
    apps = query.offset(skip).limit(limit).all()
    return AppListResponse(apps=apps, total=total)


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_app(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """앱 삭제"""
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="앱을 찾을 수 없습니다"
        )
    
    db.delete(app)
    db.commit()
