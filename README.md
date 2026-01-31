# Deploy Helper - Windows 프로그램 배포 시스템

사내 Windows 데스크톱 프로그램(.NET)을 위한 자동 업데이트 및 버전 관리 시스템입니다.

## 주요 기능

*   **자동 업데이트**: 클라이언트 프로그램에서 자동으로 새 버전 확인 및 업데이트
*   **버전 관리**: 여러 버전 관리 및 롤백 지원
*   **관리자 대시보드**: 웹 기반 버전 업로드 및 배포 관리
*   **공개 다운로드 페이지**: 앱별 커스텀 HTML/CSS 랜딩 페이지
*   **Docker 기반**: 간편한 서버 구성 및 배포

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

`docker-compose.yml` 파일에서 사용하는 환경 변수들을 설정합니다. `.env.example` 파일을 `.env`로 복사하고, 필요한 값들을 수정하여 사용하세요.

```bash
# 환경 파일 복사
cp .env.example .env

# .env 파일 수정
nano .env
```

**`.env` 파일 주요 변수 설명:**

*   `API_PORT`: 백엔드 API 서버 포트 (기본값: `8000`)
*   `WEB_PORT`: 프론트엔드 웹 서버 포트 (기본값: `3000`)
*   `DB_PASSWORD`: PostgreSQL 데이터베이스 `postgres` 유저 비밀번호 (필수 변경!)
*   `SECRET_KEY`: 백엔드 API 인증을 위한 시크릿 키 (필수 변경!)
*   `ADMIN_EMAIL`: 초기 관리자 계정 이메일 (기본값: `admin@company.com`)
*   `ADMIN_PASSWORD`: 초기 관리자 계정 비밀번호 (기본값: `admin123`)

> `.env` 파일에 `ADMIN_EMAIL`과 `ADMIN_PASSWORD`를 직접 설정해야 초기 관리자 계정을 사용할 수 있습니다. 첫 로그인 후에는 비밀번호를 변경하는 것을 권장합니다.

### 2. Docker로 실행

```bash
# 전체 시스템 빌드 및 실행
docker-compose up -d --build

# 로그 확인
docker-compose logs -f
```

### 3. 접속

*   **관리자 대시보드**: http://localhost:3000
*   **API 문서**: http://localhost:8000/docs
*   **초기 관리자 계정**: `.env` 파일에 설정한 `ADMIN_EMAIL` / `ADMIN_PASSWORD`

---

## 자동 업데이트 메커니즘 (클라이언트 구현 필요)

Deploy Helper 서버는 앱의 업데이트 정보를 관리하고, 최신 버전의 설치 파일을 호스팅하며, 클라이언트의 업데이트 요청에 응답하는 역할을 합니다. **실제 자동 업데이트 기능을 사용하려면 앱을 개발할 때 클라이언트 코드에 직접 라이브러리를 연동하고 업데이트 로직을 구현해야 합니다.**

### 1. 클라이언트 SDK 연동

Deploy Helper는 다양한 언어로 클라이언트 SDK를 제공하여, 개발자들이 각자 사용하는 언어에 맞춰 쉽게 자동 업데이트 기능을 앱에 통합할 수 있도록 돕습니다. 현재는 주로 Windows 프로그램(.NET) 배포에 초점을 맞추고 있지만, SDK를 통해 다른 플랫폼(Electron, Node.js, macOS, iOS 등)으로 확장할 수 있는 유연성을 제공합니다.

| 구성 요소 | 역할 | 상태 |
|-----------|------|------|
| Deploy Helper 서버 | 버전 정보 제공, 파일 호스팅 | ✅ 제공됨 |
| C# 클라이언트 라이브러리 | 서버 API 호출 도구 | ✅ 제공됨 |
| **사용자 앱** | **라이브러리 호출 코드 작성** | ⚠️ 개발 필요 |

### 2. .NET 클라이언트 SDK 연동 가이드 (예시)

#### 1단계: 라이브러리 참조 추가

```bash
# sdk/dotnet/DeployHelper.Client 폴더에서 NuGet 패키지 생성
cd sdk/dotnet/DeployHelper.Client
dotnet pack -c Release

# 생성된 .nupkg 파일을 프로젝트에서 참조
# 또는 프로젝트 참조로 직접 추가
```

#### 2단계: 앱에 자동 업데이트 코드 추가

##### 최소 구현 (약 15줄)

```csharp
using DeployHelper.Client;
using System.Reflection; // Assembly 클래스를 위해 추가

// 앱 시작 시 실행
var updater = new AutoUpdater(new UpdaterConfig
{
    ServerUrl = "http://배포서버주소:8000",  // Deploy Helper 서버 URL
    AppId = "com.company.myapp",             // 관리자에서 등록한 앱 ID
    CurrentVersion = Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "1.0.0"
});

// 업데이트 확인
var info = await updater.CheckForUpdateAsync();

if (info.IsUpdateAvailable)
{
    // 다운로드 및 설치
    var filePath = await updater.DownloadUpdateAsync(info);
    updater.InstallAndRestart(filePath);  // 설치 후 앱 재시작
}
```

