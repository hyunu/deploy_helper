# Deploy Helper Swift SDK

macOS 및 iOS 앱을 위한 자동 업데이트 클라이언트 라이브러리입니다.

> 📋 **상태: 개발 예정**

## 예정 기능

```swift
import DeployHelper

let updater = AutoUpdater(
    serverUrl: "http://배포서버:8000",
    appId: "com.company.myapp",
    currentVersion: "1.0.0"
)

// 업데이트 확인
updater.checkForUpdate { result in
    switch result {
    case .success(let info):
        if info.updateAvailable {
            print("새 버전 발견: v\(info.latestVersion ?? "")")
            
            // 다운로드
            updater.downloadUpdate(info) { progress in
                print("다운로드: \(progress.percentage)%")
            } completion: { result in
                switch result {
                case .success(let filePath):
                    // macOS: DMG 열기
                    updater.installAndRestart(filePath)
                case .failure(let error):
                    print("오류: \(error)")
                }
            }
        }
    case .failure(let error):
        print("오류: \(error)")
    }
}
```

## async/await 지원 (예정)

```swift
// Swift 5.5+
Task {
    let info = try await updater.checkForUpdate()
    
    if info.updateAvailable {
        let filePath = try await updater.downloadUpdate(info) { progress in
            print("다운로드: \(progress.percentage)%")
        }
        
        updater.installAndRestart(filePath)
    }
}
```

## 플랫폼 지원 예정

- macOS (AppKit, SwiftUI)
- iOS (UIKit, SwiftUI) - 앱스토어 외 배포용

## 기여하기

이 SDK 개발에 관심이 있으시면 이슈를 열어주세요.
