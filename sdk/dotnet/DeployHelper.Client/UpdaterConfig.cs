namespace DeployHelper.Client;

/// <summary>
/// 자동 업데이트 클라이언트 설정
/// </summary>
public class UpdaterConfig
{
    /// <summary>
    /// 배포 서버 URL (예: http://localhost:8000)
    /// </summary>
    public required string ServerUrl { get; set; }

    /// <summary>
    /// 앱 고유 ID (서버에 등록된 app_id)
    /// </summary>
    public required string AppId { get; set; }

    /// <summary>
    /// 현재 설치된 버전
    /// </summary>
    public required string CurrentVersion { get; set; }

    /// <summary>
    /// 배포 채널 (stable, beta, alpha)
    /// </summary>
    public string Channel { get; set; } = "stable";

    /// <summary>
    /// 다운로드 임시 폴더 경로
    /// </summary>
    public string? DownloadPath { get; set; }

    /// <summary>
    /// HTTP 요청 타임아웃 (초)
    /// </summary>
    public int TimeoutSeconds { get; set; } = 300;

    /// <summary>
    /// 자동 업데이트 체크 간격 (분), 0이면 자동 체크 비활성화
    /// </summary>
    public int AutoCheckIntervalMinutes { get; set; } = 0;
}
