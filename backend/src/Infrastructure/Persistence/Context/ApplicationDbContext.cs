using Microsoft.Data.SqlClient;
using UniMind.Application.Common.Interfaces;
using UniMind.Domain.Entities;
using UniMind.Domain.Enums;

namespace UniMind.Infrastructure.Persistence.Context;

public class ApplicationDbContext : IApplicationDbContext
{
    private readonly string? _connectionString;

    public List<User> Users { get; set; } = new();
    public List<Expert> Experts { get; set; } = new();
    public List<TimeSlot> TimeSlots { get; set; } = new();
    public List<Appointment> Appointments { get; set; } = new();
    public List<MoodJournal> MoodJournals { get; set; } = new();
    public List<PsychologicalTest> PsychologicalTests { get; set; } = new();
    public List<TestQuestion> TestQuestions { get; set; } = new();
    public List<TestOption> TestOptions { get; set; } = new();
    public List<TestResult> TestResults { get; set; } = new();
    public List<SensitiveKeyword> SensitiveKeywords { get; set; } = new();
    public List<CommunityPost> CommunityPosts { get; set; } = new();
    public List<CommunityComment> CommunityComments { get; set; } = new();
    public List<NlpRiskAlert> NlpRiskAlerts { get; set; } = new();
    public List<AuditLog> AuditLogs { get; set; } = new();

    public ApplicationDbContext(string? connectionString = null)
    {
        _connectionString = connectionString;
        bool loaded = false;

        if (!string.IsNullOrWhiteSpace(_connectionString))
        {
            try
            {
                loaded = TryLoadFromSqlServer(_connectionString);
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine($"[UniMind DB Warning] Không thể tải dữ liệu từ SQL Server: {ex.Message}. Chuyển sang nạp dữ liệu mẫu ban đầu.");
                Console.ResetColor();
            }
        }

        if (!loaded || Users.Count == 0)
        {
            SeedInitialData();
        }
    }

