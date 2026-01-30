import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import App, AppVersion, ReleaseChannel
from ..schemas import UpdateCheckRequest, UpdateCheckResponse
from ..config import get_settings

router = APIRouter(prefix="/api/update", tags=["업데이트"])
settings = get_settings()


def parse_version(version: str) -> tuple:
    """버전 문자열을 비교 가능한 튜플로 변환"""
    try:
        parts = version.split(".")
        return tuple(int(p) for p in parts)
    except (ValueError, AttributeError):
        return (0, 0, 0)


def is_newer_version(current: str, latest: str) -> bool:
    """최신 버전이 현재 버전보다 새로운지 확인"""
    return parse_version(latest) > parse_version(current)


@router.get("/check", response_model=UpdateCheckResponse)
async def check_update(
    app_id: str = Query(..., description="앱 고유 ID"),
    current_version: str = Query(..., description="현재 설치된 버전"),
    channel: ReleaseChannel = Query(ReleaseChannel.STABLE, description="배포 채널"),
    db: Session = Depends(get_db)
):
    """
    업데이트 확인 API (클라이언트 호출용)
    
    인증 없이 호출 가능
    """
    # 앱 확인
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=404,
            detail="등록되지 않은 앱입니다"
        )
    
    # 최신 활성 버전 조회 (버전 번호 기준)
    latest_version = get_latest_active_version(db, app.id, channel)
    
    if not latest_version:
        return UpdateCheckResponse(
            update_available=False,
            current_version=current_version
        )
    
    # 버전 비교
    update_available = is_newer_version(current_version, latest_version.version)
    
    if not update_available:
        return UpdateCheckResponse(
            update_available=False,
            current_version=current_version,
            latest_version=latest_version.version
        )
    
    # 필수 업데이트 확인 (현재 버전과 최신 버전 사이에 필수 업데이트가 있는지)
    mandatory_updates = db.query(AppVersion).filter(
        AppVersion.app_id == app.id,
        AppVersion.channel == channel,
        AppVersion.is_active == True,
        AppVersion.is_mandatory == True
    ).all()
    
    is_mandatory = any(
        is_newer_version(current_version, v.version) and 
        (parse_version(v.version) <= parse_version(latest_version.version))
        for v in mandatory_updates
    )
    
    return UpdateCheckResponse(
        update_available=True,
        current_version=current_version,
        latest_version=latest_version.version,
        is_mandatory=is_mandatory,
        release_notes=latest_version.release_notes,
        download_url=f"/api/update/download/{latest_version.id}",
        file_size=latest_version.file_size,
        file_hash=latest_version.file_hash
    )


def get_latest_active_version(db: Session, app_db_id: int, channel: ReleaseChannel):
    """활성 버전 중 버전 번호가 가장 높은 것을 반환"""
    versions = db.query(AppVersion).filter(
        AppVersion.app_id == app_db_id,
        AppVersion.channel == channel,
        AppVersion.is_active == True
    ).all()
    
    if not versions:
        return None
    
    # 버전 번호 기준으로 정렬하여 최신 버전 반환
    return max(versions, key=lambda v: parse_version(v.version))


@router.get("/download/latest/{app_id}")
async def download_latest(
    app_id: str,
    channel: ReleaseChannel = Query(ReleaseChannel.STABLE),
    db: Session = Depends(get_db)
):
    """
    최신 버전 다운로드 (공개 페이지용)
    
    앱 ID로 최신 활성 버전을 바로 다운로드 (버전 번호 기준)
    """
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="앱을 찾을 수 없습니다")
    
    latest_version = get_latest_active_version(db, app.id, channel)
    
    if not latest_version:
        raise HTTPException(status_code=404, detail="다운로드 가능한 버전이 없습니다")
    
    if not os.path.exists(latest_version.file_path):
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")
    
    # 다운로드 카운트 증가
    latest_version.download_count += 1
    db.commit()
    
    return FileResponse(
        path=latest_version.file_path,
        filename=latest_version.file_name,
        media_type="application/octet-stream"
    )


@router.get("/download/{version_id}")
async def download_update(
    version_id: int,
    db: Session = Depends(get_db)
):
    """
    업데이트 파일 다운로드 (클라이언트 호출용)
    
    인증 없이 호출 가능
    """
    version = db.query(AppVersion).filter(AppVersion.id == version_id).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="버전을 찾을 수 없습니다")
    
    if not version.is_active:
        raise HTTPException(status_code=403, detail="비활성화된 버전입니다")
    
    if not os.path.exists(version.file_path):
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")
    
    # 다운로드 카운트 증가
    version.download_count += 1
    db.commit()
    
    return FileResponse(
        path=version.file_path,
        filename=version.file_name,
        media_type="application/octet-stream"
    )


@router.get("/history/{app_id}")
async def get_version_history(
    app_id: str,
    channel: ReleaseChannel = Query(ReleaseChannel.STABLE),
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db)
):
    """
    버전 히스토리 조회 (클라이언트 호출용)
    
    인증 없이 호출 가능
    """
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="앱을 찾을 수 없습니다")
    
    versions = db.query(AppVersion).filter(
        AppVersion.app_id == app.id,
        AppVersion.channel == channel,
        AppVersion.is_active == True
    ).all()
    
    # 버전 번호 기준 내림차순 정렬
    sorted_versions = sorted(versions, key=lambda v: parse_version(v.version), reverse=True)[:limit]
    
    return {
        "app_id": app_id,
        "channel": channel,
        "versions": [
            {
                "version": v.version,
                "release_notes": v.release_notes,
                "is_mandatory": v.is_mandatory,
                "published_at": v.published_at,
                "file_size": v.file_size
            }
            for v in sorted_versions
        ]
    }
