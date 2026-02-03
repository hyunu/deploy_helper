import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, exists

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


@router.post("/{app_id}/icon")
async def upload_icon(
    app_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """앱 아이콘 이미지 업로드"""
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="앱을 찾을 수 없습니다"
        )
    
    # 이미지 파일 확장자 확인
    allowed_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"지원하지 않는 파일 형식입니다. 허용된 형식: {', '.join(allowed_extensions)}"
        )
    
    # 파일 크기 확인 (최대 5MB)
    max_size = 5 * 1024 * 1024  # 5MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다."
        )
    
    # 아이콘 파일 저장 디렉토리
    icon_dir = os.path.join(settings.upload_dir, app_id, "icon")
    os.makedirs(icon_dir, exist_ok=True)
    
    # 기존 아이콘 파일이 있으면 삭제
    if app.icon_url and app.icon_url.startswith('/api/apps/'):
        # 기존 업로드된 파일 경로 추출
        old_icon_path = os.path.join(icon_dir, os.path.basename(app.icon_url))
        if os.path.exists(old_icon_path):
            try:
                os.remove(old_icon_path)
            except Exception:
                pass  # 삭제 실패해도 계속 진행
    
    # 새 파일 저장 (확장자 유지)
    file_name = f"icon{file_ext}"
    file_path = os.path.join(icon_dir, file_name)
    
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"파일 저장 실패: {str(e)}"
        )
    
    # 앱 정보 업데이트 (서빙 URL로 저장)
    app.icon_url = f"/api/apps/{app_id}/icon"
    
    db.commit()
    db.refresh(app)
    
    return {"message": "아이콘이 업로드되었습니다", "icon_url": app.icon_url}


@router.delete("/{app_id}/icon")
async def delete_icon(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """앱 아이콘 삭제"""
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="앱을 찾을 수 없습니다"
        )
    
    if not app.icon_url or not app.icon_url.startswith('/api/apps/'):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="등록된 아이콘이 없습니다"
        )
    
    # 파일 삭제
    icon_dir = os.path.join(settings.upload_dir, app_id, "icon")
    if os.path.exists(icon_dir):
        try:
            # 디렉토리 내 모든 파일 삭제
            for file_name in os.listdir(icon_dir):
                file_path = os.path.join(icon_dir, file_name)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"파일 삭제 실패: {str(e)}"
            )
    
    # 앱 정보 업데이트
    app.icon_url = None
    
    db.commit()
    db.refresh(app)
    
    return {"message": "아이콘이 삭제되었습니다"}


@router.get("/{app_id}/icon")
async def get_icon(
    app_id: str,
    db: Session = Depends(get_db)
):
    """앱 아이콘 이미지 서빙"""
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="앱을 찾을 수 없습니다"
        )
    
    if not app.icon_url or not app.icon_url.startswith('/api/apps/'):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="등록된 아이콘이 없습니다"
        )
    
    # 아이콘 파일 찾기
    icon_dir = os.path.join(settings.upload_dir, app_id, "icon")
    if not os.path.exists(icon_dir):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="아이콘 파일을 찾을 수 없습니다"
        )
    
    # 디렉토리에서 첫 번째 이미지 파일 찾기
    icon_file = None
    for file_name in os.listdir(icon_dir):
        file_path = os.path.join(icon_dir, file_name)
        if os.path.isfile(file_path) and file_name.startswith('icon.'):
            icon_file = file_path
            break
    
    if not icon_file or not os.path.exists(icon_file):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="아이콘 파일을 찾을 수 없습니다"
        )
    
    # 파일 확장자로 MIME 타입 결정
    ext = os.path.splitext(icon_file)[1].lower()
    mime_types = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    }
    media_type = mime_types.get(ext, 'image/png')
    
    return FileResponse(icon_file, media_type=media_type)


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
# 별도 라우터로 분리하여 인증 미적용

public_router = APIRouter(prefix="/api/apps", tags=["공개 앱"])

