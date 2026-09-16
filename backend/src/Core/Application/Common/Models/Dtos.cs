using UniMind.Domain.Enums;

namespace UniMind.Application.Common.Models;

// 1. AUTH DTOs
public record LoginRequest(string EmailOrMSSV, string Password, string? Role);
public record RegisterRequest(string FullName, string EmailOrMSSV, string Password, string? Faculty, bool AutoPseudonym);
public record AuthResponse(string Token, UserDto User);
public record UserDto(Guid Id, string? MSSV, string FullName, string Email, string Role, string? Faculty, string AnonymousCode, string? AvatarUrl);

// 2. MOOD JOURNAL DTOs
public record CreateMoodJournalRequest(
    string MoodState, // Great, Peaceful, Stressed, Exhausted, Sad
    int EnergyLevel,
    string? Triggers,
    string JournalContent,
    bool ShareToCommunity
);

public record MoodJournalDto(
    Guid Id,
    string MoodState,
    int EnergyLevel,
    string? Triggers,
    string JournalContent,
    double SentimentScore,
    string SentimentLabel,
    string? AiAdvice,
    DateTime CreatedAt
);

public record MoodStatsDto(
    int PeacefulDays,
    int StressedDays,
    int ExhaustedDays,
    int TotalEntries,
    double AverageStressIndex,
    double AveragePeaceIndex,
    string AiClinicalRecommendation,
    List<MoodDailyPointDto> WeeklyPoints
);

public record MoodDailyPointDto(string DayLabel, int PeaceScore, int StressScore);

// 3. PSYCHOLOGICAL TEST DTOs
public record TestDto(Guid Id, string Code, string Title, string Description, int EstimatedMinutes, int QuestionCount);

public record OptionDto(Guid Id, int OptionOrder, string OptionText, int ScoreValue);
public record QuestionDto(Guid Id, int QuestionNumber, string Content, string SubscaleCategory, List<OptionDto> Options);
public record TestDetailDto(Guid Id, string Code, string Title, string Description, int EstimatedMinutes, int QuestionCount, List<QuestionDto> Questions);

public record SubmitAnswerItem(Guid QuestionId, int SelectedScore);
public record SubmitTestRequest(Guid TestId, List<SubmitAnswerItem> Answers);

public record TestResultDto(
    Guid Id,
    string TestCode,
    string TestTitle,
    int TotalScore,
    int? DepressionScore,
    int? AnxietyScore,
    int? StressScore,
    int ResilienceRate,
    string SeverityLevel,
    string? AiInterpretation,
    DateTime CompletedAt
);

// 4. COMMUNITY DTOs
public record CreatePostRequest(
    string Content,
    string CategoryTag,
    string? StressLevelTag,
    string? CustomPseudonym,
    bool RequestExpertPrivateResponse
);

public record PostDto(
    Guid Id,
    string AnonymousPseudonym,
    string StudentRoleTag,
    string Content,
    string CategoryTag,
    string? StressLevelTag,
    int HugCount,
    int EmpathyCount,
    int CommentCount,
    DateTime CreatedAt,
    bool HasKeywordsAlert,
    string? DetectedKeywords,
    int RiskScore,
    bool IsExtremeCrisis,
    bool IsSensitiveHiddenFromStudents,
    string ModerationStatus,
    List<CommentDto> Comments,
    string? VerifiedExpertAdvice
);

public record CreateCommentRequest(
    string Content,
    string? CustomPseudonym
);

public record CommentDto(
    Guid Id,
    Guid PostId,
    string AuthorPseudonym,
    string Content,
    bool IsExpertComment,
    string? ExpertTitle,
    bool IsSensitiveHiddenFromStudents,
    string? DetectedKeywords,
    DateTime CreatedAt
);

public record ReactRequest(string ReactionType); // "hug", "empathy"

// 5. APPOINTMENT & EXPERT DTOs
public record ExpertDto(
    Guid Id,
    string FullName,
    string Title,
    string AcademicDegree,
    string Specialization,
    int ExperienceYears,
    string RoomLocation,
    string? Bio,
    double Rating,
    int TotalConsultations,
    string? AvatarUrl,
    List<TimeSlotDto> AvailableSlots
);

public record TimeSlotDto(
    Guid Id,
    Guid ExpertId,
    string Date,
    string StartTime,
    string EndTime,
    string LocationType,
    string RoomName,
    bool IsBooked
);

public record BookAppointmentRequest(
    Guid ExpertId,
    Guid TimeSlotId,
    string AnonymousPseudonym,
    string ConsultationType, // Physical, Online
    string? ReasonNotes
);

public record AppointmentDto(
    Guid Id,
    string BookingCode,
    string StudentAnonymousCode,
    string ExpertName,
    string ExpertTitle,
    string Date,
    string StartTime,
    string EndTime,
    string RoomLocation,
    string ConsultationType,
    string Status,
    string? ReasonNotes,
    string? RejectionReason,
    string? ClinicalNotes,
    string? Dass21Summary,
    int RiskScore,
    DateTime CreatedAt
);

public record UpdateAppointmentStatusRequest(string Status, string? RejectionReason);
public record CompleteSessionRequest(string ClinicalNotes, string? Dass21Summary);

// 6. ADMIN & EXPERT DTOs
public record DashboardStatsDto(
    int TotalStudents,
    int TotalPostsToday,
    int ActiveExperts,
    int PendingUrgentAlerts,
    double SecurityAesUptimePercent,
    int CompletedSessionsThisMonth,
    int ResolvedSosCount,
    double CampusStressLevelPercent,
    List<CategoryBreakdownDto> FacultyRisks,
    List<KeywordAlertStatDto> TopAlertKeywords
);

public record CategoryBreakdownDto(string CategoryName, double Percentage, string RiskStatus);
public record KeywordAlertStatDto(string Keyword, int Count, string Severity);

public record ModeratePostRequest(string Action, string? Reason); // "approve", "hide", "reject", "sos_intervene"

public record SensitiveKeywordDto(Guid Id, string Keyword, string Category, int RiskWeight, string AddedByRole, bool IsActive, DateTime CreatedAt);
public record AddSensitiveKeywordRequest(string Keyword, string Category, int RiskWeight);

public record NlpRiskAlertDto(
    Guid Id,
    Guid? PostId,
    string StudentAnonymousCode,
    string? Faculty,
    string SnippetContent,
    string TriggeredKeywords,
    int RiskScore,
    string TriageLevel,
    string Status,
    string? InterventionAction,
    DateTime CreatedAt
);

public record ResolveAlertRequest(string ActionTaken); // "SafeRoomOpened", "SupportMessageSent", "SosActivated", "Dismissed"
