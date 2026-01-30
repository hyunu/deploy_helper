# Deploy Helper - Windows 프로그램 배포 시스템

사내 Windows 데스크톱 프로그램(.NET)을 위한 자동 업데이트 및 버전 관리 시스템입니다.

## 주요 기능

- **자동 업데이트**: 클라이언트 프로그램에서 자동으로 새 버전 확인 및 업데이트
- **버전 관리**: 여러 버전 관리 및 롤백 지원
- **관리자 대시보드**: 웹 기반 버전 업로드 및 배포 관리
- **공개 다운로드 페이지**: 앱별 커스텀 HTML/CSS 랜딩 페이지
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
- **기본 계정**: admin / admin123

---

## .NET 클라이언트 연동 (자동 업데이트)

### 개요

자동 업데이트 기능을 사용하려면 **앱 개발 시 클라이언트 라이브러리를 연동**해야 합니다.

| 구성 요소 | 역할 | 상태 |
|-----------|------|------|
| Deploy Helper 서버 | 버전 정보 제공, 파일 호스팅 | ✅ 제공됨 |
| C# 클라이언트 라이브러리 | 서버 API 호출 도구 | ✅ 제공됨 |
| **사용자 앱** | **라이브러리 호출 코드 작성** | ⚠️ 개발 필요 |

### 1단계: 라이브러리 참조 추가

```bash
# client/DeployHelper.Client 폴더에서 NuGet 패키지 생성
cd client/DeployHelper.Client
dotnet pack -c Release

# 생성된 .nupkg 파일을 프로젝트에서 참조
# 또는 프로젝트 참조로 직접 추가
```

### 2단계: 앱에 자동 업데이트 코드 추가

#### 최소 구현 (약 15줄)

```csharp
using DeployHelper.Client;

// 앱 시작 시 실행
var updater = new AutoUpdater(new UpdaterConfig
{
    ServerUrl = "http://배포서버주소:8000",  // Deploy Helper 서버 URL
    AppId = "com.company.myapp",             // 관리자에서 등록한 앱 ID
    CurrentVersion = "1.0.0"                 // 현재 앱 버전
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

#### 전체 기능 구현 (WPF/WinForms)

```csharp
using DeployHelper.Client;

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
            AutoCheckIntervalMinutes = 30  // 30분마다 자동 확인
        });

        // 이벤트 핸들러 등록
        _updater.UpdateCheckCompleted += OnUpdateCheckCompleted;
        _updater.DownloadProgressChanged += OnDownloadProgress;
        _updater.DownloadCompleted += OnDownloadCompleted;
        _updater.ErrorOccurred += OnError;
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
        // 프로그레스 다이얼로그 표시
        var progress = new Progress<double>(p => 
        {
            ProgressBar.Value = p;
            StatusText.Text = $"다운로드 중... {p:F1}%";
        });

        var filePath = await _updater.DownloadUpdateAsync(info, progress);
        
        MessageBox.Show("다운로드 완료! 설치를 시작합니다.");
        _updater.InstallAndRestart(filePath);
    }

    private void OnDownloadProgress(object sender, DownloadProgressEventArgs e)
    {
        // 진행률 업데이트
        Dispatcher.Invoke(() => 
        {
            ProgressBar.Value = e.ProgressPercentage;
        });
    }

    private void OnDownloadCompleted(object sender, string filePath)
    {
        // 다운로드 완료 처리
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
┌─────────────────┐     GET /api/update/check?app_id=xxx&current_version=1.0.0
│  업데이트 확인   │─────────────────────────────────────────────────────────▶ 서버
└────────┬────────┘
         ▼
    업데이트 있음?
     ├── 아니오 → 정상 실행
     │
     ▼ 예
┌─────────────────┐
│  사용자 확인    │  (필수 업데이트면 강제)
└────────┬────────┘
         ▼
┌─────────────────┐     GET /api/update/download/{version_id}
│  파일 다운로드   │─────────────────────────────────────────────────────────▶ 서버
│  (진행률 표시)   │
└────────┬────────┘
         ▼
┌─────────────────┐
│  SHA256 검증    │  (파일 무결성 확인)
└────────┬────────┘
         ▼
┌─────────────────┐
│  설치 파일 실행  │  Setup.exe /silent
│  현재 앱 종료    │
└─────────────────┘
```

### 클라이언트 라이브러리 API

#### UpdaterConfig 설정

| 속성 | 타입 | 설명 | 기본값 |
|------|------|------|--------|
| `ServerUrl` | string | Deploy Helper 서버 URL | (필수) |
| `AppId` | string | 앱 고유 ID | (필수) |
| `CurrentVersion` | string | 현재 앱 버전 | (필수) |
| `Channel` | string | 배포 채널 | "stable" |
| `AutoCheckIntervalMinutes` | int | 자동 확인 주기 (분) | 0 (비활성) |
| `DownloadPath` | string | 다운로드 경로 | 시스템 임시 폴더 |
| `TimeoutSeconds` | int | API 타임아웃 | 30 |

#### AutoUpdater 메서드

| 메서드 | 설명 |
|--------|------|
| `CheckForUpdateAsync()` | 서버에서 업데이트 확인 |
| `DownloadUpdateAsync(info, progress?)` | 업데이트 파일 다운로드 |
| `InstallAndRestart(filePath, args?)` | 설치 실행 후 앱 종료 |
| `StartAutoCheck()` | 주기적 자동 확인 시작 |
| `StopAutoCheck()` | 자동 확인 중지 |

#### 이벤트

| 이벤트 | 설명 |
|--------|------|
| `UpdateCheckCompleted` | 업데이트 확인 완료 |
| `DownloadProgressChanged` | 다운로드 진행률 변경 |
| `DownloadCompleted` | 다운로드 완료 |
| `ErrorOccurred` | 오류 발생 |

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
| GET | `/api/apps/public/{app_id}` | 공개 앱 정보 |
| GET | `/p/{app_id}` | 앱 다운로드 페이지 |

---

## 폴더 구조

```
deploy_helper/
├── docker-compose.yml      # Docker 구성
├── .env.example            # 환경 변수 예시
├── server/                 # API 서버 (Python FastAPI)
│   └── src/
│       ├── main.py
│       ├── models.py
│       ├── schemas.py
│       └── routers/
│           ├── apps.py     # 앱 관리 API
│           ├── update.py   # 업데이트 API
│           └── auth.py     # 인증 API
├── web/                    # 관리자 대시보드 (React + TypeScript)
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── AppEditPage.tsx
│       │   └── PublicAppPage.tsx
│       └── components/
├── client/                 # .NET 클라이언트 라이브러리
│   ├── DeployHelper.Client/
│   │   ├── AutoUpdater.cs      # 자동 업데이트 클래스
│   │   ├── UpdaterConfig.cs    # 설정 클래스
│   │   └── UpdateInfo.cs       # 업데이트 정보 클래스
│   └── DeployHelper.Client.Sample/
│       └── Program.cs          # 사용 예시
└── scripts/                # 유틸리티 스크립트
    ├── start.sh / start.bat
    └── stop.sh / stop.bat
```

---

## 라이선스

내부 사용 전용
