# Deploy Helper Python SDK

Python 앱을 위한 자동 업데이트 클라이언트 라이브러리입니다.

## 설치

```bash
# 로컬 설치
pip install -e .

# 또는 직접 복사
cp -r deploy_helper /your/project/
```

## 빠른 시작

```python
from deploy_helper import AutoUpdater

# 업데이터 초기화
updater = AutoUpdater(
    server_url="http://배포서버:8000",
    app_id="com.company.myapp",
    current_version="1.0.0"
)

# 업데이트 확인
info = updater.check_for_update()

if info.update_available:
    print(f"새 버전 발견: v{info.latest_version}")
    print(f"릴리스 노트: {info.release_notes}")
    
    # 다운로드
    file_path = updater.download_update(info)
    
    # 설치 및 재시작
    updater.install_and_restart(file_path)
else:
    print("최신 버전입니다.")
```

## 진행률 표시

```python
from deploy_helper import AutoUpdater, DownloadProgress

def on_progress(progress: DownloadProgress):
    print(f"다운로드: {progress.percentage:.1f}%")

updater = AutoUpdater(
    server_url="http://배포서버:8000",
    app_id="com.company.myapp",
    current_version="1.0.0"
)

info = updater.check_for_update()
if info.update_available:
    file_path = updater.download_update(info, progress_callback=on_progress)
```

## 이벤트 콜백

```python
updater = AutoUpdater(
    server_url="http://배포서버:8000",
    app_id="com.company.myapp",
    current_version="1.0.0"
)

# 이벤트 핸들러 등록
updater.on_update_available = lambda info: print(f"업데이트 발견: {info.latest_version}")
updater.on_download_progress = lambda p: print(f"진행률: {p.percentage:.1f}%")
updater.on_download_complete = lambda path: print(f"다운로드 완료: {path}")
updater.on_error = lambda e: print(f"오류: {e}")

# 자동 주기적 확인
updater.config.auto_check_interval_minutes = 30
updater.start_auto_check()
```

## Context Manager 사용

```python
from deploy_helper import AutoUpdater

with AutoUpdater(
    server_url="http://배포서버:8000",
    app_id="com.company.myapp",
    current_version="1.0.0"
) as updater:
    info, file_path = updater.check_and_download()
    
    if file_path:
        updater.install_and_restart(file_path)
```

## 설정 옵션

| 옵션 | 타입 | 설명 | 기본값 |
|------|------|------|--------|
| `server_url` | str | Deploy Helper 서버 URL | (필수) |
| `app_id` | str | 앱 고유 ID | (필수) |
| `current_version` | str | 현재 앱 버전 | (필수) |
| `channel` | str | 배포 채널 | "stable" |
| `timeout_seconds` | int | API 타임아웃 | 30 |
| `download_path` | str | 다운로드 경로 | 시스템 임시 폴더 |
| `auto_check_interval_minutes` | int | 자동 확인 주기 (분) | 0 (비활성) |

## 플랫폼 지원

- Windows
- macOS
- Linux

## 요구 사항

- Python 3.8+
- requests 라이브러리