@public_router.get("/public", response_model=AppListResponse)
async def get_public_apps_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    공개 앱 목록 조회 (인증 불필요)
    활성화된 버전이 있는 앱만 반환
    """
    # EXISTS를 사용하여 활성화된 버전이 있는 공개 앱만 조회 (중복 방지)
    query = db.query(App).filter(
        App.is_public == True,
        exists().where(
            and_(
                AppVersion.app_id == App.id,
                AppVersion.is_active == True,
                AppVersion.channel == ReleaseChannel.STABLE
            )
        )
    )
    
    total = query.count()
    apps = query.offset(skip).limit(limit).all()
    return AppListResponse(apps=apps, total=total)


@public_router.get("/public/{app_id}", response_model=AppPublicResponse)
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
    
    # 플레이스홀더 치환
    detail_html = app.detail_html or ""
    if detail_html:
        # 다운로드 버튼 HTML 생성
        download_button = ""
        if latest_version:
            download_button = f'<a href="/api/update/download/{latest_version.id}" class="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">다운로드</a>'
        
        # 설명서 다운로드 버튼 HTML 생성
        manual_download_button = ""
        if manual_download_url:
            manual_download_button = f'<a href="{manual_download_url}" class="inline-flex items-center justify-center px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition">[사용설명서]</a>'
        
        # 플레이스홀더 치환 (모든 플레이스홀더를 한 번에 처리)
        icon_url = app.icon_url or ""
        replacements = {
            "{{APP_NAME}}": app.name or "",
            "{{APP_DESCRIPTION}}": app.description or "",
            "{{APP_ID}}": app.app_id or "",
            "{{ICON_URL}}": icon_url or "",
            "{{DOWNLOAD_URL}}": f"/api/update/download/{latest_version.id}" if latest_version else "",
            "{{DOWNLOAD_BUTTON}}": download_button,
            "{{MANUAL_DOWNLOAD_URL}}": manual_download_url or "",
            "{{MANUAL_DOWNLOAD_BUTTON}}": manual_download_button,
            "{{LATEST_VERSION}}": latest_version.version if latest_version else ""
        }
        
        for placeholder, value in replacements.items():
            detail_html = detail_html.replace(placeholder, value)
        
        # 아이콘 URL이 없거나 유효하지 않으면 아이콘 영역 제거 (플레이스홀더 치환 후)
        if not icon_url or icon_url.strip() == "":
            import re
            # 아이콘 영역을 포함한 div 블록 제거 (id="app-icon-container"가 있는 div)
            detail_html = re.sub(
                r'<div[^>]*id="app-icon-container"[^>]*>.*?</div>',
                '',
                detail_html,
                flags=re.DOTALL | re.IGNORECASE
            )
            # 또는 mb-8 클래스를 가진 div 중 img 태그가 있고 src가 비어있는 경우
            detail_html = re.sub(
                r'<div[^>]*class="[^"]*mb-8[^"]*"[^>]*>\s*<!--\s*앱 아이콘\s*-->.*?<img[^>]*src=""[^>]*>.*?</div>',
                '',
                detail_html,
                flags=re.DOTALL | re.IGNORECASE
            )
            # 일반적인 패턴: mb-8 클래스를 가진 div 안에 빈 src를 가진 img가 있는 경우
            detail_html = re.sub(
                r'<div[^>]*class="[^"]*mb-8[^"]*"[^>]*>.*?<img[^>]*src=""[^>]*>.*?</div>',
                '',
                detail_html,
                flags=re.DOTALL | re.IGNORECASE
            )
    
    return AppPublicResponse(
        app_id=app.app_id,
        name=app.name,
        description=app.description,
        group=app.group,
        detail_html=detail_html,
        custom_css=app.custom_css,
        icon_url=app.icon_url,
        latest_version=latest_version.version if latest_version else None,
        download_url=f"/api/update/download/{latest_version.id}" if latest_version else None,
        file_size=latest_version.file_size if latest_version else None,
        manual_download_url=manual_download_url,
        manual_file_name=app.manual_file_name
    )


@public_router.get("/public/{app_id}/icon")
async def get_public_icon(
    app_id: str,
    db: Session = Depends(get_db)
):
    """공개 앱 아이콘 이미지 서빙 (인증 불필요)"""
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
    
    if not app.icon_url or not app.icon_url.startswith('/api/apps/'):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="등록된 아이콘이 없습니다"
        )
    
    # 아이콘 파일 찾기
    icon_dir = os.path.join(settings.upload_dir, app_id, "icon")
    if not os.path.exists(icon_dir):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="아이콘 파일을 찾을 수 없습니다"
        )
    
    # 디렉토리에서 첫 번째 이미지 파일 찾기
    icon_file = None
    for file_name in os.listdir(icon_dir):
        file_path = os.path.join(icon_dir, file_name)
        if os.path.isfile(file_path) and file_name.startswith('icon.'):
            icon_file = file_path
            break
    
    if not icon_file or not os.path.exists(icon_file):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="아이콘 파일을 찾을 수 없습니다"
        )
    
    # 파일 확장자로 MIME 타입 결정
    ext = os.path.splitext(icon_file)[1].lower()
    mime_types = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    }
    media_type = mime_types.get(ext, 'image/png')
    
    return FileResponse(icon_file, media_type=media_type)


@public_router.get("/public/{app_id}/manual")
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
