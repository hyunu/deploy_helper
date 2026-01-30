# Deploy Helper - Windows 프로그램 배포 시스템

사내 Windows 데스크톱 프로그램(.NET)을 위한 자동 업데이트 및 버전 관리 시스템입니다.

## 주요 기능

- **자동 업데이트**: 클라이언트 프로그램에서 자동으로 새 버전 확인 및 업데이트
- **버전 관리**: 여러 버전 관리 및 롤백 지원
- **관리자 대시보드**: 웹 기반 버전 업로드 및 배포 관리
- **Docker 기반**: 간편한 서버 구성 및 배포

## 시스템 구성

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Windows 앱     │────▶│   API 서버      │◀────│  관리자 웹      │
│  (.NET Client)  │     │   (FastAPI)     │     │  (React)        │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────▼────────┐
                        │   PostgreSQL    │
                        │   + 파일 저장소  │
                        └─────────────────┘
```

## 빠른 시작

### 1. 환경 설정

```bash
# 환경 파일 복사
cp env.example .env

# .env 파일 수정 (필수: DB_PASSWORD, SECRET_KEY 변경)
nano .env
```

### 2. Docker로 실행

```bash
# 전체 시스템 빌드 및 실행
docker-compose up -d --build

# 로그 확인
docker-compose logs -f
```

### 3. 접속

- **관리자 대시보드**: http://localhost:3000
- **API 문서**: http://localhost:8000/docs

## .NET 클라이언트 연동

### NuGet 패키지 설치 (로컬)

```bash
# client/DeployHelper.Client 폴더에서
dotnet pack
```

### 사용 예시

```csharp
using DeployHelper.Client;

// 업데이트 클라이언트 초기화
var updater = new AutoUpdater(new UpdaterConfig
{
    ServerUrl = "http://your-server:8000",
    AppId = "your-app-id",
    CurrentVersion = "1.0.0"
});

// 업데이트 확인
var updateInfo = await updater.CheckForUpdateAsync();
if (updateInfo.IsUpdateAvailable)
{
    // 업데이트 다운로드 및 설치
    await updater.DownloadAndInstallAsync(updateInfo);
}
```

## API 엔드포인트

### 버전 관리

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/apps` | 앱 목록 조회 |
| POST | `/api/apps` | 새 앱 등록 |
| GET | `/api/apps/{app_id}/versions` | 버전 목록 조회 |
| POST | `/api/apps/{app_id}/versions` | 새 버전 업로드 |
| GET | `/api/apps/{app_id}/latest` | 최신 버전 정보 |

### 업데이트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/update/check` | 업데이트 확인 |
| GET | `/api/update/download/{version_id}` | 업데이트 파일 다운로드 |

## 폴더 구조

```
deploy_helper/
├── docker-compose.yml    # Docker 구성
├── .env.example          # 환경 변수 예시
├── server/               # API 서버 (Python FastAPI)
├── web/                  # 관리자 대시보드 (React)
├── client/               # .NET 클라이언트 라이브러리
└── scripts/              # 유틸리티 스크립트
```

## 라이선스

내부 사용 전용
