# Deploy Helper .NET SDK

Windows/macOS/Linux 데스크톱 앱(.NET)을 위한 자동 업데이트 클라이언트 라이브러리입니다.

## 설치

```bash
# NuGet 패키지 생성
cd DeployHelper.Client
dotnet pack -c Release

# 또는 프로젝트 참조로 직접 추가
```

## 빠른 시작

```csharp
using DeployHelper.Client;

// 업데이터 초기화
var updater = new AutoUpdater(new UpdaterConfig
{
    ServerUrl = "http://배포서버:8000",
    AppId = "com.company.myapp",
    CurrentVersion = "1.0.0"
});

// 업데이트 확인
var info = await updater.CheckForUpdateAsync();

if (info.IsUpdateAvailable)
{
    Console.WriteLine($"새 버전 발견: v{info.LatestVersion}");
    
    // 다운로드
    var filePath = await updater.DownloadUpdateAsync(info);
    
    // 설치 및 재시작
    updater.InstallAndRestart(filePath);
}
```

## 진행률 표시

```csharp
var progress = new Progress<double>(percent => 
{
    Console.WriteLine($"다운로드: {percent:F1}%");
});

var filePath = await updater.DownloadUpdateAsync(info, progress);
```

## 이벤트 핸들러

```csharp
updater.UpdateCheckCompleted += (s, info) =>
{
    if (info.IsUpdateAvailable)
    {
        Console.WriteLine($"업데이트 발견: v{info.LatestVersion}");
    }
};

updater.DownloadProgressChanged += (s, e) =>
{
    Console.WriteLine($"진행률: {e.ProgressPercentage:F1}%");
};

updater.DownloadCompleted += (s, path) =>
{
    Console.WriteLine($"다운로드 완료: {path}");
};

updater.ErrorOccurred += (s, ex) =>
{
    Console.WriteLine($"오류: {ex.Message}");
};
```

## 자동 주기적 확인

```csharp
var updater = new AutoUpdater(new UpdaterConfig
{
    ServerUrl = "http://배포서버:8000",
    AppId = "com.company.myapp",
    CurrentVersion = "1.0.0",
    AutoCheckIntervalMinutes = 30  // 30분마다 확인
});

// 자동 확인 시작 (생성자에서 자동 시작됨)
// updater.StartAutoCheck();

// 중지
// updater.StopAutoCheck();
```

## 설정 옵션

| 옵션 | 타입 | 설명 | 기본값 |
|------|------|------|--------|
| `ServerUrl` | string | Deploy Helper 서버 URL | (필수) |
| `AppId` | string | 앱 고유 ID | (필수) |
| `CurrentVersion` | string | 현재 앱 버전 | (필수) |
| `Channel` | string | 배포 채널 | "stable" |
| `TimeoutSeconds` | int | API 타임아웃 | 30 |
| `DownloadPath` | string | 다운로드 경로 | 시스템 임시 폴더 |
| `AutoCheckIntervalMinutes` | int | 자동 확인 주기 (분) | 0 (비활성) |

## 플랫폼 지원

- Windows (WPF, WinForms, Console)
- macOS (.NET MAUI, Console)
- Linux (Console)

## 요구 사항

- .NET 6.0 이상