    private bool TryLoadFromSqlServer(string connStr)
    {
        using var conn = new SqlConnection(connStr);
        conn.Open();

        // 1. Users
        using (var cmd = new SqlCommand("SELECT Id, MSSV, FullName, Email, PasswordHash, Role, Faculty, AvatarUrl, AnonymousCode, IsActive, CreatedAt, UpdatedAt FROM dbo.Users", conn))
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                var roleStr = reader["Role"].ToString() ?? "Student";
                Enum.TryParse<UserRole>(roleStr, true, out var role);

                Users.Add(new User
                {
                    Id = reader.GetGuid(0),
                    MSSV = reader.IsDBNull(1) ? null : reader.GetString(1),
                    FullName = reader.GetString(2),
                    Email = reader.GetString(3),
                    PasswordHash = reader.GetString(4),
                    Role = role,
                    Faculty = reader.IsDBNull(6) ? null : reader.GetString(6),
                    AvatarUrl = reader.IsDBNull(7) ? null : reader.GetString(7),
                    AnonymousCode = reader.GetString(8),
                    IsActive = reader.GetBoolean(9),
                    CreatedAt = reader.GetDateTime(10),
                    UpdatedAt = reader.IsDBNull(11) ? null : reader.GetDateTime(11)
                });
            }
        }

        // 2. Experts
        using (var cmd = new SqlCommand("SELECT Id, UserId, Title, AcademicDegree, Specialization, ExperienceYears, RoomLocation, Bio, Rating, TotalConsultations, IsAvailable, CreatedAt FROM dbo.Experts", conn))
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                Experts.Add(new Expert
                {
                    Id = reader.GetGuid(0),
                    UserId = reader.GetGuid(1),
                    Title = reader.GetString(2),
                    AcademicDegree = reader.GetString(3),
                    Specialization = reader.GetString(4),
                    ExperienceYears = reader.GetInt32(5),
                    RoomLocation = reader.GetString(6),
                    Bio = reader.IsDBNull(7) ? null : reader.GetString(7),
                    Rating = Convert.ToDouble(reader.GetValue(8)),
                    TotalConsultations = reader.GetInt32(9),
                    IsAvailable = reader.GetBoolean(10),
                    CreatedAt = reader.GetDateTime(11)
                });
            }
        }

        // 3. TimeSlots
        using (var cmd = new SqlCommand("SELECT Id, ExpertId, SlotDate, StartTime, EndTime, LocationType, RoomName, IsBooked, CreatedAt FROM dbo.TimeSlots", conn))
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                var locStr = reader["LocationType"].ToString() ?? "Physical";
                Enum.TryParse<LocationType>(locStr, true, out var locType);

                var slotDate = DateOnly.FromDateTime(reader.GetDateTime(2));
                var startSpan = (TimeSpan)reader.GetValue(3);
                var endSpan = (TimeSpan)reader.GetValue(4);

                TimeSlots.Add(new TimeSlot
                {
                    Id = reader.GetGuid(0),
                    ExpertId = reader.GetGuid(1),
                    SlotDate = slotDate,
                    StartTime = TimeOnly.FromTimeSpan(startSpan),
                    EndTime = TimeOnly.FromTimeSpan(endSpan),
                    LocationType = locType,
                    RoomName = reader.GetString(6),
                    IsBooked = reader.GetBoolean(7),
                    CreatedAt = reader.GetDateTime(8)
                });
            }
        }

        // 4. Appointments
        using (var cmd = new SqlCommand("SELECT Id, StudentId, ExpertId, TimeSlotId, BookingCode, AnonymousPseudonym, ConsultationType, Status, ReasonNotes, RejectionReason, ClinicalNotes, Dass21Summary, RiskScore, CreatedAt, UpdatedAt FROM dbo.Appointments", conn))
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                var locStr = reader["ConsultationType"].ToString() ?? "Physical";
                Enum.TryParse<LocationType>(locStr, true, out var locType);

                var statusStr = reader["Status"].ToString() ?? "Pending";
                Enum.TryParse<AppointmentStatus>(statusStr, true, out var appStatus);

                Appointments.Add(new Appointment
                {
                    Id = reader.GetGuid(0),
                    StudentId = reader.GetGuid(1),
                    ExpertId = reader.GetGuid(2),
                    TimeSlotId = reader.GetGuid(3),
                    BookingCode = reader.GetString(4),
                    AnonymousPseudonym = reader.GetString(5),
                    ConsultationType = locType,
                    Status = appStatus,
                    ReasonNotes = reader.IsDBNull(8) ? null : reader.GetString(8),
                    RejectionReason = reader.IsDBNull(9) ? null : reader.GetString(9),
                    ClinicalNotes = reader.IsDBNull(10) ? null : reader.GetString(10),
                    Dass21Summary = reader.IsDBNull(11) ? null : reader.GetString(11),
                    RiskScore = reader.GetInt32(12),
                    CreatedAt = reader.GetDateTime(13),
                    UpdatedAt = reader.IsDBNull(14) ? null : reader.GetDateTime(14)
                });
            }
        }

        // 5. SensitiveKeywords
        using (var cmd = new SqlCommand("SELECT Id, Keyword, Category, RiskWeight, AddedByRole, IsActive, CreatedAt FROM dbo.SensitiveKeywords", conn))
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                SensitiveKeywords.Add(new SensitiveKeyword
                {
                    Id = reader.GetGuid(0),
                    Keyword = reader.GetString(1),
                    Category = reader.GetString(2),
                    RiskWeight = reader.GetInt32(3),
                    AddedByRole = reader.GetString(4),
                    IsActive = reader.GetBoolean(5),
                    CreatedAt = reader.GetDateTime(6)
                });
            }
        }

        // 6. CommunityPosts
        using (var cmd = new SqlCommand("SELECT Id, StudentId, AnonymousPseudonym, StudentRoleTag, Content, CategoryTag, StressLevelTag, HasKeywordsAlert, DetectedKeywords, SentimentLabel, SentimentScore, RiskScore, IsExtremeCrisis, IsSensitiveHiddenFromStudents, ModerationStatus, ModeratedBy, HugCount, EmpathyCount, CommentCount, CreatedAt FROM dbo.CommunityPosts ORDER BY CreatedAt DESC", conn))
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                var modStr = reader["ModerationStatus"].ToString() ?? "Approved";
                Enum.TryParse<PostStatus>(modStr, true, out var modStatus);

                CommunityPosts.Add(new CommunityPost
                {
                    Id = reader.GetGuid(0),
                    StudentId = reader.GetGuid(1),
                    AnonymousPseudonym = reader.GetString(2),
                    StudentRoleTag = reader.GetString(3),
                    Content = reader.GetString(4),
                    CategoryTag = reader.GetString(5),
                    StressLevelTag = reader.IsDBNull(6) ? null : reader.GetString(6),
                    HasKeywordsAlert = reader.GetBoolean(7),
                    DetectedKeywords = reader.IsDBNull(8) ? null : reader.GetString(8),
                    SentimentLabel = reader.GetString(9),
                    SentimentScore = Convert.ToDouble(reader.GetValue(10)),
                    RiskScore = reader.GetInt32(11),
                    IsExtremeCrisis = reader.GetBoolean(12),
                    IsSensitiveHiddenFromStudents = reader.GetBoolean(13),
                    ModerationStatus = modStatus,
                    ModeratedBy = reader.IsDBNull(15) ? null : reader.GetGuid(15),
                    HugCount = reader.GetInt32(16),
                    EmpathyCount = reader.GetInt32(17),
                    CommentCount = reader.GetInt32(18),
                    CreatedAt = reader.GetDateTime(19)
                });
            }
        }

        // 7. CommunityComments
        using (var cmd = new SqlCommand("SELECT Id, PostId, UserId, AuthorPseudonym, Content, IsExpertComment, ExpertTitle, IsSensitiveHiddenFromStudents, DetectedKeywords, ModerationStatus, CreatedAt FROM dbo.CommunityComments", conn))
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                var modStr = reader["ModerationStatus"].ToString() ?? "Approved";
                Enum.TryParse<PostStatus>(modStr, true, out var modStatus);

                CommunityComments.Add(new CommunityComment
                {
                    Id = reader.GetGuid(0),
                    PostId = reader.GetGuid(1),
                    UserId = reader.GetGuid(2),
                    AuthorPseudonym = reader.GetString(3),
                    Content = reader.GetString(4),
                    IsExpertComment = reader.GetBoolean(5),
                    ExpertTitle = reader.IsDBNull(6) ? null : reader.GetString(6),
                    IsSensitiveHiddenFromStudents = reader.GetBoolean(7),
                    DetectedKeywords = reader.IsDBNull(8) ? null : reader.GetString(8),
                    ModerationStatus = modStatus,
                    CreatedAt = reader.GetDateTime(10)
                });
            }
        }

        // 8. MoodJournals
        using (var cmd = new SqlCommand("SELECT Id, StudentId, MoodState, EnergyLevel, Triggers, JournalContent, SentimentScore, SentimentLabel, AiAdvice, IsSharedToCommunity, CreatedAt FROM dbo.MoodJournals ORDER BY CreatedAt DESC", conn))
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                var moodStr = reader["MoodState"].ToString() ?? "Peaceful";
                Enum.TryParse<MoodType>(moodStr, true, out var moodType);

                MoodJournals.Add(new MoodJournal
                {
                    Id = reader.GetGuid(0),
                    StudentId = reader.GetGuid(1),
                    MoodState = moodType,
                    EnergyLevel = reader.GetInt32(3),
                    Triggers = reader.IsDBNull(4) ? null : reader.GetString(4),
                    JournalContent = reader.GetString(5),
                    SentimentScore = Convert.ToDouble(reader.GetValue(6)),
                    SentimentLabel = reader.GetString(7),
                    AiAdvice = reader.IsDBNull(8) ? null : reader.GetString(8),
                    IsSharedToCommunity = reader.GetBoolean(9),
                    CreatedAt = reader.GetDateTime(10)
                });
            }
        }

        // 9. NlpRiskAlerts
        using (var cmd = new SqlCommand("SELECT Id, PostId, CommentId, StudentAnonymousCode, Faculty, SnippetContent, TriggeredKeywords, RiskScore, TriageLevel, Status, InterventionAction, ResolvedBy, CreatedAt FROM dbo.NlpRiskAlerts ORDER BY CreatedAt DESC", conn))
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                var triageStr = reader["TriageLevel"].ToString() ?? "Urgent";
                Enum.TryParse<TriageLevel>(triageStr, true, out var triageLevel);

                NlpRiskAlerts.Add(new NlpRiskAlert
                {
                    Id = reader.GetGuid(0),
                    PostId = reader.IsDBNull(1) ? null : reader.GetGuid(1),
                    CommentId = reader.IsDBNull(2) ? null : reader.GetGuid(2),
                    StudentAnonymousCode = reader.GetString(3),
                    Faculty = reader.IsDBNull(4) ? null : reader.GetString(4),
                    SnippetContent = reader.GetString(5),
                    TriggeredKeywords = reader.GetString(6),
                    RiskScore = reader.GetInt32(7),
                    TriageLevel = triageLevel,
                    Status = reader.GetString(9),
                    InterventionAction = reader.IsDBNull(10) ? null : reader.GetString(10),
                    ResolvedBy = reader.IsDBNull(11) ? null : reader.GetGuid(11),
                    CreatedAt = reader.GetDateTime(12)
                });
            }
        }

        // 10. PsychologicalTests
        using (var cmd = new SqlCommand("SELECT Id, Code, Title, Description, EstimatedMinutes, QuestionCount, IsPublished, CreatedAt FROM dbo.PsychologicalTests", conn))
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                PsychologicalTests.Add(new PsychologicalTest
                {
                    Id = reader.GetGuid(0),
                    Code = reader.GetString(1),
                    Title = reader.GetString(2),
                    Description = reader.GetString(3),
                    EstimatedMinutes = reader.GetInt32(4),
                    QuestionCount = reader.GetInt32(5),
                    IsPublished = reader.GetBoolean(6),
                    CreatedAt = reader.GetDateTime(7)
                });
            }
        }

        // 11. TestQuestions
        using (var cmd = new SqlCommand("SELECT Id, TestId, QuestionNumber, Content, SubscaleCategory, CreatedAt FROM dbo.TestQuestions ORDER BY QuestionNumber", conn))
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                TestQuestions.Add(new TestQuestion
                {
                    Id = reader.GetGuid(0),
                    TestId = reader.GetGuid(1),
                    QuestionNumber = reader.GetInt32(2),
                    Content = reader.GetString(3),
                    SubscaleCategory = reader.GetString(4),
                    CreatedAt = reader.GetDateTime(5)
                });
            }
        }

        // 12. TestOptions
        using (var cmd = new SqlCommand("SELECT Id, QuestionId, OptionOrder, OptionText, ScoreValue FROM dbo.TestOptions ORDER BY OptionOrder", conn))
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                TestOptions.Add(new TestOption
                {
                    Id = reader.GetGuid(0),
                    QuestionId = reader.GetGuid(1),
                    OptionOrder = reader.GetInt32(2),
                    OptionText = reader.GetString(3),
                    ScoreValue = reader.GetInt32(4)
                });
            }
        }

        // Wire relation between Questions and Tests
        foreach (var test in PsychologicalTests)
        {
            test.Questions = TestQuestions.Where(q => q.TestId == test.Id).ToList();
            foreach (var q in test.Questions)
            {
                q.Options = TestOptions.Where(o => o.QuestionId == q.Id).ToList();
            }
        }

        // Wire comments to posts
        foreach (var post in CommunityPosts)
        {
            post.Comments = CommunityComments.Where(c => c.PostId == post.Id).ToList();
        }

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"[UniMind DB Success] Đã kết nối và nạp thành công từ SQL Server: {Users.Count} người dùng, {Experts.Count} chuyên gia, {TimeSlots.Count} ca trực, {CommunityPosts.Count} bài viết, {Appointments.Count} ca hẹn!");
        Console.ResetColor();

        return true;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return 1;

        try
        {
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync(cancellationToken);

            // 1. Sync CommunityPosts
            foreach (var post in CommunityPosts)
            {
                using var cmd = new SqlCommand(@"
                    IF NOT EXISTS (SELECT 1 FROM dbo.CommunityPosts WHERE Id = @Id)
                    BEGIN
                        INSERT INTO dbo.CommunityPosts 
                        (Id, StudentId, AnonymousPseudonym, StudentRoleTag, Content, CategoryTag, StressLevelTag, HasKeywordsAlert, DetectedKeywords, SentimentLabel, SentimentScore, RiskScore, IsExtremeCrisis, IsSensitiveHiddenFromStudents, ModerationStatus, ModeratedBy, HugCount, EmpathyCount, CommentCount, CreatedAt)
                        VALUES (@Id, @StudentId, @AnonymousPseudonym, @StudentRoleTag, @Content, @CategoryTag, @StressLevelTag, @HasKeywordsAlert, @DetectedKeywords, @SentimentLabel, @SentimentScore, @RiskScore, @IsExtremeCrisis, @IsSensitiveHiddenFromStudents, @ModerationStatus, @ModeratedBy, @HugCount, @EmpathyCount, @CommentCount, @CreatedAt)
                    END
                    ELSE
                    BEGIN
                        UPDATE dbo.CommunityPosts SET 
                            HugCount = @HugCount, 
                            EmpathyCount = @EmpathyCount, 
                            CommentCount = @CommentCount,
                            ModerationStatus = @ModerationStatus,
                            ModeratedBy = @ModeratedBy,
                            IsSensitiveHiddenFromStudents = @IsSensitiveHiddenFromStudents
                        WHERE Id = @Id
                    END", conn);

                cmd.Parameters.AddWithValue("@Id", post.Id);
                cmd.Parameters.AddWithValue("@StudentId", post.StudentId);
                cmd.Parameters.AddWithValue("@AnonymousPseudonym", post.AnonymousPseudonym);
                cmd.Parameters.AddWithValue("@StudentRoleTag", post.StudentRoleTag);
                cmd.Parameters.AddWithValue("@Content", post.Content);
                cmd.Parameters.AddWithValue("@CategoryTag", post.CategoryTag);
                cmd.Parameters.AddWithValue("@StressLevelTag", (object?)post.StressLevelTag ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@HasKeywordsAlert", post.HasKeywordsAlert);
                cmd.Parameters.AddWithValue("@DetectedKeywords", (object?)post.DetectedKeywords ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@SentimentLabel", post.SentimentLabel);
                cmd.Parameters.AddWithValue("@SentimentScore", post.SentimentScore);
                cmd.Parameters.AddWithValue("@RiskScore", post.RiskScore);
                cmd.Parameters.AddWithValue("@IsExtremeCrisis", post.IsExtremeCrisis);
                cmd.Parameters.AddWithValue("@IsSensitiveHiddenFromStudents", post.IsSensitiveHiddenFromStudents);
                cmd.Parameters.AddWithValue("@ModerationStatus", post.ModerationStatus.ToString());
                cmd.Parameters.AddWithValue("@ModeratedBy", (object?)post.ModeratedBy ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@HugCount", post.HugCount);
                cmd.Parameters.AddWithValue("@EmpathyCount", post.EmpathyCount);
                cmd.Parameters.AddWithValue("@CommentCount", post.CommentCount);
                cmd.Parameters.AddWithValue("@CreatedAt", post.CreatedAt);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // 2. Sync CommunityComments
            foreach (var comment in CommunityComments)
            {
                using var cmd = new SqlCommand(@"
                    IF NOT EXISTS (SELECT 1 FROM dbo.CommunityComments WHERE Id = @Id)
                    BEGIN
                        INSERT INTO dbo.CommunityComments
                        (Id, PostId, UserId, AuthorPseudonym, Content, IsExpertComment, ExpertTitle, IsSensitiveHiddenFromStudents, DetectedKeywords, ModerationStatus, CreatedAt)
                        VALUES (@Id, @PostId, @UserId, @AuthorPseudonym, @Content, @IsExpertComment, @ExpertTitle, @IsSensitiveHiddenFromStudents, @DetectedKeywords, @ModerationStatus, @CreatedAt)
                    END", conn);

                cmd.Parameters.AddWithValue("@Id", comment.Id);
                cmd.Parameters.AddWithValue("@PostId", comment.PostId);
                cmd.Parameters.AddWithValue("@UserId", comment.UserId);
                cmd.Parameters.AddWithValue("@AuthorPseudonym", comment.AuthorPseudonym);
                cmd.Parameters.AddWithValue("@Content", comment.Content);
                cmd.Parameters.AddWithValue("@IsExpertComment", comment.IsExpertComment);
                cmd.Parameters.AddWithValue("@ExpertTitle", (object?)comment.ExpertTitle ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IsSensitiveHiddenFromStudents", comment.IsSensitiveHiddenFromStudents);
                cmd.Parameters.AddWithValue("@DetectedKeywords", (object?)comment.DetectedKeywords ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ModerationStatus", comment.ModerationStatus.ToString());
                cmd.Parameters.AddWithValue("@CreatedAt", comment.CreatedAt);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // 3. Sync Appointments
            foreach (var app in Appointments)
            {
                using var cmd = new SqlCommand(@"
                    IF NOT EXISTS (SELECT 1 FROM dbo.Appointments WHERE Id = @Id)
                    BEGIN
                        INSERT INTO dbo.Appointments
                        (Id, StudentId, ExpertId, TimeSlotId, BookingCode, AnonymousPseudonym, ConsultationType, Status, ReasonNotes, RejectionReason, ClinicalNotes, Dass21Summary, RiskScore, CreatedAt, UpdatedAt)
                        VALUES (@Id, @StudentId, @ExpertId, @TimeSlotId, @BookingCode, @AnonymousPseudonym, @ConsultationType, @Status, @ReasonNotes, @RejectionReason, @ClinicalNotes, @Dass21Summary, @RiskScore, @CreatedAt, @UpdatedAt)
                    END
                    ELSE
                    BEGIN
                        UPDATE dbo.Appointments SET 
                            Status = @Status,
                            RejectionReason = @RejectionReason,
                            ClinicalNotes = @ClinicalNotes,
                            UpdatedAt = @UpdatedAt
                        WHERE Id = @Id
                    END", conn);

                cmd.Parameters.AddWithValue("@Id", app.Id);
                cmd.Parameters.AddWithValue("@StudentId", app.StudentId);
                cmd.Parameters.AddWithValue("@ExpertId", app.ExpertId);
                cmd.Parameters.AddWithValue("@TimeSlotId", app.TimeSlotId);
                cmd.Parameters.AddWithValue("@BookingCode", app.BookingCode);
                cmd.Parameters.AddWithValue("@AnonymousPseudonym", app.AnonymousPseudonym);
                cmd.Parameters.AddWithValue("@ConsultationType", app.ConsultationType.ToString());
                cmd.Parameters.AddWithValue("@Status", app.Status.ToString());
                cmd.Parameters.AddWithValue("@ReasonNotes", (object?)app.ReasonNotes ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@RejectionReason", (object?)app.RejectionReason ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ClinicalNotes", (object?)app.ClinicalNotes ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Dass21Summary", (object?)app.Dass21Summary ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@RiskScore", app.RiskScore);
                cmd.Parameters.AddWithValue("@CreatedAt", app.CreatedAt);
                cmd.Parameters.AddWithValue("@UpdatedAt", (object?)app.UpdatedAt ?? DBNull.Value);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // 4. Sync TimeSlots (IsBooked)
            foreach (var slot in TimeSlots)
            {
                using var cmd = new SqlCommand("UPDATE dbo.TimeSlots SET IsBooked = @IsBooked WHERE Id = @Id", conn);
                cmd.Parameters.AddWithValue("@Id", slot.Id);
                cmd.Parameters.AddWithValue("@IsBooked", slot.IsBooked);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // 5. Sync MoodJournals
            foreach (var journal in MoodJournals)
            {
                using var cmd = new SqlCommand(@"
                    IF NOT EXISTS (SELECT 1 FROM dbo.MoodJournals WHERE Id = @Id)
                    BEGIN
                        INSERT INTO dbo.MoodJournals
                        (Id, StudentId, MoodState, EnergyLevel, Triggers, JournalContent, SentimentScore, SentimentLabel, AiAdvice, IsSharedToCommunity, CreatedAt)
                        VALUES (@Id, @StudentId, @MoodState, @EnergyLevel, @Triggers, @JournalContent, @SentimentScore, @SentimentLabel, @AiAdvice, @IsSharedToCommunity, @CreatedAt)
                    END", conn);

                cmd.Parameters.AddWithValue("@Id", journal.Id);
                cmd.Parameters.AddWithValue("@StudentId", journal.StudentId);
                cmd.Parameters.AddWithValue("@MoodState", journal.MoodState.ToString());
                cmd.Parameters.AddWithValue("@EnergyLevel", journal.EnergyLevel);
                cmd.Parameters.AddWithValue("@Triggers", (object?)journal.Triggers ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@JournalContent", journal.JournalContent);
                cmd.Parameters.AddWithValue("@SentimentScore", journal.SentimentScore);
                cmd.Parameters.AddWithValue("@SentimentLabel", journal.SentimentLabel);
                cmd.Parameters.AddWithValue("@AiAdvice", (object?)journal.AiAdvice ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IsSharedToCommunity", journal.IsSharedToCommunity);
                cmd.Parameters.AddWithValue("@CreatedAt", journal.CreatedAt);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // 6. Sync Users
            foreach (var user in Users)
            {
                using var cmd = new SqlCommand(@"
                    IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Id = @Id)
                    BEGIN
                        INSERT INTO dbo.Users
                        (Id, MSSV, FullName, Email, PasswordHash, Role, Faculty, AvatarUrl, AnonymousCode, IsActive, CreatedAt, UpdatedAt)
                        VALUES (@Id, @MSSV, @FullName, @Email, @PasswordHash, @Role, @Faculty, @AvatarUrl, @AnonymousCode, @IsActive, @CreatedAt, @UpdatedAt)
                    END
                    ELSE
                    BEGIN
                        UPDATE dbo.Users SET IsActive = @IsActive, UpdatedAt = @UpdatedAt WHERE Id = @Id
                    END", conn);

                cmd.Parameters.AddWithValue("@Id", user.Id);
                cmd.Parameters.AddWithValue("@MSSV", (object?)user.MSSV ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@FullName", user.FullName);
                cmd.Parameters.AddWithValue("@Email", user.Email);
                cmd.Parameters.AddWithValue("@PasswordHash", user.PasswordHash);
                cmd.Parameters.AddWithValue("@Role", user.Role.ToString());
                cmd.Parameters.AddWithValue("@Faculty", (object?)user.Faculty ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@AvatarUrl", (object?)user.AvatarUrl ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@AnonymousCode", user.AnonymousCode);
                cmd.Parameters.AddWithValue("@IsActive", user.IsActive);
                cmd.Parameters.AddWithValue("@CreatedAt", user.CreatedAt);
                cmd.Parameters.AddWithValue("@UpdatedAt", (object?)user.UpdatedAt ?? DBNull.Value);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // 7. Sync SensitiveKeywords
            foreach (var kw in SensitiveKeywords)
            {
                using var cmd = new SqlCommand(@"
                    IF NOT EXISTS (SELECT 1 FROM dbo.SensitiveKeywords WHERE Id = @Id)
                    BEGIN
                        INSERT INTO dbo.SensitiveKeywords (Id, Keyword, Category, RiskWeight, AddedByRole, IsActive, CreatedAt)
                        VALUES (@Id, @Keyword, @Category, @RiskWeight, @AddedByRole, @IsActive, @CreatedAt)
                    END", conn);

                cmd.Parameters.AddWithValue("@Id", kw.Id);
                cmd.Parameters.AddWithValue("@Keyword", kw.Keyword);
                cmd.Parameters.AddWithValue("@Category", kw.Category);
                cmd.Parameters.AddWithValue("@RiskWeight", kw.RiskWeight);
                cmd.Parameters.AddWithValue("@AddedByRole", kw.AddedByRole);
                cmd.Parameters.AddWithValue("@IsActive", kw.IsActive);
                cmd.Parameters.AddWithValue("@CreatedAt", kw.CreatedAt);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // 8. Sync NlpRiskAlerts
            foreach (var alert in NlpRiskAlerts)
            {
                using var cmd = new SqlCommand(@"
                    IF NOT EXISTS (SELECT 1 FROM dbo.NlpRiskAlerts WHERE Id = @Id)
                    BEGIN
                        INSERT INTO dbo.NlpRiskAlerts 
                        (Id, PostId, CommentId, StudentAnonymousCode, Faculty, SnippetContent, TriggeredKeywords, RiskScore, TriageLevel, Status, InterventionAction, ResolvedBy, CreatedAt)
                        VALUES (@Id, @PostId, @CommentId, @StudentAnonymousCode, @Faculty, @SnippetContent, @TriggeredKeywords, @RiskScore, @TriageLevel, @Status, @InterventionAction, @ResolvedBy, @CreatedAt)
                    END
                    ELSE
                    BEGIN
                        UPDATE dbo.NlpRiskAlerts SET 
                            Status = @Status, 
                            InterventionAction = @InterventionAction, 
                            ResolvedBy = @ResolvedBy
                        WHERE Id = @Id
                    END", conn);

                cmd.Parameters.AddWithValue("@Id", alert.Id);
                cmd.Parameters.AddWithValue("@PostId", (object?)alert.PostId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@CommentId", (object?)alert.CommentId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@StudentAnonymousCode", alert.StudentAnonymousCode);
                cmd.Parameters.AddWithValue("@Faculty", (object?)alert.Faculty ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@SnippetContent", alert.SnippetContent);
                cmd.Parameters.AddWithValue("@TriggeredKeywords", alert.TriggeredKeywords);
                cmd.Parameters.AddWithValue("@RiskScore", alert.RiskScore);
                cmd.Parameters.AddWithValue("@TriageLevel", alert.TriageLevel.ToString());
                cmd.Parameters.AddWithValue("@Status", alert.Status);
                cmd.Parameters.AddWithValue("@InterventionAction", (object?)alert.InterventionAction ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ResolvedBy", (object?)alert.ResolvedBy ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@CreatedAt", alert.CreatedAt);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // 9. Sync Experts
            foreach (var exp in Experts)
            {
                using var cmd = new SqlCommand(@"
                    IF NOT EXISTS (SELECT 1 FROM dbo.Experts WHERE Id = @Id)
                    BEGIN
                        INSERT INTO dbo.Experts (Id, UserId, Title, AcademicDegree, Specialization, ExperienceYears, RoomLocation, Bio, Rating, TotalConsultations, IsAvailable, CreatedAt)
                        VALUES (@Id, @UserId, @Title, @AcademicDegree, @Specialization, @ExperienceYears, @RoomLocation, @Bio, @Rating, @TotalConsultations, @IsAvailable, @CreatedAt)
                    END", conn);

                cmd.Parameters.AddWithValue("@Id", exp.Id);
                cmd.Parameters.AddWithValue("@UserId", exp.UserId);
                cmd.Parameters.AddWithValue("@Title", exp.Title);
                cmd.Parameters.AddWithValue("@AcademicDegree", exp.AcademicDegree);
                cmd.Parameters.AddWithValue("@Specialization", exp.Specialization);
                cmd.Parameters.AddWithValue("@ExperienceYears", exp.ExperienceYears);
                cmd.Parameters.AddWithValue("@RoomLocation", exp.RoomLocation);
                cmd.Parameters.AddWithValue("@Bio", (object?)exp.Bio ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Rating", exp.Rating);
                cmd.Parameters.AddWithValue("@TotalConsultations", exp.TotalConsultations);
                cmd.Parameters.AddWithValue("@IsAvailable", exp.IsAvailable);
                cmd.Parameters.AddWithValue("@CreatedAt", exp.CreatedAt);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // 10. Sync TimeSlots (INSERT new slots if not exists)
            foreach (var slot in TimeSlots)
            {
                using var cmd = new SqlCommand(@"
                    IF NOT EXISTS (SELECT 1 FROM dbo.TimeSlots WHERE Id = @Id)
                    BEGIN
                        INSERT INTO dbo.TimeSlots (Id, ExpertId, SlotDate, StartTime, EndTime, LocationType, RoomName, IsBooked, CreatedAt)
                        VALUES (@Id, @ExpertId, @SlotDate, @StartTime, @EndTime, @LocationType, @RoomName, @IsBooked, @CreatedAt)
                    END
                    ELSE
                    BEGIN
                        UPDATE dbo.TimeSlots SET IsBooked = @IsBooked WHERE Id = @Id
                    END", conn);

                cmd.Parameters.AddWithValue("@Id", slot.Id);
                cmd.Parameters.AddWithValue("@ExpertId", slot.ExpertId);
                cmd.Parameters.AddWithValue("@SlotDate", slot.SlotDate.ToDateTime(TimeOnly.MinValue));
                cmd.Parameters.AddWithValue("@StartTime", slot.StartTime.ToTimeSpan());
                cmd.Parameters.AddWithValue("@EndTime", slot.EndTime.ToTimeSpan());
                cmd.Parameters.AddWithValue("@LocationType", slot.LocationType.ToString());
                cmd.Parameters.AddWithValue("@RoomName", slot.RoomName);
                cmd.Parameters.AddWithValue("@IsBooked", slot.IsBooked);
                cmd.Parameters.AddWithValue("@CreatedAt", slot.CreatedAt);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine($"[UniMind DB Save Warning] Lỗi lưu thay đổi vào SQL Server: {ex.Message}");
            Console.ResetColor();
        }

        return 1;
    }

    private void SeedInitialData()
    {
        var adminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var studentId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var expHaId = Guid.Parse("33333333-3333-3333-3333-333333333331");
        var expLanId = Guid.Parse("33333333-3333-3333-3333-333333333332");
        var expBaoId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var expTamId = Guid.Parse("33333333-3333-3333-3333-333333333334");

        var studentDemoId = Guid.Parse("22222222-2222-2222-2222-222222222221");
        var expDemoId = Guid.Parse("33333333-3333-3333-3333-333333333330");
        var studentLocId = Guid.Parse("22222222-2222-2222-2222-222222222223");
        var studentLuanId = Guid.Parse("22222222-2222-2222-2222-222222222224");

        Users.AddRange(new[]
        {
            new User { Id = adminId, MSSV = "AD001", FullName = "Quản trị viên Nguyễn Văn An", Email = "admin@unimind.edu.vn", Role = UserRole.Admin, Faculty = "Phòng Công tác Sinh viên", AnonymousCode = "Quản trị viên #382", PasswordHash = "123456" },
            new User { Id = studentDemoId, MSSV = "120000001", FullName = "Sinh viên Nguyễn Thử Nghiệm", Email = "student@unimind.edu.vn", Role = UserRole.Student, Faculty = "Khoa Công nghệ Thông tin", AnonymousCode = "Bạn Ẩn Yên #101", PasswordHash = "123456" },
            new User { Id = studentId, MSSV = "120000212", FullName = "Sinh viên Nguyễn Hoàng An", Email = "sv_an@unimind.edu.vn", Role = UserRole.Student, Faculty = "Khoa Công nghệ Thông tin", AnonymousCode = "Bạn Ẩn Yên #382", PasswordHash = "123456" },
            new User { Id = studentLocId, MSSV = "120000212", FullName = "Ngô Tấn Lộc", Email = "loc.ngo@lhu.edu.vn", Role = UserRole.Student, Faculty = "Khoa Công nghệ Thông tin", AnonymousCode = "Cú Mèo Say Ngủ #402", PasswordHash = "123456" },
            new User { Id = studentLuanId, MSSV = "120000352", FullName = "Lê Minh Luân", Email = "luan.le@lhu.edu.vn", Role = UserRole.Student, Faculty = "Khoa Công nghệ Thông tin", AnonymousCode = "Sóc Nâu Cần Mẫn #501", PasswordHash = "123456" },
            new User { Id = expDemoId, MSSV = "EXP000", FullName = "Chuyên viên Tư Vấn Mẫu", Email = "expert@unimind.edu.vn", Role = UserRole.Expert, Faculty = "Tâm lý Học đường", AnonymousCode = "Chuyên viên Tâm An", PasswordHash = "123456" },
            new User { Id = expHaId, MSSV = "EXP001", FullName = "ThS. Tâm lý Nguyễn Thanh Hà", Email = "ha.nguyen@unimind.edu.vn", Role = UserRole.Expert, Faculty = "Tâm lý Học đường", AnonymousCode = "Chuyên viên Thanh Hà", PasswordHash = "123456" },
            new User { Id = expLanId, MSSV = "EXP002", FullName = "TS. Tâm lý Trần Mai Lan", Email = "lan.tran@unimind.edu.vn", Role = UserRole.Expert, Faculty = "Trị liệu Nhận thức Hành vi", AnonymousCode = "Chuyên viên Mai Lan", PasswordHash = "123456" },
            new User { Id = expBaoId, MSSV = "EXP003", FullName = "ThS. Lê Quốc Bảo", Email = "bao.le@unimind.edu.vn", Role = UserRole.Expert, Faculty = "Định hướng Nghề nghiệp", AnonymousCode = "Chuyên viên Quốc Bảo", PasswordHash = "123456" },
            new User { Id = expTamId, MSSV = "EXP004", FullName = "ThS. Lê Thanh Tâm", Email = "tam.le@unimind.edu.vn", Role = UserRole.Expert, Faculty = "Cấp cứu Khủng hoảng SafeRoom", AnonymousCode = "Chuyên viên Thanh Tâm", PasswordHash = "123456" }
        });

        var expHaTableId = Guid.Parse("44444444-4444-4444-4444-444444444441");
        var expLanTableId = Guid.Parse("44444444-4444-4444-4444-444444444442");
        var expBaoTableId = Guid.Parse("44444444-4444-4444-4444-444444444443");
        var expTamTableId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        var expDemoTableId = Guid.Parse("44444444-4444-4444-4444-444444444440");
        Experts.AddRange(new[]
        {
            new Expert { Id = expDemoTableId, UserId = expDemoId, Title = "ThS. Tâm lý", AcademicDegree = "Thạc sĩ Tâm lý học Lâm sàng", Specialization = "Tâm lý Học đường & Hướng nghiệp", ExperienceYears = 5, RoomLocation = "P.302 (Tầng 3)", Rating = 5.0, TotalConsultations = 100 },
            new Expert { Id = expHaTableId, UserId = expHaId, Title = "ThS. Tâm lý", AcademicDegree = "Thạc sĩ Tâm lý học Lâm sàng ĐHQG • Chứng chỉ Tâm Lý Trị liệu", Specialization = "Áp lực học tập & Đồ án, Trầm cảm", ExperienceYears = 8, RoomLocation = "P.302 (Tầng 3)", Rating = 4.98, TotalConsultations = 1420 },
            new Expert { Id = expLanTableId, UserId = expLanId, Title = "TS. Tâm lý", AcademicDegree = "Tiến sĩ Trị liệu Nhận thức Hành vi (CBT) • Chuyên gia can thiệp", Specialization = "Trầm cảm, Lo âu & Khủng hoảng", ExperienceYears = 11, RoomLocation = "P.302 (Tầng 3)", Rating = 5.0, TotalConsultations = 2100 },
            new Expert { Id = expBaoTableId, UserId = expBaoId, Title = "ThS.", AcademicDegree = "Thạc sĩ Tâm lý Phát triển & Nghề nghiệp", Specialization = "Định hướng tương lai & Nghề nghiệp", ExperienceYears = 6, RoomLocation = "P.302 (Tầng 3)", Rating = 4.95, TotalConsultations = 980 },
            new Expert { Id = expTamTableId, UserId = expTamId, Title = "ThS.", AcademicDegree = "Thạc sĩ Tâm lý Lâm sàng • Cố vấn SafeRoom SOS", Specialization = "Khủng hoảng tâm lý cấp tính, Rối loạn âu lo", ExperienceYears = 9, RoomLocation = "P.305 (Khu B)", Rating = 4.97, TotalConsultations = 1850 }
        });

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var slot1 = Guid.NewGuid();
        var slot2 = Guid.NewGuid();
        var slot3 = Guid.NewGuid();
        var slot4 = Guid.NewGuid();

        TimeSlots.AddRange(new[]
        {
            new TimeSlot { Id = slot1, ExpertId = expHaTableId, SlotDate = today.AddDays(1), StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(10, 0), LocationType = LocationType.Physical, RoomName = "P.302", IsBooked = true },
            new TimeSlot { Id = slot2, ExpertId = expHaTableId, SlotDate = today.AddDays(1), StartTime = new TimeOnly(14, 0), EndTime = new TimeOnly(15, 0), LocationType = LocationType.Online, RoomName = "SafeRoom 101", IsBooked = false },
            new TimeSlot { Id = slot3, ExpertId = expLanTableId, SlotDate = today.AddDays(2), StartTime = new TimeOnly(10, 30), EndTime = new TimeOnly(11, 30), LocationType = LocationType.Physical, RoomName = "P.302", IsBooked = false },
            new TimeSlot { Id = slot4, ExpertId = expTamTableId, SlotDate = today.AddDays(1), StartTime = new TimeOnly(15, 30), EndTime = new TimeOnly(16, 30), LocationType = LocationType.Online, RoomName = "SafeRoom SOS", IsBooked = false }
        });

        Appointments.Add(new Appointment
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            ExpertId = expHaTableId,
            TimeSlotId = slot1,
            BookingCode = "ST-8890",
            AnonymousPseudonym = "Mây Trắng #841",
            ConsultationType = LocationType.Physical,
            Status = AppointmentStatus.Confirmed,
            ReasonNotes = "Em đang gặp khủng hoảng nặng về đề tài tốt nghiệp và mất ngủ kéo dài 2 tuần nay.",
            ClinicalNotes = "Sinh viên biểu hiện lo âu học đường mức độ vừa, đã hướng dẫn kỹ thuật thở bụng 4-7-8.",
            Dass21Summary = "Stress: 22 (Nặng), Lo âu: 14 (Vừa), Trầm cảm: 8 (Bình thường)",
            RiskScore = 65,
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        });

        SensitiveKeywords.AddRange(new[]
        {
            new SensitiveKeyword { Id = Guid.NewGuid(), Keyword = "tự tử", Category = "SelfHarm", RiskWeight = 99, AddedByRole = "Admin" },
            new SensitiveKeyword { Id = Guid.NewGuid(), Keyword = "nhảy lầu", Category = "SelfHarm", RiskWeight = 99, AddedByRole = "Admin" },
            new SensitiveKeyword { Id = Guid.NewGuid(), Keyword = "rạch tay", Category = "SelfHarm", RiskWeight = 95, AddedByRole = "Expert" },
            new SensitiveKeyword { Id = Guid.NewGuid(), Keyword = "không muốn sống", Category = "SelfHarm", RiskWeight = 90, AddedByRole = "Expert" },
            new SensitiveKeyword { Id = Guid.NewGuid(), Keyword = "uống thuốc ngủ", Category = "SelfHarm", RiskWeight = 92, AddedByRole = "Expert" },
            new SensitiveKeyword { Id = Guid.NewGuid(), Keyword = "mua bán điểm", Category = "AcademicFraud", RiskWeight = 80, AddedByRole = "Admin" }
        });

        var postCrisisId = Guid.NewGuid();
        var post2Id = Guid.NewGuid();

        CommunityPosts.AddRange(new[]
        {
            new CommunityPost
            {
                Id = postCrisisId,
                StudentId = studentId,
                AnonymousPseudonym = "Cú Mèo Say Ngủ #402",
                StudentRoleTag = "Sinh viên năm cuối • Khoa CNTT",
                Content = "Cả tuần nay mình không ngủ được quá 2 tiếng một đêm vì deadline đồ án và điểm rèn luyện. Có những lúc ngồi trên sân thượng giảng đường nhìn xuống thấy mọi thứ vô nghĩa quá... Có ai cũng từng cảm giác như mình không?",
                CategoryTag = "Áp lực học tập",
                StressLevelTag = "Áp lực rất cao (Stress Level 5/5)",
                HasKeywordsAlert = true,
                DetectedKeywords = "sân thượng, vô nghĩa, không ngủ được",
                SentimentLabel = "ExtremeNegative",
                SentimentScore = -0.85,
                RiskScore = 88,
                IsExtremeCrisis = true,
                IsSensitiveHiddenFromStudents = false,
                ModerationStatus = PostStatus.Approved,
                HugCount = 42,
                EmpathyCount = 28,
                CommentCount = 6
            },
            new CommunityPost
            {
                Id = post2Id,
                StudentId = studentId,
                AnonymousPseudonym = "Cún Mưa Rào #512",
                StudentRoleTag = "Tân sinh viên • Khoa Ngoại ngữ",
                Content = "Chào mọi người, mình là K28 mới nhập học xa nhà lên thành phố. Thấy phòng trọ vắng vẻ và bạn bè mới chưa thân quen nên hay bị tủi thân mỗi buổi tối. Mọi người có mẹo gì để làm quen môi trường mới không ạ?",
                CategoryTag = "Mối quan hệ",
                StressLevelTag = "Áp lực vừa (Stress Level 2/5)",
                HasKeywordsAlert = false,
                SentimentLabel = "Neutral",
                SentimentScore = -0.15,
                RiskScore = 20,
                IsExtremeCrisis = false,
                IsSensitiveHiddenFromStudents = false,
                ModerationStatus = PostStatus.Approved,
                HugCount = 18,
                EmpathyCount = 35,
                CommentCount = 4
            }
        });

        CommunityComments.AddRange(new[]
        {
            new CommunityComment
            {
                Id = Guid.NewGuid(),
                PostId = postCrisisId,
                UserId = expHaId,
                AuthorPseudonym = "ThS. Nguyễn Thanh Hà",
                Content = "Chào bạn! Thầy hiểu bạn đang phải gánh vác rất nhiều áp lực trong giai đoạn làm đồ án. Xin bạn nhớ rằng kết quả học tập không định nghĩa toàn bộ giá trị của bạn. Phòng tư vấn P.302 luôn có trà ấm và không gian yên tĩnh chờ bạn ghé qua bất kỳ lúc nào nhé!",
                IsExpertComment = true,
                ExpertTitle = "Chuyên viên Tâm lý UniMind (Đã xác thực)",
                IsSensitiveHiddenFromStudents = false,
                ModerationStatus = PostStatus.Approved
            }
        });

        NlpRiskAlerts.Add(new NlpRiskAlert
        {
            Id = Guid.NewGuid(),
            PostId = postCrisisId,
            StudentAnonymousCode = "Sinh viên Ẩn danh #902",
            Faculty = "Khoa CNTT (K26)",
            SnippetContent = "Mất ngủ kéo dài cả tuần nay, mình nhìn đâu cũng thấy vô định... chỉ muốn buông bỏ tất cả bài thi và cuộc sống này...",
            TriggeredKeywords = "mất ngủ kéo dài, vô định, buông bỏ",
            RiskScore = 94,
            TriageLevel = TriageLevel.Urgent,
            Status = "PendingAction"
        });

        MoodJournals.Add(new MoodJournal
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            MoodState = MoodType.Peaceful,
            EnergyLevel = 7,
            Triggers = "Đồ án tốt nghiệp, Bạn bè",
            JournalContent = "Hôm nay mình đã nộp xong bản phác thảo chương 2 đồ án. Thầy hướng dẫn góp ý khá tích cực nên cảm giác tảng đá trong lòng được nhấc bớt.",
            SentimentScore = 0.70,
            SentimentLabel = "Positive",
            AiAdvice = "Rất vui vì bạn đã có một ngày giải tỏa áp lực. Hãy duy trì thói quen ngủ sớm trước 23h đêm nay nhé!"
        });
    }
}
