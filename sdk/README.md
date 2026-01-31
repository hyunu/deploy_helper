# Deploy Helper SDK

Deploy Helper 서버와 연동하기 위한 클라이언트 SDK 모음입니다.

## 지원 언어

| 언어 | 폴더 | 상태 | 플랫폼 |
|------|------|------|--------|
| **C# / .NET** | `dotnet/` | ✅ 완성 | Windows, macOS, Linux |
| **Python** | `python/` | ✅ 완성 | Windows, macOS, Linux |
| **TypeScript** | `typescript/` | 📋 예정 | Electron, Node.js, Web |
| **Swift** | `swift/` | 📋 예정 | macOS, iOS |

## 공통 API

모든 SDK는 동일한 서버 API를 사용합니다:

```
GET  /api/update/check?app_id={앱ID}&current_version={버전}
GET  /api/update/download/{version_id}
GET  /api/update/download/latest/{app_id}
GET  /api/update/history/{app_id}
```

## 빠른 시작

### .NET (C#)

```csharp
using DeployHelper.Client;

var updater = new AutoUpdater(new UpdaterConfig
{
    ServerUrl = "http://서버주소:8000",
    AppId = "com.company.myapp",
    CurrentVersion = "1.0.0"
});

var info = await updater.CheckForUpdateAsync();
if (info.IsUpdateAvailable)
{
    var file = await updater.DownloadUpdateAsync(info);
    updater.InstallAndRestart(file);
}
```

### Python

```python
from deploy_helper import AutoUpdater

updater = AutoUpdater(
    server_url="http://서버주소:8000",
    app_id="com.company.myapp",
    current_version="1.0.0"
)

info = updater.check_for_update()
if info.update_available:
    file_path = updater.download_update(info)
    updater.install_and_restart(file_path)
```

### TypeScript (예정)

```typescript
import { AutoUpdater } from 'deploy-helper-sdk';

const updater = new AutoUpdater({
    serverUrl: 'http://서버주소:8000',
    appId: 'com.company.myapp',
    currentVersion: '1.0.0'
});

const info = await updater.checkForUpdate();
if (info.updateAvailable) {
    const filePath = await updater.downloadUpdate(info);
    updater.installAndRestart(filePath);
}
```

## 직접 HTTP 호출

SDK 없이 직접 API를 호출할 수도 있습니다:

```bash
# 업데이트 확인
curl "http://서버:8000/api/update/check?app_id=com.company.myapp&current_version=1.0.0"

# 최신 버전 다운로드
curl -O "http://서버:8000/api/update/download/latest/com.company.myapp"
```
