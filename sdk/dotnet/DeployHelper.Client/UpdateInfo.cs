using System.Text.Json.Serialization;

namespace DeployHelper.Client;

/// <summary>
/// 업데이트 정보
/// </summary>
public class UpdateInfo
{
    /// <summary>
    /// 업데이트 가능 여부
    /// </summary>
    [JsonPropertyName("update_available")]
    public bool IsUpdateAvailable { get; set; }

    /// <summary>
    /// 현재 버전
    /// </summary>
    [JsonPropertyName("current_version")]
    public string CurrentVersion { get; set; } = string.Empty;

    /// <summary>
    /// 최신 버전
    /// </summary>
    [JsonPropertyName("latest_version")]
    public string? LatestVersion { get; set; }

    /// <summary>
    /// 필수 업데이트 여부
    /// </summary>
    [JsonPropertyName("is_mandatory")]
    public bool IsMandatory { get; set; }

    /// <summary>
    /// 릴리스 노트
    /// </summary>
    [JsonPropertyName("release_notes")]
    public string? ReleaseNotes { get; set; }

    /// <summary>
    /// 다운로드 URL
    /// </summary>
    [JsonPropertyName("download_url")]
    public string? DownloadUrl { get; set; }

    /// <summary>
    /// 파일 크기 (bytes)
    /// </summary>
    [JsonPropertyName("file_size")]
    public long? FileSize { get; set; }

    /// <summary>
    /// 파일 해시 (SHA256)
    /// </summary>
    [JsonPropertyName("file_hash")]
    public string? FileHash { get; set; }
}
