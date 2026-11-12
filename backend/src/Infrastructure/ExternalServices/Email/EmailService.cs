using System.Collections.Concurrent;
using System.Net;
using System.Net.Sockets;
using System.Text.Json;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Data.SqlClient;
using MimeKit;
using UniMind.Application.Common.Interfaces;

namespace UniMind.Infrastructure.ExternalServices.Email;

public class EmailService : IEmailService
{
    private readonly string? _connectionString;
    private readonly string _fallbackSettingsFilePath;
    private readonly object _settingsLock = new();
    private EmailSettingsDto _settings;
    private readonly ConcurrentQueue<DispatchedEmailRecord> _dispatches = new();

    public EmailService(
        string? smtpHost = null,
        int smtpPort = 587,
        string? senderEmail = null,
        string? senderName = null,
        string? password = null,
        bool enableSsl = true,
        string? connectionString = null)
    {
        _connectionString = connectionString;
        _fallbackSettingsFilePath = Path.Combine(AppContext.BaseDirectory, "unimind-email-settings.local.json");

        var host = !string.IsNullOrWhiteSpace(smtpHost)
            ? smtpHost.Trim()
            : (Environment.GetEnvironmentVariable("SMTP_HOST") ?? "smtp.gmail.com");

        var port = smtpPort > 0 ? smtpPort : 587;

        var sender = !string.IsNullOrWhiteSpace(senderEmail)
            ? senderEmail.Trim()
            : (Environment.GetEnvironmentVariable("SMTP_USER") ?? string.Empty);

        var name = !string.IsNullOrWhiteSpace(senderName)
            ? senderName.Trim()
            : "UniMind - Tham Vấn Tâm Lý Học Đường";

        var pass = !string.IsNullOrWhiteSpace(password)
            ? password
            : (Environment.GetEnvironmentVariable("SMTP_PASS") ?? string.Empty);

        _settings = new EmailSettingsDto(host, port, sender, name, pass, enableSsl);
        TryLoadPersistedSettings();
    }

    public EmailSettingsDto GetSettings()
    {
        lock (_settingsLock)
        {
            return _settings;
        }
    }

    public Task<bool> UpdateSettingsAsync(EmailSettingsDto settings)
    {
        var normalized = new EmailSettingsDto(
            SmtpHost: string.IsNullOrWhiteSpace(settings.SmtpHost) ? "smtp.gmail.com" : settings.SmtpHost.Trim(),
            SmtpPort: settings.SmtpPort > 0 ? settings.SmtpPort : 587,
            SenderEmail: (settings.SenderEmail ?? string.Empty).Trim(),
            SenderName: string.IsNullOrWhiteSpace(settings.SenderName) ? "UniMind - Tham Vấn Học Đường" : settings.SenderName.Trim(),
            Password: NormalizePassword(settings.Password),
            EnableSsl: settings.EnableSsl
        );

        lock (_settingsLock)
        {
            _settings = normalized;
        }

        TrySavePersistedSettings(normalized);
        return Task.FromResult(true);
    }

    public IReadOnlyList<DispatchedEmailRecord> GetRecentDispatches()
    {
        return _dispatches.Reverse().Take(50).ToList();
    }

    public async Task<bool> SendEmailAsync(
        string toEmail,
        string subject,
        string htmlBody,
        string? plainTextBody = null,
        CancellationToken cancellationToken = default)
    {
        var outcome = await SendEmailDetailedAsync(toEmail, subject, htmlBody, plainTextBody, null, cancellationToken);
        return outcome.Success;
    }

    public async Task<EmailSendOutcome> SendEmailDetailedAsync(
        string toEmail,
        string subject,
        string htmlBody,
        string? plainTextBody = null,
        EmailSettingsDto? overrideSettings = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(toEmail) || !toEmail.Contains('@'))
        {
            const string msg = "Địa chỉ email người nhận không hợp lệ hoặc bị trống.";
            RecordDispatch(toEmail ?? string.Empty, subject, plainTextBody ?? subject, false, msg);
            return new EmailSendOutcome(false, msg);
        }

        EmailSettingsDto activeSettings;
        lock (_settingsLock)
        {
            activeSettings = overrideSettings ?? _settings;
        }

