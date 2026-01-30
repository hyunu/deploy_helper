using DeployHelper.Client;

Console.WriteLine("Deploy Helper 자동 업데이트 샘플");
Console.WriteLine("================================\n");

// 설정
var config = new UpdaterConfig
{
    ServerUrl = "http://localhost:8000",  // 배포 서버 URL
    AppId = "com.company.myapp",          // 앱 ID
    CurrentVersion = "1.0.0",             // 현재 버전
    Channel = "stable"                     // 배포 채널
};

using var updater = new AutoUpdater(config);

// 이벤트 핸들러 등록
updater.UpdateCheckCompleted += (sender, info) =>
{
    if (info.IsUpdateAvailable)
    {
        Console.WriteLine($"[알림] 새 버전 발견: v{info.LatestVersion}");
        if (info.IsMandatory)
        {
            Console.WriteLine("[알림] 필수 업데이트입니다.");
        }
    }
};

updater.DownloadProgressChanged += (sender, args) =>
{
    Console.Write($"\r다운로드 중... {args.ProgressPercentage:F1}%");
};

updater.DownloadCompleted += (sender, filePath) =>
{
    Console.WriteLine($"\n다운로드 완료: {filePath}");
};

updater.ErrorOccurred += (sender, ex) =>
{
    Console.WriteLine($"[오류] {ex.Message}");
};

try
{
    // 1. 업데이트 확인
    Console.WriteLine("업데이트 확인 중...\n");
    var updateInfo = await updater.CheckForUpdateAsync();

    Console.WriteLine($"현재 버전: v{updateInfo.CurrentVersion}");
    Console.WriteLine($"최신 버전: v{updateInfo.LatestVersion ?? "정보 없음"}");
    Console.WriteLine($"업데이트 필요: {(updateInfo.IsUpdateAvailable ? "예" : "아니오")}");

    if (updateInfo.IsUpdateAvailable)
    {
        Console.WriteLine($"\n릴리스 노트:\n{updateInfo.ReleaseNotes ?? "없음"}\n");

        // 2. 사용자 확인 (필수 업데이트가 아닌 경우)
        if (!updateInfo.IsMandatory)
        {
            Console.Write("업데이트를 다운로드하시겠습니까? (y/n): ");
            var response = Console.ReadLine();
            if (response?.ToLower() != "y")
            {
                Console.WriteLine("업데이트를 건너뜁니다.");
                return;
            }
        }

        // 3. 업데이트 다운로드
        Console.WriteLine("\n업데이트 다운로드 시작...");
        var progress = new Progress<double>(p => { /* 진행률 처리 */ });
        var filePath = await updater.DownloadUpdateAsync(updateInfo, progress);

        // 4. 설치 확인
        Console.Write("\n지금 설치하고 재시작하시겠습니까? (y/n): ");
        var installResponse = Console.ReadLine();
        if (installResponse?.ToLower() == "y")
        {
            Console.WriteLine("설치 시작...");
            updater.InstallAndRestart(filePath);
        }
        else
        {
            Console.WriteLine($"\n나중에 수동으로 설치하세요: {filePath}");
        }
    }
    else
    {
        Console.WriteLine("\n이미 최신 버전입니다.");
    }
}
catch (HttpRequestException ex)
{
    Console.WriteLine($"\n[오류] 서버에 연결할 수 없습니다: {ex.Message}");
    Console.WriteLine("서버가 실행 중인지 확인하세요.");
}
catch (Exception ex)
{
    Console.WriteLine($"\n[오류] {ex.Message}");
}

Console.WriteLine("\n아무 키나 누르면 종료합니다...");
Console.ReadKey();