##### 전체 기능 구현 (WPF/WinForms)

```csharp
using DeployHelper.Client;
using System.Reflection;
using System.Windows; // MessageBox, Dispatcher 등을 위해 추가
using System.Threading.Tasks; // Task를 위해 추가

public partial class MainWindow : Window
{
    private AutoUpdater _updater;

    public MainWindow()
    {
        InitializeComponent();
        InitializeUpdater();
    }

    private void InitializeUpdater()
    {
        _updater = new AutoUpdater(new UpdaterConfig
        {
            ServerUrl = "http://배포서버주소:8000",
            AppId = "com.company.myapp",
            CurrentVersion = GetCurrentVersion(),
            Channel = "stable",            // 배포 채널 지정 (옵션)
            AutoCheckIntervalMinutes = 30  // 30분마다 자동 확인 (옵션)
        });

        // 이벤트 핸들러 등록
        _updater.UpdateCheckCompleted += OnUpdateCheckCompleted;
        _updater.DownloadProgressChanged += OnDownloadProgress;
        _updater.DownloadCompleted += OnDownloadCompleted;
        _updater.ErrorOccurred += OnError;

        // 자동 업데이트 확인 시작 (옵션)
        _updater.StartAutoCheck();
    }

    private string GetCurrentVersion()
    {
        return Assembly.GetExecutingAssembly()
            .GetName().Version?.ToString() ?? "1.0.0";
    }

    private async void OnUpdateCheckCompleted(object sender, UpdateInfo info)
    {
        if (!info.IsUpdateAvailable) return;

        // UI 스레드에서 실행
        await Dispatcher.InvokeAsync(async () =>
        {
            var message = $"새 버전 v{info.LatestVersion}이 있습니다.\n\n" +
                          $"{info.ReleaseNotes}\n\n" +
                          "지금 업데이트하시겠습니까?";

            // 필수 업데이트인 경우
            if (info.IsMandatory)
            {
                MessageBox.Show("필수 업데이트가 있습니다. 업데이트 후 계속 사용할 수 있습니다.");
                await DownloadAndInstall(info);
                return;
            }

            // 선택적 업데이트
            var result = MessageBox.Show(message, "업데이트 알림", 
                MessageBoxButton.YesNo, MessageBoxImage.Information);

            if (result == MessageBoxResult.Yes)
            {
                await DownloadAndInstall(info);
            }
        });
    }

    private async Task DownloadAndInstall(UpdateInfo info)
    {
        // 프로그레스 다이얼로그 표시 (UI 요소는 실제 앱에 맞게 구현)
        // ProgressBar.Value = 0;
        // StatusText.Text = "다운로드 중...";

        var progress = new Progress<double>(p => 
        {
            // UI 업데이트 (예: ProgressBar.Value = p;)
            // Dispatcher.Invoke(() => ProgressBar.Value = p);
            // Dispatcher.Invoke(() => StatusText.Text = $"다운로드 중... {p:F1}%");
        });

        var filePath = await _updater.DownloadUpdateAsync(info, progress);
        
        MessageBox.Show("다운로드 완료! 설치를 시작합니다.");
        _updater.InstallAndRestart(filePath);
    }

    private void OnDownloadProgress(object sender, DownloadProgressEventArgs e)
    {
        // 진행률 업데이트 (UI 스레드에서 처리 필요)
        // Dispatcher.Invoke(() => ProgressBar.Value = e.ProgressPercentage);
    }

    private void OnDownloadCompleted(object sender, string filePath)
    {
        // 다운로드 완료 처리 (옵션)
    }

    private void OnError(object sender, Exception ex)
    {
        Dispatcher.Invoke(() =>
        {
            MessageBox.Show($"업데이트 오류: {ex.Message}", "오류", 
                MessageBoxButton.OK, MessageBoxImage.Error);
        });
    }
}
```

### 업데이트 흐름

```
┌─────────────────┐
│   앱 시작       │
└────────┬────────┘
         ▼
┌─────────────────┐     GET /api/update/check?app_id=xxx&current_version=1.0.0&channel=stable
│  업데이트 확인   │─────────────────────────────────────────────────────────▶ Deploy Helper 서버
└────────┬────────┘
         ▼
    업데이트 있음?
     ├── 아니오 → 정상 실행 (StartAutoCheck로 주기적 확인)
     │
     ▼ 예
┌─────────────────┐
│  사용자 확인    │  (필수 업데이트면 강제 진행)
└────────┬────────┘
         ▼
┌─────────────────┐     GET /api/update/download/{version_id}
│  파일 다운로드   │─────────────────────────────────────────────────────────▶ Deploy Helper 서버
│  (진행률 표시)   │
└────────┬────────┘
         ▼
┌─────────────────┐
│  SHA256 검증    │  (파일 무결성 확인)
└────────┬────────┘
         ▼
┌─────────────────┐
│  설치 파일 실행  │  (클라이언트 앱은 설치 후 재시작)
│  현재 앱 종료    │
└─────────────────┘
```