        var smtpHost = string.IsNullOrWhiteSpace(activeSettings.SmtpHost) ? "smtp.gmail.com" : activeSettings.SmtpHost.Trim();
        var smtpPort = activeSettings.SmtpPort > 0 ? activeSettings.SmtpPort : 587;
        var senderEmail = (activeSettings.SenderEmail ?? string.Empty).Trim();
        var senderName = string.IsNullOrWhiteSpace(activeSettings.SenderName) ? "UniMind Học Đường" : activeSettings.SenderName.Trim();
        var cleanPassword = NormalizePassword(activeSettings.Password);

        if (string.IsNullOrWhiteSpace(senderEmail) || !senderEmail.Contains('@') || string.IsNullOrWhiteSpace(cleanPassword))
        {
            const string warnMsg = "Chưa cấu hình tài khoản Gmail hoặc Mật khẩu ứng dụng (App Password 16 ký tự). Vui lòng mở 'Cài đặt Gmail SMTP' để thiết lập.";
            Console.WriteLine($"[UniMind EmailService]: {warnMsg}");
            RecordDispatch(toEmail.Trim(), subject, plainTextBody ?? subject, false, warnMsg);
            return new EmailSendOutcome(false, warnMsg);
        }

        var message = new MimeMessage();
        try
        {
            message.From.Add(new MailboxAddress(senderName, senderEmail));
            message.To.Add(new MailboxAddress(toEmail.Trim(), toEmail.Trim()));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlBody,
                TextBody = plainTextBody ?? "Thông báo từ Hệ thống Tham vấn Tâm lý Học đường UniMind."
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            client.Timeout = 15000;

            var secureOption = smtpPort == 465
                ? SecureSocketOptions.SslOnConnect
                : (smtpPort == 587
                    ? SecureSocketOptions.StartTls
                    : (activeSettings.EnableSsl ? SecureSocketOptions.StartTlsWhenAvailable : SecureSocketOptions.None));

            await client.ConnectAsync(smtpHost, smtpPort, secureOption, cancellationToken);
            await client.AuthenticateAsync(senderEmail, cleanPassword, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            Console.WriteLine($"[UniMind EmailService]: Gửi email thành công tới {toEmail.Trim()} ({subject})");
            RecordDispatch(toEmail.Trim(), subject, plainTextBody ?? subject, true, null);
            return new EmailSendOutcome(true, null);
        }
        catch (AuthenticationException ex)
        {
            var errMsg = "Xác thực Gmail thất bại (535): Tài khoản Gmail hoặc App Password 16 ký tự không đúng. Vui lòng tạo lại App Password trong Google Account > Bảo mật > Xác minh 2 bước > Mật khẩu ứng dụng.";
            Console.WriteLine($"[UniMind EmailService AuthError]: {ex.Message}");
            RecordDispatch(toEmail.Trim(), subject, plainTextBody ?? subject, false, errMsg);
            return new EmailSendOutcome(false, errMsg);
        }
        catch (SmtpCommandException ex)
        {
            var errMsg = $"Máy chủ SMTP từ chối ({(int)ex.StatusCode}): {ex.Message}";
            Console.WriteLine($"[UniMind EmailService SmtpError]: {errMsg}");
            RecordDispatch(toEmail.Trim(), subject, plainTextBody ?? subject, false, errMsg);
            return new EmailSendOutcome(false, errMsg);
        }
        catch (Exception ex) when (ex is SocketException or TimeoutException or TaskCanceledException or SslHandshakeException)
        {
            var errMsg = $"Không thể kết nối tới {smtpHost}:{smtpPort}. Vui lòng kiểm tra kết nối Internet, tường lửa hoặc cổng SMTP.";
            Console.WriteLine($"[UniMind EmailService NetworkError]: {ex.Message}");
            RecordDispatch(toEmail.Trim(), subject, plainTextBody ?? subject, false, errMsg);
            return new EmailSendOutcome(false, errMsg);
        }
        catch (Exception ex)
        {
            var errMsg = $"Lỗi gửi thư: {ex.Message}";
            Console.WriteLine($"[UniMind EmailService Exception]: Không thể chuyển thư tới {toEmail.Trim()}: {ex.Message}");
            RecordDispatch(toEmail.Trim(), subject, plainTextBody ?? subject, false, errMsg);
            return new EmailSendOutcome(false, errMsg);
        }
    }

