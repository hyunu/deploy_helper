# Deploy Helper TypeScript SDK

Electron, Node.js, 웹 앱을 위한 자동 업데이트 클라이언트 라이브러리입니다.

> 📋 **상태: 개발 예정**

## 예정 기능

```typescript
import { AutoUpdater } from 'deploy-helper-sdk';

const updater = new AutoUpdater({
    serverUrl: 'http://배포서버:8000',
    appId: 'com.company.myapp',
    currentVersion: '1.0.0'
});

// 업데이트 확인
const info = await updater.checkForUpdate();

if (info.updateAvailable) {
    console.log(`새 버전 발견: v${info.latestVersion}`);
    
    // 다운로드 (진행률 콜백)
    const filePath = await updater.downloadUpdate(info, (progress) => {
        console.log(`다운로드: ${progress.percentage.toFixed(1)}%`);
    });
    
    // 설치 및 재시작 (Electron)
    updater.installAndRestart(filePath);
}
```

## 플랫폼 지원 예정

- Electron (Windows, macOS, Linux)
- Node.js CLI 앱
- 웹 앱 (다운로드 링크 제공)

## 기여하기

이 SDK 개발에 관심이 있으시면 이슈를 열어주세요.