### 파일 다운로드와 버전 활성화/비활성화 동기화

`http://배포서버주소:8000/api/update/download/latest/{app_id}` 엔드포인트는 해당 `app_id`에 대해 **가장 최신 버전 중 활성화된(is_active: true) 버전을 제공**합니다. 만약 최신 버전(예: v3)이 비활성화되면, 그 다음으로 최신인 활성화된 버전(예: v2)이 다운로드 경로로 제공됩니다. 즉, 파일 다운로드는 버전의 활성화/비활성화 상태와 동기화되어 동작합니다.

---

## API 엔드포인트

### 앱 관리 (인증 필요)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/apps` | 앱 목록 조회 |
| POST | `/api/apps` | 새 앱 등록 |
| GET | `/api/apps/{app_id}` | 앱 상세 조회 |
| PUT | `/api/apps/{app_id}` | 앱 정보 수정 |
| DELETE | `/api/apps/{app_id}` | 앱 삭제 |
| GET | `/api/apps/{app_id}/versions` | 버전 목록 조회 |
| POST | `/api/apps/{app_id}/versions` | 새 버전 업로드 |
| PATCH | `/api/apps/{app_id}/versions/{version_id}` | 특정 앱 버전 정보 업데이트 (릴리즈 노트, 활성/필수 여부 포함) |

### 업데이트 API (인증 불필요)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/update/check` | 업데이트 확인 |
| GET | `/api/update/download/{version_id}` | 특정 버전 다운로드 |
| GET | `/api/update/download/latest/{app_id}` | 최신 버전 다운로드 |
| GET | `/api/update/history/{app_id}` | 버전 히스토리 조회 |

### 공개 페이지 (인증 불필요)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/apps/public` | 공개 앱 목록 조회 |
| GET | `/api/apps/public/{app_id}` | 공개 앱 정보 |
| GET | `/p/{app_id}` | 앱 다운로드 페이지 |

### 사용자 관리 (인증 및 관리자 권한 필요)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/users` | 사용자 목록 조회 |
| POST | `/api/users` | 새 사용자 생성 |
| GET | `/api/users/{user_id}` | 특정 사용자 조회 |
| PUT | `/api/users/{user_id}` | 특정 사용자 정보 업데이트 (이메일, 활성, 관리자 여부) |
| DELETE | `/api/users/{user_id}` | 특정 사용자 삭제 |

---

## 폴더 구조

```
deploy_helper/
├── docker-compose.yml      # Docker 구성
├── .env.example            # 환경 변수 예시
├── deploy_backend/         # API 서버 (Python FastAPI)
│   └── src/
│       ├── main.py
│       ├── models.py
│       ├── schemas.py
│       └── routers/
│           ├── apps.py     # 앱 관리 API
│           ├── update.py   # 업데이트 API
│           ├── auth.py     # 인증 API
│           └── users.py    # 사용자 관리 API
├── deploy_frontend/        # 관리자 대시보드 (React + TypeScript)
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── AppEditPage.tsx
│       │   ├── PublicAppPage.tsx
│       │   └── UsersPage.tsx  # 사용자 관리 페이지
│       └── components/
├── sdk/                    # 클라이언트 SDK (언어별)
│   ├── dotnet/             # .NET SDK (C#) ✅
│   │   ├── DeployHelper.Client/
│   │   └── DeployHelper.Client.Sample/
│   ├── python/             # Python SDK ✅
│   │   └── deploy_helper/
│   ├── typescript/         # TypeScript SDK (예정)
│   └── swift/              # Swift SDK (예정)
└── setup/                  # 설치 및 실행 스크립트
    ├── start.sh / start.bat
    ├── stop.sh / stop.bat
    └── logs.sh
```

## SDK 지원 현황

| 언어 | 폴더 | 상태 | 플랫폼 |
|------|------|------|--------|
| **C# / .NET** | `sdk/dotnet/` | ✅ 완성 | Windows, macOS, Linux |
| **Python** | `sdk/python/` | ✅ 완성 | Windows, macOS, Linux |
| **TypeScript** | `sdk/typescript/` | 📋 예정 | Electron, Node.js |
| **Swift** | `sdk/swift/` | 📋 예정 | macOS, iOS |

---

## 라이선스

© 2024 Hyunu Factory. All rights reserved. Commercial use allowed.