    public async Task<bool> SendMeetingInvitationAsync(
        string toEmail,
        string studentName,
        string bookingCode,
        string meetingUrl,
        string? appointmentDate = null,
        string? timeRange = null,
        CancellationToken cancellationToken = default)
    {
        var outcome = await SendMeetingInvitationDetailedAsync(
            toEmail,
            studentName,
            bookingCode,
            meetingUrl,
            appointmentDate,
            timeRange,
            cancellationToken
        );
        return outcome.Success;
    }

    public async Task<EmailSendOutcome> SendMeetingInvitationDetailedAsync(
        string toEmail,
        string studentName,
        string bookingCode,
        string meetingUrl,
        string? appointmentDate = null,
        string? timeRange = null,
        CancellationToken cancellationToken = default)
    {
        var subject = $"[UniMind] Chuyên viên đã mở phòng tư vấn trực tuyến - Ca hẹn #{bookingCode}";
        var dateDisplay = !string.IsNullOrWhiteSpace(appointmentDate) ? appointmentDate : DateTime.UtcNow.AddHours(7).ToString("dd/MM/yyyy");
        var timeDisplay = !string.IsNullOrWhiteSpace(timeRange) ? timeRange : "Hiện tại";

        var safeStudentName = WebUtility.HtmlEncode(studentName);
        var safeBookingCode = WebUtility.HtmlEncode(bookingCode);
        var safeDateDisplay = WebUtility.HtmlEncode(dateDisplay);
        var safeTimeDisplay = WebUtility.HtmlEncode(timeDisplay);
        var safeMeetingUrl = WebUtility.HtmlEncode(meetingUrl);

        var plainText = $@"Xin chào {studentName},

Chuyên viên tâm lý UniMind đã chính thức mở phòng tư vấn trực tuyến SafeRoom cho ca hẹn #{bookingCode}.

- Thời gian ca hẹn: {dateDisplay} ({timeDisplay})
- Hình thức: Tư vấn bảo mật trực tuyến SafeRoom (WebRTC P2P mã hóa đầu-cuối)
- Đường dẫn tham gia phòng họp: {meetingUrl}

Vui lòng bấm vào liên kết trên để kết nối trực tiếp với chuyên viên tham vấn.

Trân trọng,
Phòng Chăm Sóc Sức Khỏe Tinh Thần Sinh Viên UniMind - ĐH Lạc Hồng";

        var html = $@"<!DOCTYPE html>
<html lang=""vi"">
<head>
  <meta charset=""utf-8"">
  <title>UniMind - Thông báo mở phòng tư vấn</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;"">
  <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""background-color: #f1f5f9; padding: 30px 10px;"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" width=""100%"" style=""max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); border: 1px solid #e2e8f0;"" cellspacing=""0"" cellpadding=""0"" border=""0"">
          <tr>
            <td style=""background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 32px 30px; text-align: center; color: #ffffff;"">
              <div style=""display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 12px;"">
                🌿 UNIMIND TRẠM THAM VẤN HỌC ĐƯỜNG
              </div>
              <h1 style=""margin: 0; font-size: 23px; font-weight: 800; line-height: 1.3;"">
                Chuyên viên đã mở phòng tư vấn
              </h1>
              <p style=""margin: 8px 0 0; font-size: 14.5px; opacity: 0.95;"">
                Phòng họp SafeRoom sẵn sàng kết nối bảo mật trực tuyến
              </p>
            </td>
          </tr>
          <tr>
            <td style=""padding: 32px 30px;"">
              <p style=""margin: 0 0 16px; font-size: 15.5px; line-height: 1.6;"">
                Xin chào <strong>{safeStudentName}</strong>,
              </p>
              <p style=""margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;"">
                Chuyên viên tâm lý phụ trách đã bắt đầu mở phòng tư vấn trực tuyến cho ca hẹn của bạn. Hãy kết nối ngay vào phòng họp để bắt đầu phiên chia sẻ và nhận hỗ trợ chuyên môn kịp thời.
              </p>
              <table role=""presentation"" width=""100%"" style=""background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 26px;"" cellspacing=""0"" cellpadding=""0"" border=""0"">
                <tr>
                  <td style=""padding: 18px 20px;"">
                    <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" border=""0"">
                      <tr>
                        <td style=""padding: 6px 0; font-size: 13.5px; color: #64748b; width: 140px;"">Mã ca hẹn:</td>
                        <td style=""padding: 6px 0; font-size: 14px; font-weight: 700; color: #0f172a;"">#{safeBookingCode}</td>
                      </tr>
                      <tr>
                        <td style=""padding: 6px 0; font-size: 13.5px; color: #64748b;"">Thời gian:</td>
                        <td style=""padding: 6px 0; font-size: 14px; font-weight: 600; color: #0f172a;"">{safeDateDisplay} ({safeTimeDisplay})</td>
                      </tr>
                      <tr>
                        <td style=""padding: 6px 0; font-size: 13.5px; color: #64748b;"">Hình thức:</td>
                        <td style=""padding: 6px 0; font-size: 14px; font-weight: 600; color: #0d9488;"">🎥 Tư vấn trực tuyến (SafeRoom)</td>
                      </tr>
                      <tr>
                        <td style=""padding: 6px 0; font-size: 13.5px; color: #64748b;"">Trạng thái:</td>
                        <td style=""padding: 6px 0; font-size: 14px; font-weight: 700; color: #16a34a;"">🟢 Đang diễn ra - Chuyên viên đang đợi</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div style=""text-align: center; margin: 30px 0 24px;"">
                <a href=""{safeMeetingUrl}"" target=""_blank"" style=""display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 999px; font-weight: 700; font-size: 15.5px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);"">
                  🚀 Kết Nối Vào Phòng Tư Vấn Ngay
                </a>
              </div>
              <p style=""margin: 0 0 16px; font-size: 12.5px; color: #64748b; line-height: 1.5; text-align: center;"">
                Nếu không thể bấm nút trên, hãy sao chép đường dẫn sau vào trình duyệt:<br>
                <a href=""{safeMeetingUrl}"" style=""color: #0d9488; word-break: break-all;"">{safeMeetingUrl}</a>
              </p>
              <div style=""background: #ecfdf5; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 8px; margin-top: 24px;"">
                <p style=""margin: 0; font-size: 12.5px; color: #065f46; line-height: 1.5;"">
                  🔒 <strong>Cam kết bảo mật & Quyền riêng tư:</strong> Phiên tư vấn được bảo vệ theo nguyên tắc ẩn danh và mã hóa kết nối P2P. Bạn có quyền chọn bật/tắt camera hoặc microphone tùy mức độ thoải mái.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style=""background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 30px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6;"">
              <p style=""margin: 0 0 4px;"">Dự án Hệ thống Nhật ký Cảm xúc & Tư vấn Tâm lý Ẩn danh Sinh viên (UniMind)</p>
              <p style=""margin: 0;"">Trường Đại học Lạc Hồng &copy; 2026. Mọi quyền được bảo lưu.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

