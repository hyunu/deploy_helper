from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import App, AppVersion, User
from ..schemas import DashboardStats, AppStats
from ..auth import get_current_active_user

router = APIRouter(prefix="/api/stats", tags=["통계"])


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """대시보드 통계 조회"""
    
    # 전체 앱 수
    total_apps = db.query(func.count(App.id)).scalar()
    
    # 전체 버전 수
    total_versions = db.query(func.count(AppVersion.id)).scalar()
    
    # 전체 다운로드 수
    total_downloads = db.query(func.sum(AppVersion.download_count)).scalar() or 0
    
    # 앱별 통계
    apps = db.query(App).all()
    app_stats = []
    
    for app in apps:
        versions = db.query(AppVersion).filter(AppVersion.app_id == app.id).all()
        
        # 최신 버전 찾기
        latest = None
        if versions:
            sorted_versions = sorted(
                versions,
                key=lambda v: tuple(int(p) for p in v.version.split(".") if p.isdigit()),
                reverse=True
            )
            latest = sorted_versions[0].version if sorted_versions else None
        
        app_stats.append(AppStats(
            app_id=app.app_id,
            app_name=app.name,
            total_versions=len(versions),
            total_downloads=sum(v.download_count for v in versions),
            latest_version=latest
        ))
    
    return DashboardStats(
        total_apps=total_apps,
        total_versions=total_versions,
        total_downloads=total_downloads,
        apps=app_stats
    )
