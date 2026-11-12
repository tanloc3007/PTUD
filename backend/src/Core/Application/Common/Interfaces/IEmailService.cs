namespace UniMind.Application.Common.Interfaces;

public record EmailSettingsDto(
    string SmtpHost,
    int SmtpPort,
    string SenderEmail,
    string SenderName,
    string Password,
    bool EnableSsl = true
);

public record DispatchedEmailRecord(
    Guid Id,
    string ToEmail,
    string Subject,
    string PreviewText,
    bool Success,
    string? ErrorMessage,
    DateTime SentAt
);

public record EmailSendOutcome(
    bool Success,
    string? ErrorMessage = null
);

public interface IEmailService
{
    Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, string? plainTextBody = null, CancellationToken cancellationToken = default);
    Task<EmailSendOutcome> SendEmailDetailedAsync(string toEmail, string subject, string htmlBody, string? plainTextBody = null, EmailSettingsDto? overrideSettings = null, CancellationToken cancellationToken = default);
    Task<bool> SendMeetingInvitationAsync(string toEmail, string studentName, string bookingCode, string meetingUrl, string? appointmentDate = null, string? timeRange = null, CancellationToken cancellationToken = default);
    Task<EmailSendOutcome> SendMeetingInvitationDetailedAsync(string toEmail, string studentName, string bookingCode, string meetingUrl, string? appointmentDate = null, string? timeRange = null, CancellationToken cancellationToken = default);
    EmailSettingsDto GetSettings();
    Task<bool> UpdateSettingsAsync(EmailSettingsDto settings);
    IReadOnlyList<DispatchedEmailRecord> GetRecentDispatches();
}

