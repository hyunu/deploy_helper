"""
데이터 모델 정의
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class UpdaterConfig:
    """업데이터 설정"""
    server_url: str
    app_id: str
    current_version: str
    channel: str = "stable"
    timeout_seconds: int = 30
    download_path: Optional[str] = None
    auto_check_interval_minutes: int = 0


@dataclass
class UpdateInfo:
    """업데이트 정보"""
    update_available: bool
    current_version: str
    latest_version: Optional[str] = None
    is_mandatory: bool = False
    release_notes: Optional[str] = None
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    file_hash: Optional[str] = None


@dataclass
class DownloadProgress:
    """다운로드 진행 상태"""
    bytes_received: int
    total_bytes: int
    
    @property
    def percentage(self) -> float:
        if self.total_bytes <= 0:
            return 0.0
        return (self.bytes_received / self.total_bytes) * 100
