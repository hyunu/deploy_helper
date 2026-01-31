"""
자동 업데이트 클라이언트
"""

import os
import sys
import hashlib
import tempfile
import subprocess
import threading
from typing import Optional, Callable
from urllib.parse import urljoin, urlencode

import requests

from .models import UpdaterConfig, UpdateInfo, DownloadProgress


class AutoUpdater:
    """
    Deploy Helper 자동 업데이트 클라이언트
    
    사용 예시:
        updater = AutoUpdater(
            server_url="http://localhost:8000",
            app_id="com.company.myapp",
            current_version="1.0.0"
        )
        
        info = updater.check_for_update()
        if info.update_available:
            file_path = updater.download_update(info)
            updater.install_and_restart(file_path)
    """
    
    def __init__(
        self,
        server_url: str = None,
        app_id: str = None,
        current_version: str = None,
        config: UpdaterConfig = None,
        **kwargs
    ):
        """
        Args:
            server_url: 서버 URL
            app_id: 앱 고유 ID
            current_version: 현재 앱 버전
            config: UpdaterConfig 객체 (위 파라미터 대신 사용 가능)
            **kwargs: UpdaterConfig 추가 옵션
        """
        if config:
            self.config = config
        else:
            self.config = UpdaterConfig(
                server_url=server_url,
                app_id=app_id,
                current_version=current_version,
                **kwargs
            )
        
        self._session = requests.Session()
        self._session.timeout = self.config.timeout_seconds
        self._auto_check_timer: Optional[threading.Timer] = None
        
        # 콜백 함수들
        self.on_update_available: Optional[Callable[[UpdateInfo], None]] = None
        self.on_download_progress: Optional[Callable[[DownloadProgress], None]] = None
        self.on_download_complete: Optional[Callable[[str], None]] = None
        self.on_error: Optional[Callable[[Exception], None]] = None
    
    def check_for_update(self) -> UpdateInfo:
        """
        서버에서 업데이트 확인
        
        Returns:
            UpdateInfo: 업데이트 정보
        
        Raises:
            requests.RequestException: 서버 연결 실패
        """
        try:
            params = {
                "app_id": self.config.app_id,
                "current_version": self.config.current_version,
                "channel": self.config.channel
            }
            
            url = urljoin(self.config.server_url.rstrip("/") + "/", "api/update/check")
            response = self._session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            info = UpdateInfo(
                update_available=data.get("update_available", False),
                current_version=data.get("current_version", self.config.current_version),
                latest_version=data.get("latest_version"),
                is_mandatory=data.get("is_mandatory", False),
                release_notes=data.get("release_notes"),
                download_url=data.get("download_url"),
                file_size=data.get("file_size"),
                file_hash=data.get("file_hash")
            )
            
            if self.on_update_available and info.update_available:
                self.on_update_available(info)
            
            return info
            
        except Exception as e:
            if self.on_error:
                self.on_error(e)
            raise
    
    def download_update(
        self,
        update_info: UpdateInfo,
        progress_callback: Optional[Callable[[DownloadProgress], None]] = None
    ) -> str:
        """
        업데이트 파일 다운로드
        
        Args:
            update_info: 업데이트 정보
            progress_callback: 진행률 콜백 함수
        
        Returns:
            str: 다운로드된 파일 경로
        
        Raises:
            ValueError: 다운로드할 업데이트가 없음
            requests.RequestException: 다운로드 실패
            ValueError: 파일 무결성 검증 실패
        """
        if not update_info.update_available or not update_info.download_url:
            raise ValueError("다운로드할 업데이트가 없습니다.")
        
        try:
            # 다운로드 경로 설정
            download_dir = self.config.download_path or tempfile.gettempdir()
            filename = f"update_{self.config.app_id}_{update_info.latest_version}"
            
            # 플랫폼별 확장자
            if sys.platform == "win32":
                filename += ".exe"
            elif sys.platform == "darwin":
                filename += ".dmg"
            else:
                filename += ".tar.gz"
            
            file_path = os.path.join(download_dir, filename)
            
            # 기존 파일 삭제
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # 다운로드
            download_url = update_info.download_url
            if not download_url.startswith("http"):
                download_url = urljoin(self.config.server_url.rstrip("/") + "/", download_url.lstrip("/"))
            
            response = self._session.get(download_url, stream=True)
            response.raise_for_status()
            
            total_size = int(response.headers.get("content-length", 0)) or update_info.file_size or 0
            downloaded = 0
            
            with open(file_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        if total_size > 0:
                            progress = DownloadProgress(
                                bytes_received=downloaded,
                                total_bytes=total_size
                            )
                            
                            if progress_callback:
                                progress_callback(progress)
                            if self.on_download_progress:
                                self.on_download_progress(progress)
            
            # 해시 검증
            if update_info.file_hash:
                calculated_hash = self._calculate_file_hash(file_path)
                if calculated_hash.lower() != update_info.file_hash.lower():
                    os.remove(file_path)
                    raise ValueError("다운로드된 파일의 무결성 검증에 실패했습니다.")
            
            if self.on_download_complete:
                self.on_download_complete(file_path)
            
            return file_path
            
        except Exception as e:
            if self.on_error:
                self.on_error(e)
            raise
    
    def check_and_download(
        self,
        progress_callback: Optional[Callable[[DownloadProgress], None]] = None
    ) -> tuple[UpdateInfo, Optional[str]]:
        """
        업데이트 확인 및 다운로드를 한번에 수행
        
        Returns:
            tuple: (UpdateInfo, 파일 경로 또는 None)
        """
        info = self.check_for_update()
        
        if not info.update_available:
            return info, None
        
        file_path = self.download_update(info, progress_callback)
        return info, file_path
    
    def install_and_restart(self, installer_path: str, arguments: str = None):
        """
        설치 파일 실행 후 현재 앱 종료
        
        Args:
            installer_path: 설치 파일 경로
            arguments: 설치 인자 (기본: /silent 또는 플랫폼별 자동 설정)
        """
        if not os.path.exists(installer_path):
            raise FileNotFoundError(f"설치 파일을 찾을 수 없습니다: {installer_path}")
        
        if sys.platform == "win32":
            # Windows
            args = arguments or "/silent"
            subprocess.Popen([installer_path, args], shell=True)
        elif sys.platform == "darwin":
            # macOS
            if installer_path.endswith(".dmg"):
                subprocess.Popen(["open", installer_path])
            else:
                subprocess.Popen(["open", installer_path])
        else:
            # Linux
            if installer_path.endswith(".tar.gz"):
                # 압축 해제 후 실행 스크립트 실행
                subprocess.Popen(["tar", "-xzf", installer_path, "-C", os.path.dirname(installer_path)])
            else:
                os.chmod(installer_path, 0o755)
                subprocess.Popen([installer_path])
        
        sys.exit(0)
    
    def start_auto_check(self):
        """주기적 자동 업데이트 확인 시작"""
        if self.config.auto_check_interval_minutes <= 0:
            return
        
        self.stop_auto_check()
        
        def check():
            try:
                self.check_for_update()
            except:
                pass
            self._schedule_next_check()
        
        self._schedule_next_check()
    
    def _schedule_next_check(self):
        """다음 자동 확인 예약"""
        interval = self.config.auto_check_interval_minutes * 60
        self._auto_check_timer = threading.Timer(interval, self.check_for_update)
        self._auto_check_timer.daemon = True
        self._auto_check_timer.start()
    
    def stop_auto_check(self):
        """자동 업데이트 확인 중지"""
        if self._auto_check_timer:
            self._auto_check_timer.cancel()
            self._auto_check_timer = None
    
    @staticmethod
    def _calculate_file_hash(file_path: str) -> str:
        """SHA256 해시 계산"""
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha256.update(chunk)
        return sha256.hexdigest()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop_auto_check()
        self._session.close()
