using UniMind.Domain.Enums;

namespace UniMind.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? MSSV { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Student;
    public string? Faculty { get; set; }
    public string? AvatarUrl { get; set; }
    public string AnonymousCode { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class Expert
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string AcademicDegree { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public int ExperienceYears { get; set; } = 5;
    public string RoomLocation { get; set; } = "P.302 (Tầng 3)";
    public string? Bio { get; set; }
    public double Rating { get; set; } = 5.0;
    public int TotalConsultations { get; set; }
    public bool IsAvailable { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}

public class TimeSlot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ExpertId { get; set; }
    public DateOnly SlotDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public LocationType LocationType { get; set; } = LocationType.Physical;
    public string RoomName { get; set; } = "P.302";
    public bool IsBooked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Expert? Expert { get; set; }
}

public class Appointment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public Guid ExpertId { get; set; }
    public Guid TimeSlotId { get; set; }
    public string BookingCode { get; set; } = string.Empty;
    public string AnonymousPseudonym { get; set; } = string.Empty;
    public LocationType ConsultationType { get; set; } = LocationType.Physical;
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;
    public string? ReasonNotes { get; set; }
    public string? RejectionReason { get; set; }
    public string? ClinicalNotes { get; set; }
    public string? Dass21Summary { get; set; }
    public int RiskScore { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User? Student { get; set; }
    public Expert? Expert { get; set; }
    public TimeSlot? TimeSlot { get; set; }
}

public class MoodJournal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public MoodType MoodState { get; set; } = MoodType.Peaceful;
    public int EnergyLevel { get; set; } = 5;
    public string? Triggers { get; set; }
    public string JournalContent { get; set; } = string.Empty;
    public double SentimentScore { get; set; }
    public string SentimentLabel { get; set; } = "Neutral";
    public string? AiAdvice { get; set; }
    public bool IsSharedToCommunity { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? Student { get; set; }
}

public class PsychologicalTest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty; // DASS21, PHQ9, GAD7, MBISS
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int EstimatedMinutes { get; set; } = 5;
    public int QuestionCount { get; set; } = 21;
    public bool IsPublished { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<TestQuestion> Questions { get; set; } = new();
}

public class TestQuestion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TestId { get; set; }
    public int QuestionNumber { get; set; }
    public string Content { get; set; } = string.Empty;
    public string SubscaleCategory { get; set; } = "Depression"; // Depression, Anxiety, Stress
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<TestOption> Options { get; set; } = new();
}

public class TestOption
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid QuestionId { get; set; }
    public int OptionOrder { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public int ScoreValue { get; set; }
}

public class TestResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public Guid TestId { get; set; }
    public int TotalScore { get; set; }
    public int? DepressionScore { get; set; }
    public int? AnxietyScore { get; set; }
    public int? StressScore { get; set; }
    public int ResilienceRate { get; set; } = 50;
    public string SeverityLevel { get; set; } = "Normal";
    public string? AiInterpretation { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;

    public PsychologicalTest? Test { get; set; }
}

public class SensitiveKeyword
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Keyword { get; set; } = string.Empty;
    public string Category { get; set; } = "SelfHarm";
    public int RiskWeight { get; set; } = 90;
    public string AddedByRole { get; set; } = "Admin";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class CommunityPost
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public string AnonymousPseudonym { get; set; } = string.Empty;
    public string StudentRoleTag { get; set; } = "Sinh viên";
    public string Content { get; set; } = string.Empty;
    public string CategoryTag { get; set; } = "Áp lực học tập";
    public string? StressLevelTag { get; set; }
    public bool HasKeywordsAlert { get; set; }
    public string? DetectedKeywords { get; set; }
    public string SentimentLabel { get; set; } = "Neutral";
    public double SentimentScore { get; set; }
    public int RiskScore { get; set; }
    public bool IsExtremeCrisis { get; set; } // Thẻ báo động đỏ giải quyết ngay
    public bool IsSensitiveHiddenFromStudents { get; set; } // Ẩn với sinh viên, hiển thị cho Admin/Expert
    public PostStatus ModerationStatus { get; set; } = PostStatus.Approved;
    public Guid? ModeratedBy { get; set; }
    public int HugCount { get; set; }
    public int EmpathyCount { get; set; }
    public int CommentCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<CommunityComment> Comments { get; set; } = new();
}

public class CommunityComment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }
    public string AuthorPseudonym { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsExpertComment { get; set; }
    public string? ExpertTitle { get; set; }
    public bool IsSensitiveHiddenFromStudents { get; set; } // Ẩn với sinh viên, hiển thị cho Admin/Expert
    public string? DetectedKeywords { get; set; }
    public PostStatus ModerationStatus { get; set; } = PostStatus.Approved;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class NlpRiskAlert
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? PostId { get; set; }
    public Guid? CommentId { get; set; }
    public string StudentAnonymousCode { get; set; } = string.Empty;
    public string? Faculty { get; set; }
    public string SnippetContent { get; set; } = string.Empty;
    public string TriggeredKeywords { get; set; } = string.Empty;
    public int RiskScore { get; set; } = 85;
    public TriageLevel TriageLevel { get; set; } = TriageLevel.Urgent;
    public string Status { get; set; } = "PendingAction";
    public string? InterventionAction { get; set; }
    public Guid? ResolvedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ActionType { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string ActorRole { get; set; } = string.Empty;
    public Guid? ActorId { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
