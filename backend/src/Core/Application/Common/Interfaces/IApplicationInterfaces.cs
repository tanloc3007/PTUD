using UniMind.Domain.Entities;

namespace UniMind.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    List<User> Users { get; }
    List<Expert> Experts { get; }
    List<TimeSlot> TimeSlots { get; }
    List<Appointment> Appointments { get; }
    List<MoodJournal> MoodJournals { get; }
    List<PsychologicalTest> PsychologicalTests { get; }
    List<TestQuestion> TestQuestions { get; }
    List<TestOption> TestOptions { get; }
    List<TestResult> TestResults { get; }
    List<SensitiveKeyword> SensitiveKeywords { get; }
    List<CommunityPost> CommunityPosts { get; }
    List<CommunityComment> CommunityComments { get; }
    List<NlpRiskAlert> NlpRiskAlerts { get; }
    List<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string passwordHash);
}

public interface IJwtProvider
{
    string Generate(User user);
}

public class SentimentAnalysisResult
{
    public double SentimentScore { get; set; } // -1.0 to +1.0
    public string SentimentLabel { get; set; } = "Neutral"; // Positive, Neutral, Negative, ExtremeNegative
    public int RiskScore { get; set; } // 0 to 100
    public bool ContainsSensitiveKeywords { get; set; }
    public List<string> TriggeredKeywords { get; set; } = new();
    public bool IsExtremeCrisis { get; set; }
    public string EmpatheticAdvice { get; set; } = string.Empty;
    public string BreathingExerciseSuggestion { get; set; } = string.Empty;
}

public interface IAISentimentService
{
    SentimentAnalysisResult Analyze(string text, IEnumerable<SensitiveKeyword> activeKeywords);
}
