using System.Diagnostics;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;

namespace DeployHelper.Client;

/// <summary>
/// 자동 업데이트 클라이언트
/// </summary>
public class AutoUpdater : IDisposable
{
    private readonly UpdaterConfig _config;
    private readonly HttpClient _httpClient;
    private Timer? _autoCheckTimer;
    private bool _disposed;

    /// <summary>
    /// 업데이트 확인 완료 이벤트
    /// </summary>
    public event EventHandler<UpdateInfo>? UpdateCheckCompleted;

    /// <summary>
    /// 다운로드 진행률 이벤트
    /// </summary>
    public event EventHandler<DownloadProgressEventArgs>? DownloadProgressChanged;

    /// <summary>
    /// 다운로드 완료 이벤트
    /// </summary>
    public event EventHandler<string>? DownloadCompleted;

    /// <summary>
    /// 오류 발생 이벤트
    /// </summary>
    public event EventHandler<Exception>? ErrorOccurred;

    public AutoUpdater(UpdaterConfig config)
    {
        _config = config ?? throw new ArgumentNullException(nameof(config));
        
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(_config.ServerUrl.TrimEnd('/') + "/"),
            Timeout = TimeSpan.FromSeconds(_config.TimeoutSeconds)
        };

        if (_config.AutoCheckIntervalMinutes > 0)
        {
            StartAutoCheck();
        }
    }

    /// <summary>
    /// 업데이트 확인
    /// </summary>
    public async Task<UpdateInfo> CheckForUpdateAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var url = $"api/update/check?app_id={Uri.EscapeDataString(_config.AppId)}" +
                      $"&current_version={Uri.EscapeDataString(_config.CurrentVersion)}" +
                      $"&channel={Uri.EscapeDataString(_config.Channel)}";

            var response = await _httpClient.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();

            var updateInfo = await response.Content.ReadFromJsonAsync<UpdateInfo>(
                cancellationToken: cancellationToken);

            if (updateInfo == null)
            {
                throw new InvalidOperationException("서버로부터 유효하지 않은 응답을 받았습니다.");
            }

            UpdateCheckCompleted?.Invoke(this, updateInfo);
            return updateInfo;
        }
        catch (Exception ex)
        {
            ErrorOccurred?.Invoke(this, ex);
            throw;
        }
    }

    /// <summary>
    /// 업데이트 다운로드
    /// </summary>
    public async Task<string> DownloadUpdateAsync(
        UpdateInfo updateInfo,
        IProgress<double>? progress = null,
        CancellationToken cancellationToken = default)
    {
        if (!updateInfo.IsUpdateAvailable || string.IsNullOrEmpty(updateInfo.DownloadUrl))
        {
            throw new InvalidOperationException("다운로드할 업데이트가 없습니다.");
        }

        try
        {
            var downloadPath = _config.DownloadPath ?? Path.GetTempPath();
            var fileName = $"update_{_config.AppId}_{updateInfo.LatestVersion}.exe";
            var filePath = Path.Combine(downloadPath, fileName);

            // 기존 파일 삭제
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            using var response = await _httpClient.GetAsync(
                updateInfo.DownloadUrl,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);

            response.EnsureSuccessStatusCode();

            var totalBytes = response.Content.Headers.ContentLength ?? updateInfo.FileSize ?? 0;

            using var contentStream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var fileStream = new FileStream(
                filePath,
                FileMode.Create,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 81920,
                useAsync: true);

            var buffer = new byte[81920];
            long totalBytesRead = 0;
            int bytesRead;

            while ((bytesRead = await contentStream.ReadAsync(buffer, cancellationToken)) > 0)
            {
                await fileStream.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
                totalBytesRead += bytesRead;

                if (totalBytes > 0)
                {
                    var progressPercent = (double)totalBytesRead / totalBytes * 100;
                    progress?.Report(progressPercent);
                    DownloadProgressChanged?.Invoke(this, new DownloadProgressEventArgs
                    {
                        BytesReceived = totalBytesRead,
                        TotalBytesToReceive = totalBytes,
                        ProgressPercentage = progressPercent
                    });
                }
            }

            // 해시 검증
            if (!string.IsNullOrEmpty(updateInfo.FileHash))
            {
                var calculatedHash = await CalculateFileHashAsync(filePath, cancellationToken);
                if (!string.Equals(calculatedHash, updateInfo.FileHash, StringComparison.OrdinalIgnoreCase))
                {
                    File.Delete(filePath);
                    throw new InvalidOperationException("다운로드된 파일의 무결성 검증에 실패했습니다.");
                }
            }

            DownloadCompleted?.Invoke(this, filePath);
            return filePath;
        }
        catch (Exception ex)
        {
            ErrorOccurred?.Invoke(this, ex);
            throw;
        }
    }

    /// <summary>
    /// 업데이트 확인 및 다운로드
    /// </summary>
    public async Task<(UpdateInfo Info, string? FilePath)> CheckAndDownloadAsync(
        IProgress<double>? progress = null,
        CancellationToken cancellationToken = default)
    {
        var updateInfo = await CheckForUpdateAsync(cancellationToken);

        if (!updateInfo.IsUpdateAvailable)
        {
            return (updateInfo, null);
        }

        var filePath = await DownloadUpdateAsync(updateInfo, progress, cancellationToken);
        return (updateInfo, filePath);
    }

    /// <summary>
    /// 업데이트 설치 (새 프로세스 실행 후 현재 앱 종료)
    /// </summary>
    public void InstallAndRestart(string installerPath, string? arguments = null)
    {
        if (!File.Exists(installerPath))
        {
            throw new FileNotFoundException("설치 파일을 찾을 수 없습니다.", installerPath);
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = installerPath,
            Arguments = arguments ?? "/silent",
            UseShellExecute = true
        };

        Process.Start(startInfo);
        Environment.Exit(0);
    }

    /// <summary>
    /// 자동 업데이트 체크 시작
    /// </summary>
    public void StartAutoCheck()
    {
        if (_config.AutoCheckIntervalMinutes <= 0)
        {
            return;
        }

        _autoCheckTimer?.Dispose();
        _autoCheckTimer = new Timer(
            async _ => await CheckForUpdateAsync(),
            null,
            TimeSpan.Zero,
            TimeSpan.FromMinutes(_config.AutoCheckIntervalMinutes));
    }

    /// <summary>
    /// 자동 업데이트 체크 중지
    /// </summary>
    public void StopAutoCheck()
    {
        _autoCheckTimer?.Dispose();
        _autoCheckTimer = null;
    }

    private static async Task<string> CalculateFileHashAsync(
        string filePath,
        CancellationToken cancellationToken)
    {
        using var sha256 = SHA256.Create();
        using var stream = new FileStream(
            filePath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 81920,
            useAsync: true);

        var hash = await sha256.ComputeHashAsync(stream, cancellationToken);
        return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
    }

    public void Dispose()
    {
        if (_disposed) return;

        _autoCheckTimer?.Dispose();
        _httpClient.Dispose();
        _disposed = true;

        GC.SuppressFinalize(this);
    }
}

/// <summary>
/// 다운로드 진행률 이벤트 인자
/// </summary>
public class DownloadProgressEventArgs : EventArgs
{
    public long BytesReceived { get; set; }
    public long TotalBytesToReceive { get; set; }
    public double ProgressPercentage { get; set; }
}
