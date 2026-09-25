using UniMind.Domain.Enums;

namespace UniMind.Application.Common.Models;

// 1. AUTH DTOs
public record LoginRequest(
    string? EmailOrMSSV = null,
    string Password = "",
    string? Role = null,
    string? Email = null,
    string? Mssv = null
)
{
    public string Identifier =>
        !string.IsNullOrWhiteSpace(EmailOrMSSV) ? EmailOrMSSV.Trim() :
        (!string.IsNullOrWhiteSpace(Email) ? Email.Trim() : (Mssv?.Trim() ?? string.Empty));
}
public record RegisterRequest(
    string? FullName,
    string? EmailOrMSSV,
    string Password,
    string? Faculty,
    bool AutoPseudonym = true,
    string? Email = null,
    string? StudentId = null,
    string? YearOfStudy = null
);
public record AuthResponse(string Token, UserDto User);
public record UserDto(Guid Id, string? MSSV, string FullName, string Email, string Role, string? Faculty, string AnonymousCode, string? AvatarUrl);

// 2. MOOD JOURNAL DTOs
public record CreateMoodJournalRequest(
    string? MoodState = null, // Great, Peaceful, Stressed, Exhausted, Sad
    int? EnergyLevel = null,
    string? Triggers = null,
    string? JournalContent = null,
    bool ShareToCommunity = false,
    int? Mood = null,
    string? Content = null,
    List<string>? Tags = null,
    Guid? StudentId = null
)
{
    public string EffectiveMoodState =>
        !string.IsNullOrWhiteSpace(MoodState) ? MoodState :
        (Mood switch
        {
            5 => "Great",
            4 => "Peaceful",
            3 => "Stressed",
            2 => "Exhausted",
            _ => "Sad"
        });

    public int EffectiveEnergyLevel =>
        EnergyLevel ?? (Mood.HasValue ? Mood.Value * 2 : 5);

    public string EffectiveContent =>
        !string.IsNullOrWhiteSpace(JournalContent) ? JournalContent : (Content ?? string.Empty);

    public string? EffectiveTriggers =>
        !string.IsNullOrWhiteSpace(Triggers) ? Triggers :
        (Tags != null && Tags.Count > 0 ? string.Join(", ", Tags) : null);
};

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
)
{
    public int Mood =>
        MoodState?.ToLowerInvariant() switch
        {
            "great" => 5,
            "peaceful" => 4,
            "sad" => 3,
            "stressed" => 2,
            "exhausted" => 1,
            _ => (EnergyLevel > 0 ? (int)Math.Clamp(Math.Round(EnergyLevel / 2.0), 1, 5) : 3)
        };

    public string Content => JournalContent;

    public List<string> Tags =>
        !string.IsNullOrWhiteSpace(Triggers)
            ? Triggers.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
            : new List<string>();
}

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

public record SubmitAnswerItem(
    Guid? QuestionId = null,
    int? SelectedScore = null,
    int? Index = null,
    int? Score = null
)
{
    public int EffectiveScore => SelectedScore ?? Score ?? 0;
}

public record SubmitTestRequest(
    Guid? TestId = null,
    List<SubmitAnswerItem>? Answers = null,
    string? TestType = null,
    List<int?>? RawAnswers = null,
    Guid? StudentId = null,
    int? DepressionScore = null,
    int? AnxietyScore = null,
    int? StressScore = null,
    int? TotalScore = null
);

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
    string? CategoryTag = null,
    string? StressLevelTag = null,
    string? CustomPseudonym = null,
    bool RequestExpertPrivateResponse = false,
    string? Category = null,
    Guid? StudentId = null
)
{
    public string EffectiveCategory =>
        !string.IsNullOrWhiteSpace(CategoryTag) ? CategoryTag :
        (!string.IsNullOrWhiteSpace(Category) ? Category : "Áp lực học tập");
}

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
    string? CustomPseudonym = null,
    Guid? UserId = null
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