        return await SendEmailDetailedAsync(toEmail, subject, html, plainText, null, cancellationToken);
    }

    private static string NormalizePassword(string? rawPassword)
    {
        return (rawPassword ?? string.Empty).Replace(" ", string.Empty).Trim();
    }

    private void TryLoadPersistedSettings()
    {
        if (!string.IsNullOrWhiteSpace(_connectionString))
        {
            try
            {
                using var conn = new SqlConnection(_connectionString);
                conn.Open();

                using (var ensureCmd = new SqlCommand(@"
                    IF OBJECT_ID('dbo.SystemEmailSettings', 'U') IS NULL
                    BEGIN
                        CREATE TABLE dbo.SystemEmailSettings (
                            Id INT PRIMARY KEY,
                            SmtpHost NVARCHAR(200) NOT NULL,
                            SmtpPort INT NOT NULL,
                            SenderEmail NVARCHAR(200) NOT NULL,
                            SenderName NVARCHAR(200) NOT NULL,
                            AppPassword NVARCHAR(500) NOT NULL,
                            EnableSsl BIT NOT NULL DEFAULT 1,
                            UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
                        );
                    END", conn))
                {
                    ensureCmd.ExecuteNonQuery();
                }

                using var selectCmd = new SqlCommand(
                    "SELECT TOP 1 SmtpHost, SmtpPort, SenderEmail, SenderName, AppPassword, EnableSsl FROM dbo.SystemEmailSettings WHERE Id = 1",
                    conn);
                using var reader = selectCmd.ExecuteReader();
                if (reader.Read())
                {
                    var dbHost = reader.IsDBNull(0) ? "smtp.gmail.com" : reader.GetString(0);
                    var dbPort = reader.IsDBNull(1) ? 587 : reader.GetInt32(1);
                    var dbSender = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
                    var dbName = reader.IsDBNull(3) ? "UniMind - Tham Vấn Học Đường" : reader.GetString(3);
                    var dbPass = reader.IsDBNull(4) ? string.Empty : reader.GetString(4);
                    var dbSsl = reader.IsDBNull(5) || reader.GetBoolean(5);

                    if (!string.IsNullOrWhiteSpace(dbSender) && !string.IsNullOrWhiteSpace(dbPass))
                    {
                        lock (_settingsLock)
                        {
                            _settings = new EmailSettingsDto(dbHost, dbPort, dbSender, dbName, dbPass, dbSsl);
                        }
                    }
                    return;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UniMind EmailService Warning]: Không thể đọc cấu hình SMTP từ SQL Server: {ex.Message}");
            }
        }

        try
        {
            if (File.Exists(_fallbackSettingsFilePath))
            {
                var json = File.ReadAllText(_fallbackSettingsFilePath);
                var parsed = JsonSerializer.Deserialize<EmailSettingsDto>(json);
                if (parsed != null && !string.IsNullOrWhiteSpace(parsed.SenderEmail))
                {
                    lock (_settingsLock)
                    {
                        _settings = parsed;
                    }
                }
            }
        }
        catch
        {
            // Ignore local fallback read failures
        }
    }

    private void TrySavePersistedSettings(EmailSettingsDto settings)
    {
        if (!string.IsNullOrWhiteSpace(_connectionString))
        {
            try
            {
                using var conn = new SqlConnection(_connectionString);
                conn.Open();

                using var cmd = new SqlCommand(@"
                    IF EXISTS (SELECT 1 FROM dbo.SystemEmailSettings WHERE Id = 1)
                        UPDATE dbo.SystemEmailSettings
                        SET SmtpHost = @Host, SmtpPort = @Port, SenderEmail = @SenderEmail,
                            SenderName = @SenderName, AppPassword = @AppPassword, EnableSsl = @EnableSsl,
                            UpdatedAt = SYSUTCDATETIME()
                        WHERE Id = 1;
                    ELSE
                        INSERT INTO dbo.SystemEmailSettings (Id, SmtpHost, SmtpPort, SenderEmail, SenderName, AppPassword, EnableSsl, UpdatedAt)
                        VALUES (1, @Host, @Port, @SenderEmail, @SenderName, @AppPassword, @EnableSsl, SYSUTCDATETIME());", conn);

                cmd.Parameters.AddWithValue("@Host", settings.SmtpHost);
                cmd.Parameters.AddWithValue("@Port", settings.SmtpPort);
                cmd.Parameters.AddWithValue("@SenderEmail", settings.SenderEmail);
                cmd.Parameters.AddWithValue("@SenderName", settings.SenderName);
                cmd.Parameters.AddWithValue("@AppPassword", settings.Password);
                cmd.Parameters.AddWithValue("@EnableSsl", settings.EnableSsl);
                cmd.ExecuteNonQuery();
                return;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UniMind EmailService Warning]: Không thể lưu cấu hình SMTP vào SQL Server: {ex.Message}");
            }
        }

        try
        {
            var json = JsonSerializer.Serialize(settings);
            File.WriteAllText(_fallbackSettingsFilePath, json);
        }
        catch
        {
            // Ignore local fallback write failures
        }
    }

    private void RecordDispatch(string toEmail, string subject, string preview, bool success, string? error)
    {
        _dispatches.Enqueue(new DispatchedEmailRecord(
            Guid.NewGuid(),
            toEmail,
            subject,
            preview.Length > 80 ? preview.Substring(0, 80) + "..." : preview,
            success,
            error,
            DateTime.UtcNow
        ));

        while (_dispatches.Count > 100)
        {
            _dispatches.TryDequeue(out _);
        }
    }
}