public record CreateExpertRequest(
    string FullName,
    string Email,
    string? Password,
    string Title,
    string AcademicDegree,
    string Specialization,
    int ExperienceYears,
    string RoomLocation,
    string? Bio
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
    Guid? TimeSlotId,
    string? AnonymousPseudonym,
    string? ConsultationType, // Physical, Online
    string? ReasonNotes,
    string? Date = null,
    string? Time = null
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
public record MoodDistributionDto(string Label, string MoodKey, int Count, double Percentage, string Color);
public record MoodTrendPointDto(string Label, double AvgScore, int TotalEntries);

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
    List<KeywordAlertStatDto> TopAlertKeywords,
    int TotalExperts = 0,
    int AppointmentsToday = 0,
    int CrisisAlerts = 0,
    int PostsToday = 0,
    int TestsTaken = 0,
    List<MoodDistributionDto>? MoodDistribution = null,
    List<MoodTrendPointDto>? MoodTrend = null
);

public record CategoryBreakdownDto(string CategoryName, double Percentage, string RiskStatus, int Count = 0);
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

public record MonthlyMetricDto(string Month, int AppointmentsCount, int TestsCount, int PostsCount);

public record AdminReportsDto(
    List<MonthlyMetricDto> MonthlyTrend,
    int TotalAppointments,
    int TotalTests,
    int TotalPosts,
    int TotalCrisisAlerts,
    int TotalStudents,
    int TotalExperts,
    List<CategoryBreakdownDto> FacultyBreakdown,
    List<CategoryBreakdownDto> TestSeverityBreakdown,
    List<KeywordAlertStatDto> TopKeywords,
    double AverageStressScore,
    List<MoodDistributionDto>? MoodDistribution = null
);

public record ExpertAnalyticsDto(
    int TotalConsultations,
    int UrgentAlertsCount,
    int HighRiskCount,
    int ModerateCount,
    int NormalCount,
    double AverageTestScore,
    List<NlpRiskAlertDto> TriageAlerts,
    List<CategoryBreakdownDto> SeverityDistribution,
    List<KeywordAlertStatDto> CrisisKeywords,
    List<MoodDistributionDto>? MoodDistribution = null,
    List<MonthlyMetricDto>? MonthlyTrend = null
);

public record AuditLogDto(
    Guid Id,
    string ActionType,
    string Details,
    string ActorRole,
    string ActorEmail,
    string Target,
    string? IpAddress,
    DateTime CreatedAt
);

public record AuditLogDetailDto(
    string DetailId,
    string Time,
    string Message
);

public record AuditLogActionDto(
    string ActionId,
    string Time,
    string ActionType,
    string Message,
    string EntityType,
    int DetailCount,
    List<AuditLogDetailDto> Details
);

public record AuditLogHistoryItemDto(
    string Id,
    string UserId,
    string UserName,
    string RoleName,
    string LogDate,
    string Summary,
    int TotalActions,
    List<AuditLogActionDto> Actions
);

public record AuditLogPaginationDto(
    int Page,
    int PageSize,
    int Total,
    int TotalPages
);

public record AuditLogHistoryResponseDto(
    List<AuditLogDto> Data,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

public record AuditLogEmployeeOptionDto(
    Guid Id,
    string UserName,
    string Email,
    string RoleName
);

public record ExpertProfileDto(
    Guid UserId,
    Guid ExpertId,
    string FullName,
    string Email,
    string Role,
    string Title,
    string AcademicDegree,
    string Specialization,
    int ExperienceYears,
    string RoomLocation,
    string? Bio,
    double Rating,
    int TotalConsultations,
    string? AvatarUrl,
    DateTime CreatedAt
);

public record UpdateExpertProfileRequest(
    string? FullName = null,
    string? Title = null,
    string? AcademicDegree = null,
    string? Specialization = null,
    int? ExperienceYears = null,
    string? RoomLocation = null,
    string? Bio = null,
    string? AvatarUrl = null
);

public record UpdateUserRoleRequest(string Role);

