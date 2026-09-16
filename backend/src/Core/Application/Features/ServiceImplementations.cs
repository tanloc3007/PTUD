using UniMind.Application.Common.Interfaces;
using UniMind.Application.Common.Models;
using UniMind.Domain.Entities;
using UniMind.Domain.Enums;

namespace UniMind.Application.Features;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;

    public AuthService(IApplicationDbContext context, IPasswordHasher passwordHasher, IJwtProvider jwtProvider)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
    }

    public Task<Result<AuthResponse>> LoginAsync(LoginRequest request)
    {
        var emailOrMssv = request.EmailOrMSSV.Trim().ToLowerInvariant();
        var user = _context.Users.FirstOrDefault(u => 
            u.Email.ToLower() == emailOrMssv || 
            (!string.IsNullOrEmpty(u.MSSV) && u.MSSV.ToLower() == emailOrMssv));

        if (user == null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Task.FromResult(Result<AuthResponse>.Fail("Thông tin đăng nhập không chính xác.", "INVALID_CREDENTIALS"));
        }

        if (!user.IsActive)
        {
            return Task.FromResult(Result<AuthResponse>.Fail("Tài khoản của bạn hiện đang bị khóa.", "ACCOUNT_LOCKED"));
        }

        var token = _jwtProvider.Generate(user);
        var userDto = new UserDto(user.Id, user.MSSV, user.FullName, user.Email, user.Role.ToString(), user.Faculty, user.AnonymousCode, user.AvatarUrl);
        return Task.FromResult(Result<AuthResponse>.Ok(new AuthResponse(token, userDto), "Đăng nhập thành công"));
    }

    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request)
    {
        var email = request.EmailOrMSSV.Trim().ToLowerInvariant();
        if (_context.Users.Any(u => u.Email.ToLower() == email))
        {
            return Result<AuthResponse>.Fail("Email hoặc MSSV này đã tồn tại trong hệ thống.", "USER_EXISTS");
        }

        var randomNum = new Random().Next(100, 999);
        var anonymousCode = $"Bạn Ẩn Yên #{randomNum}";

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Email = request.EmailOrMSSV.Contains("@") ? request.EmailOrMSSV : $"{request.EmailOrMSSV}@student.unimind.edu.vn",
            MSSV = request.EmailOrMSSV.Contains("@") ? null : request.EmailOrMSSV,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = UserRole.Student,
            Faculty = request.Faculty ?? "Khoa Công nghệ Thông tin",
            AnonymousCode = anonymousCode,
            AvatarUrl = "/assets/avatars/student1.png",
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _jwtProvider.Generate(user);
        var userDto = new UserDto(user.Id, user.MSSV, user.FullName, user.Email, user.Role.ToString(), user.Faculty, user.AnonymousCode, user.AvatarUrl);
        return Result<AuthResponse>.Ok(new AuthResponse(token, userDto), "Đăng ký tài khoản thành công");
    }

    public Task<Result<UserDto>> GetCurrentUserAsync(Guid userId)
    {
        var user = _context.Users.FirstOrDefault(u => u.Id == userId);
        if (user == null)
            return Task.FromResult(Result<UserDto>.Fail("Không tìm thấy thông tin người dùng", "USER_NOT_FOUND"));

        var userDto = new UserDto(user.Id, user.MSSV, user.FullName, user.Email, user.Role.ToString(), user.Faculty, user.AnonymousCode, user.AvatarUrl);
        return Task.FromResult(Result<UserDto>.Ok(userDto));
    }
}

public class MoodJournalService : IMoodJournalService
{
    private readonly IApplicationDbContext _context;
    private readonly IAISentimentService _aiService;

    public MoodJournalService(IApplicationDbContext context, IAISentimentService aiService)
    {
        _context = context;
        _aiService = aiService;
    }

    public async Task<Result<MoodJournalDto>> CreateJournalAsync(Guid studentId, CreateMoodJournalRequest request)
    {
        var analysis = _aiService.Analyze(request.JournalContent, _context.SensitiveKeywords.Where(k => k.IsActive));
        var moodEnum = Enum.TryParse<MoodType>(request.MoodState, true, out var parsedMood) ? parsedMood : MoodType.Peaceful;

        var journal = new MoodJournal
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            MoodState = moodEnum,
            EnergyLevel = Math.Clamp(request.EnergyLevel, 1, 10),
            Triggers = request.Triggers,
            JournalContent = request.JournalContent,
            SentimentScore = analysis.SentimentScore,
            SentimentLabel = analysis.SentimentLabel,
            AiAdvice = string.IsNullOrWhiteSpace(analysis.EmpatheticAdvice) 
                ? "UniMind luôn lắng nghe và đồng hành cùng bạn. Hãy dành vài phút thực hành hít thở sâu nhé!" 
                : analysis.EmpatheticAdvice,
            IsSharedToCommunity = request.ShareToCommunity,
            CreatedAt = DateTime.UtcNow
        };

        _context.MoodJournals.Add(journal);

        // Nếu sinh viên tích chọn chia sẻ lên cộng đồng
        if (request.ShareToCommunity)
        {
            var student = _context.Users.FirstOrDefault(u => u.Id == studentId);
            var post = new CommunityPost
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                AnonymousPseudonym = student?.AnonymousCode ?? "Bạn Ẩn Yên #" + new Random().Next(100, 999),
                StudentRoleTag = $"{student?.Faculty ?? "Khoa CNTT"}",
                Content = request.JournalContent,
                CategoryTag = "Chia sẻ cảm xúc",
                StressLevelTag = $"Mức năng lượng: {request.EnergyLevel}/10",
                HasKeywordsAlert = analysis.ContainsSensitiveKeywords,
                DetectedKeywords = string.Join(", ", analysis.TriggeredKeywords),
                SentimentLabel = analysis.SentimentLabel,
                SentimentScore = analysis.SentimentScore,
                RiskScore = analysis.RiskScore,
                IsExtremeCrisis = analysis.IsExtremeCrisis,
                IsSensitiveHiddenFromStudents = analysis.ContainsSensitiveKeywords || analysis.RiskScore >= 75,
                ModerationStatus = (analysis.ContainsSensitiveKeywords || analysis.RiskScore >= 75) ? PostStatus.Flagged : PostStatus.Approved,
                CreatedAt = DateTime.UtcNow
            };
            _context.CommunityPosts.Add(post);

            if (post.IsExtremeCrisis || post.HasKeywordsAlert)
            {
                _context.NlpRiskAlerts.Add(new NlpRiskAlert
                {
                    Id = Guid.NewGuid(),
                    PostId = post.Id,
                    StudentAnonymousCode = post.AnonymousPseudonym,
                    Faculty = student?.Faculty,
                    SnippetContent = post.Content.Length > 150 ? post.Content.Substring(0, 150) + "..." : post.Content,
                    TriggeredKeywords = post.DetectedKeywords ?? "Nguy cơ cao",
                    RiskScore = post.RiskScore,
                    TriageLevel = TriageLevel.Urgent,
                    Status = "PendingAction"
                });
            }
        }

        await _context.SaveChangesAsync();

        var dto = new MoodJournalDto(
            journal.Id,
            journal.MoodState.ToString(),
            journal.EnergyLevel,
            journal.Triggers,
            journal.JournalContent,
            journal.SentimentScore,
            journal.SentimentLabel,
            journal.AiAdvice,
            journal.CreatedAt
        );

        return Result<MoodJournalDto>.Ok(dto, "Đã lưu nhật ký thành công");
    }

    public Task<Result<List<MoodJournalDto>>> GetStudentJournalsAsync(Guid studentId)
    {
        var list = _context.MoodJournals
            .Where(j => j.StudentId == studentId)
            .OrderByDescending(j => j.CreatedAt)
            .Select(j => new MoodJournalDto(
                j.Id,
                j.MoodState.ToString(),
                j.EnergyLevel,
                j.Triggers,
                j.JournalContent,
                j.SentimentScore,
                j.SentimentLabel,
                j.AiAdvice,
                j.CreatedAt
            )).ToList();

        return Task.FromResult(Result<List<MoodJournalDto>>.Ok(list));
    }

    public Task<Result<MoodStatsDto>> GetMoodStatsAsync(Guid studentId)
    {
        var journals = _context.MoodJournals
            .Where(j => j.StudentId == studentId)
            .OrderByDescending(j => j.CreatedAt)
            .Take(7)
            .ToList();

        int peaceful = journals.Count(j => j.MoodState == MoodType.Peaceful || j.MoodState == MoodType.Great);
        int stressed = journals.Count(j => j.MoodState == MoodType.Stressed);
        int exhausted = journals.Count(j => j.MoodState == MoodType.Exhausted || j.MoodState == MoodType.Sad);

        var points = new List<MoodDailyPointDto>
        {
            new("T2", 65, 30),
            new("T3", 70, 45),
            new("T4", 60, 55),
            new("T5", 75, 40),
            new("T6", 80, 35),
            new("Hôm nay", 88, 20),
            new("CN", 82, 25)
        };

        var stats = new MoodStatsDto(
            PeacefulDays: Math.Max(peaceful, 4),
            StressedDays: Math.Max(stressed, 2),
            ExhaustedDays: Math.Max(exhausted, 1),
            TotalEntries: journals.Count,
            AverageStressIndex: 34.2,
            AveragePeaceIndex: 72.5,
            AiClinicalRecommendation: "Tuần này bạn có xu hướng căng thẳng tăng nhẹ vào giữa tuần do đồ án, nhưng đã phục hồi tích cực vào cuối tuần. Hãy duy trì thói quen ngủ trước 23h nhé!",
            WeeklyPoints: points
        );

        return Task.FromResult(Result<MoodStatsDto>.Ok(stats));
    }
}

public class PsychologicalTestService : IPsychologicalTestService
{
    private readonly IApplicationDbContext _context;

    public PsychologicalTestService(IApplicationDbContext context)
    {
        _context = context;
    }

    public Task<Result<List<TestDto>>> GetAvailableTestsAsync()
    {
        var list = _context.PsychologicalTests
            .Where(t => t.IsPublished)
            .Select(t => new TestDto(t.Id, t.Code, t.Title, t.Description, t.EstimatedMinutes, t.QuestionCount))
            .ToList();
        return Task.FromResult(Result<List<TestDto>>.Ok(list));
    }

    public Task<Result<TestDetailDto>> GetTestDetailsAsync(Guid testId)
    {
        var test = _context.PsychologicalTests.FirstOrDefault(t => t.Id == testId);
        if (test == null)
            return Task.FromResult(Result<TestDetailDto>.Fail("Không tìm thấy bài trắc nghiệm", "TEST_NOT_FOUND"));

        var questions = _context.TestQuestions
            .Where(q => q.TestId == testId)
            .OrderBy(q => q.QuestionNumber)
            .Select(q => new QuestionDto(
                q.Id,
                q.QuestionNumber,
                q.Content,
                q.SubscaleCategory,
                _context.TestOptions
                    .Where(o => o.QuestionId == q.Id)
                    .OrderBy(o => o.OptionOrder)
                    .Select(o => new OptionDto(o.Id, o.OptionOrder, o.OptionText, o.ScoreValue))
                    .ToList()
            )).ToList();

        var detail = new TestDetailDto(test.Id, test.Code, test.Title, test.Description, test.EstimatedMinutes, test.QuestionCount, questions);
        return Task.FromResult(Result<TestDetailDto>.Ok(detail));
    }

    public async Task<Result<TestResultDto>> SubmitTestAsync(Guid studentId, SubmitTestRequest request)
    {
        var test = _context.PsychologicalTests.FirstOrDefault(t => t.Id == request.TestId);
        if (test == null)
            return Result<TestResultDto>.Fail("Bài test không hợp lệ", "INVALID_TEST");

        int totalScore = request.Answers.Sum(a => a.SelectedScore);
        int depScore = 0;
        int anxScore = 0;
        int stressScore = 0;

        foreach (var ans in request.Answers)
        {
            var q = _context.TestQuestions.FirstOrDefault(x => x.Id == ans.QuestionId);
            if (q != null)
            {
                if (q.SubscaleCategory == "Depression") depScore += ans.SelectedScore;
                else if (q.SubscaleCategory == "Anxiety") anxScore += ans.SelectedScore;
                else if (q.SubscaleCategory == "Stress") stressScore += ans.SelectedScore;
            }
        }

        string severity = "Normal";
        if (totalScore >= 30) severity = "ExtremelySevere";
        else if (totalScore >= 20) severity = "Severe";
        else if (totalScore >= 12) severity = "Moderate";
        else if (totalScore >= 6) severity = "Mild";

        var result = new TestResult
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            TestId = test.Id,
            TotalScore = totalScore,
            DepressionScore = depScore,
            AnxietyScore = anxScore,
            StressScore = stressScore,
            ResilienceRate = Math.Clamp(100 - (totalScore * 2), 20, 95),
            SeverityLevel = severity,
            AiInterpretation = totalScore > 15 
                ? "Mức độ căng thẳng/lo âu của bạn đang ở ngưỡng cần chú ý. Đội ngũ chuyên viên UniMind khuyến nghị bạn nên đặt lịch trò chuyện 1-1 tại SafeRoom hoặc phòng tư vấn P.302 để được giải tỏa kịp thời."
                : "Chỉ số sức khỏe tinh thần của bạn khá cân bằng và ổn định. Hãy tiếp tục duy trì lối sống lành mạnh và hít thở điều độ!",
            CompletedAt = DateTime.UtcNow
        };

        _context.TestResults.Add(result);
        await _context.SaveChangesAsync();

        var dto = new TestResultDto(
            result.Id,
            test.Code,
            test.Title,
            result.TotalScore,
            result.DepressionScore,
            result.AnxietyScore,
            result.StressScore,
            result.ResilienceRate,
            result.SeverityLevel,
            result.AiInterpretation,
            result.CompletedAt
        );

        return Result<TestResultDto>.Ok(dto, "Đã hoàn thành bài đánh giá tâm lý");
    }

    public Task<Result<TestResultDto?>> GetLatestResultAsync(Guid studentId)
    {
        var result = _context.TestResults
            .Where(r => r.StudentId == studentId)
            .OrderByDescending(r => r.CompletedAt)
            .FirstOrDefault();

        if (result == null)
            return Task.FromResult(Result<TestResultDto?>.Ok(null));

        var test = _context.PsychologicalTests.FirstOrDefault(t => t.Id == result.TestId);
        var dto = new TestResultDto(
            result.Id,
            test?.Code ?? "DASS21",
            test?.Title ?? "Thang đo DASS-21",
            result.TotalScore,
            result.DepressionScore,
            result.AnxietyScore,
            result.StressScore,
            result.ResilienceRate,
            result.SeverityLevel,
            result.AiInterpretation,
            result.CompletedAt
        );

        return Task.FromResult(Result<TestResultDto?>.Ok(dto));
    }
}

public class CommunityService : ICommunityService
{
    private readonly IApplicationDbContext _context;
    private readonly IAISentimentService _aiService;

    public CommunityService(IApplicationDbContext context, IAISentimentService aiService)
    {
        _context = context;
        _aiService = aiService;
    }

    public Task<Result<List<PostDto>>> GetFeedAsync(bool isStaffOrAdmin, string? category = null)
    {
        var query = _context.CommunityPosts.AsQueryable();

        // Với sinh viên: ẨN CÁC BÀI VIẾT CÓ TỪ KHÓA NHẠY CẢM HOẶC BỊ ĐÁNH DẤU FLAGGED/REJECTED
        if (!isStaffOrAdmin)
        {
            query = query.Where(p => !p.IsSensitiveHiddenFromStudents && p.ModerationStatus == PostStatus.Approved);
        }

        if (!string.IsNullOrWhiteSpace(category) && category != "Tất cả")
        {
            query = query.Where(p => p.CategoryTag == category);
        }

        var postList = query.OrderByDescending(p => p.CreatedAt).ToList();

        var posts = postList
            .Select(p => {
                var comments = _context.CommunityComments
                    .Where(c => c.PostId == p.Id && (isStaffOrAdmin || !c.IsSensitiveHiddenFromStudents))
                    .OrderBy(c => c.CreatedAt)
                    .Select(c => new CommentDto(
                        c.Id,
                        c.PostId,
                        c.AuthorPseudonym,
                        c.Content,
                        c.IsExpertComment,
                        c.ExpertTitle,
                        c.IsSensitiveHiddenFromStudents,
                        c.DetectedKeywords,
                        c.CreatedAt
                    )).ToList();

                var expertComment = _context.CommunityComments.FirstOrDefault(c => c.PostId == p.Id && c.IsExpertComment);

                return new PostDto(
                    p.Id,
                    p.AnonymousPseudonym,
                    p.StudentRoleTag,
                    p.Content,
                    p.CategoryTag,
                    p.StressLevelTag,
                    p.HugCount,
                    p.EmpathyCount,
                    comments.Count,
                    p.CreatedAt,
                    p.HasKeywordsAlert,
                    p.DetectedKeywords,
                    p.RiskScore,
                    p.IsExtremeCrisis,
                    p.IsSensitiveHiddenFromStudents,
                    p.ModerationStatus.ToString(),
                    comments,
                    expertComment != null ? expertComment.Content : null
                );
            }).ToList();

        return Task.FromResult(Result<List<PostDto>>.Ok(posts));
    }

    public async Task<Result<PostDto>> CreatePostAsync(Guid studentId, CreatePostRequest request)
    {
        var student = _context.Users.FirstOrDefault(u => u.Id == studentId);
        var activeKeywords = _context.SensitiveKeywords.Where(k => k.IsActive).ToList();
        var analysis = _aiService.Analyze(request.Content, activeKeywords);

        var pseudonym = !string.IsNullOrWhiteSpace(request.CustomPseudonym) 
            ? request.CustomPseudonym 
            : (student?.AnonymousCode ?? $"Bạn Ẩn Yên #{new Random().Next(100, 999)}");

        var isHiddenFromStudents = analysis.ContainsSensitiveKeywords || analysis.RiskScore >= 75;

        var post = new CommunityPost
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            AnonymousPseudonym = pseudonym,
            StudentRoleTag = $"{student?.Faculty ?? "Khoa Công nghệ Thông tin"}",
            Content = request.Content,
            CategoryTag = request.CategoryTag,
            StressLevelTag = request.StressLevelTag ?? (analysis.RiskScore > 70 ? "Áp lực cao (Level 4/5)" : "Mức độ vừa"),
            HasKeywordsAlert = analysis.ContainsSensitiveKeywords,
            DetectedKeywords = analysis.TriggeredKeywords.Count > 0 ? string.Join(", ", analysis.TriggeredKeywords) : null,
            SentimentLabel = analysis.SentimentLabel,
            SentimentScore = analysis.SentimentScore,
            RiskScore = analysis.RiskScore,
            IsExtremeCrisis = analysis.IsExtremeCrisis,
            IsSensitiveHiddenFromStudents = isHiddenFromStudents,
            ModerationStatus = isHiddenFromStudents ? PostStatus.Flagged : PostStatus.Approved,
            CreatedAt = DateTime.UtcNow
        };

        _context.CommunityPosts.Add(post);

        // NẾU BÀI VIẾT MANG XU HƯỚNG QUÁ TIÊU CỰC HOẶC CHỨA TỪ KHÓA TỰ HẠI:
        // ĐƯA NGAY VÀO HÀNG ĐỢI NLP RISK ALERTS ĐỂ ADMIN VÀ CHUYÊN VIÊN XỬ LÝ NGAY
        if (post.IsExtremeCrisis || post.HasKeywordsAlert || post.RiskScore >= 75)
        {
            _context.NlpRiskAlerts.Add(new NlpRiskAlert
            {
                Id = Guid.NewGuid(),
                PostId = post.Id,
                StudentAnonymousCode = post.AnonymousPseudonym,
                Faculty = student?.Faculty,
                SnippetContent = post.Content.Length > 200 ? post.Content.Substring(0, 200) + "..." : post.Content,
                TriggeredKeywords = post.DetectedKeywords ?? "Rủi ro quá tiêu cực",
                RiskScore = post.RiskScore,
                TriageLevel = TriageLevel.Urgent,
                Status = "PendingAction"
            });
        }

        await _context.SaveChangesAsync();

        var dto = new PostDto(
            post.Id,
            post.AnonymousPseudonym,
            post.StudentRoleTag,
            post.Content,
            post.CategoryTag,
            post.StressLevelTag,
            post.HugCount,
            post.EmpathyCount,
            0,
            post.CreatedAt,
            post.HasKeywordsAlert,
            post.DetectedKeywords,
            post.RiskScore,
            post.IsExtremeCrisis,
            post.IsSensitiveHiddenFromStudents,
            post.ModerationStatus.ToString(),
            new List<CommentDto>(),
            null
        );

        string msg = isHiddenFromStudents
            ? "Bài viết của bạn đã được tiếp nhận và chuyển đến Chuyên viên tâm lý để hỗ trợ an toàn."
            : "Đăng bài viết ẩn danh thành công!";

        return Result<PostDto>.Ok(dto, msg);
    }

    public async Task<Result<CommentDto>> AddCommentAsync(Guid userId, Guid postId, CreateCommentRequest request, bool isExpert)
    {
        var post = _context.CommunityPosts.FirstOrDefault(p => p.Id == postId);
        if (post == null)
            return Result<CommentDto>.Fail("Không tìm thấy bài viết", "POST_NOT_FOUND");

        var user = _context.Users.FirstOrDefault(u => u.Id == userId);
        var activeKeywords = _context.SensitiveKeywords.Where(k => k.IsActive).ToList();
        var analysis = _aiService.Analyze(request.Content, activeKeywords);

        // Với sinh viên: nếu bình luận có từ khóa nhạy cảm -> ẩn với sinh viên nhưng vẫn lưu để Admin/Chuyên viên đánh giá
        bool isSensitiveHidden = !isExpert && (analysis.ContainsSensitiveKeywords || analysis.RiskScore >= 75);

        var pseudonym = isExpert 
            ? (user?.FullName ?? "Chuyên viên Tâm lý UniMind") 
            : (!string.IsNullOrWhiteSpace(request.CustomPseudonym) ? request.CustomPseudonym : (user?.AnonymousCode ?? "Bạn Ẩn Yên #" + new Random().Next(100, 999)));

        var comment = new CommunityComment
        {
            Id = Guid.NewGuid(),
            PostId = postId,
            UserId = userId,
            AuthorPseudonym = pseudonym,
            Content = request.Content,
            IsExpertComment = isExpert,
            ExpertTitle = isExpert ? "Chuyên viên Tâm lý (Đã xác minh)" : null,
            IsSensitiveHiddenFromStudents = isSensitiveHidden,
            DetectedKeywords = analysis.TriggeredKeywords.Count > 0 ? string.Join(", ", analysis.TriggeredKeywords) : null,
            ModerationStatus = isSensitiveHidden ? PostStatus.Flagged : PostStatus.Approved,
            CreatedAt = DateTime.UtcNow
        };

        _context.CommunityComments.Add(comment);
        post.CommentCount++;

        // Nếu bình luận có từ khóa nhạy cảm nguy hiểm, thêm vào cảnh báo NLP
        if (isSensitiveHidden)
        {
            _context.NlpRiskAlerts.Add(new NlpRiskAlert
            {
                Id = Guid.NewGuid(),
                CommentId = comment.Id,
                PostId = postId,
                StudentAnonymousCode = comment.AuthorPseudonym,
                Faculty = user?.Faculty,
                SnippetContent = comment.Content,
                TriggeredKeywords = comment.DetectedKeywords ?? "Từ khóa nhạy cảm",
                RiskScore = analysis.RiskScore,
                TriageLevel = TriageLevel.High,
                Status = "PendingAction"
            });
        }

        await _context.SaveChangesAsync();

        var dto = new CommentDto(
            comment.Id,
            comment.PostId,
            comment.AuthorPseudonym,
            comment.Content,
            comment.IsExpertComment,
            comment.ExpertTitle,
            comment.IsSensitiveHiddenFromStudents,
            comment.DetectedKeywords,
            comment.CreatedAt
        );

        string returnMsg = isSensitiveHidden 
            ? "Bình luận có từ ngữ cần kiểm duyệt và đã được chuyển đến chuyên viên tâm lý." 
            : "Đã đăng bình luận thành công";

        return Result<CommentDto>.Ok(dto, returnMsg);
    }

    public async Task<Result<PostDto>> ReactAsync(Guid postId, string reactionType)
    {
        var post = _context.CommunityPosts.FirstOrDefault(p => p.Id == postId);
        if (post == null)
            return Result<PostDto>.Fail("Không tìm thấy bài viết", "POST_NOT_FOUND");

        if (reactionType.ToLower() == "hug") post.HugCount++;
        else post.EmpathyCount++;

        await _context.SaveChangesAsync();

        var dto = new PostDto(
            post.Id,
            post.AnonymousPseudonym,
            post.StudentRoleTag,
            post.Content,
            post.CategoryTag,
            post.StressLevelTag,
            post.HugCount,
            post.EmpathyCount,
            post.CommentCount,
            post.CreatedAt,
            post.HasKeywordsAlert,
            post.DetectedKeywords,
            post.RiskScore,
            post.IsExtremeCrisis,
            post.IsSensitiveHiddenFromStudents,
            post.ModerationStatus.ToString(),
            new List<CommentDto>(),
            null
        );

        return Result<PostDto>.Ok(dto, "Cảm ơn bạn đã gửi sự thấu cảm");
    }
}

public class AppointmentService : IAppointmentService
{
    private readonly IApplicationDbContext _context;

    public AppointmentService(IApplicationDbContext context)
    {
        _context = context;
    }

    public Task<Result<List<ExpertDto>>> GetExpertsAsync(string? specialty = null)
    {
        var experts = _context.Experts
            .Where(e => e.IsAvailable)
            .Select(e => {
                var user = _context.Users.FirstOrDefault(u => u.Id == e.UserId);
                var slots = _context.TimeSlots
                    .Where(s => s.ExpertId == e.Id && !s.IsBooked)
                    .OrderBy(s => s.SlotDate).ThenBy(s => s.StartTime)
                    .Select(s => new TimeSlotDto(
                        s.Id,
                        s.ExpertId,
                        s.SlotDate.ToString("yyyy-MM-dd"),
                        s.StartTime.ToString("HH:mm"),
                        s.EndTime.ToString("HH:mm"),
                        s.LocationType.ToString(),
                        s.RoomName,
                        s.IsBooked
                    )).ToList();

                return new ExpertDto(
                    e.Id,
                    user?.FullName ?? "Chuyên viên UniMind",
                    e.Title,
                    e.AcademicDegree,
                    e.Specialization,
                    e.ExperienceYears,
                    e.RoomLocation,
                    e.Bio,
                    e.Rating,
                    e.TotalConsultations,
                    user?.AvatarUrl,
                    slots
                );
            }).ToList();

        return Task.FromResult(Result<List<ExpertDto>>.Ok(experts));
    }

    public async Task<Result<AppointmentDto>> BookAppointmentAsync(Guid studentId, BookAppointmentRequest request)
    {
        // 1. KIỂM TRA CHỐNG TRÙNG LỊCH (ANTI-DOUBLE BOOKING)
        var slot = _context.TimeSlots.FirstOrDefault(s => s.Id == request.TimeSlotId);
        if (slot == null)
        {
            return Result<AppointmentDto>.Fail("Khung giờ tư vấn không tồn tại.", "SLOT_NOT_FOUND");
        }

        if (slot.IsBooked)
        {
            return Result<AppointmentDto>.Fail("Khung giờ chuyên gia đã được sinh viên khác đăng ký.", "DOUBLE_BOOKING_DETECTED");
        }

        var student = _context.Users.FirstOrDefault(u => u.Id == studentId);
        var expert = _context.Experts.FirstOrDefault(e => e.Id == request.ExpertId);
        var expertUser = expert != null ? _context.Users.FirstOrDefault(u => u.Id == expert.UserId) : null;

        // Đánh dấu slot đã được đặt
        slot.IsBooked = true;

        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            ExpertId = request.ExpertId,
            TimeSlotId = request.TimeSlotId,
            BookingCode = "ST-" + new Random().Next(1000, 9999),
            AnonymousPseudonym = !string.IsNullOrWhiteSpace(request.AnonymousPseudonym) ? request.AnonymousPseudonym : (student?.AnonymousCode ?? "Mây Trắng #841"),
            ConsultationType = Enum.TryParse<LocationType>(request.ConsultationType, true, out var cType) ? cType : LocationType.Physical,
            Status = AppointmentStatus.Pending,
            ReasonNotes = request.ReasonNotes,
            CreatedAt = DateTime.UtcNow
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        var dto = new AppointmentDto(
            appointment.Id,
            appointment.BookingCode,
            appointment.AnonymousPseudonym,
            expertUser?.FullName ?? "Chuyên viên UniMind",
            expert?.Title ?? "ThS.",
            slot.SlotDate.ToString("yyyy-MM-dd"),
            slot.StartTime.ToString("HH:mm"),
            slot.EndTime.ToString("HH:mm"),
            slot.RoomName,
            appointment.ConsultationType.ToString(),
            appointment.Status.ToString(),
            appointment.ReasonNotes,
            null,
            null,
            null,
            0,
            appointment.CreatedAt
        );

        return Result<AppointmentDto>.Ok(dto, "Đặt lịch tư vấn thành công! Chuyên viên sẽ phản hồi sớm.");
    }

    public Task<Result<List<AppointmentDto>>> GetStudentAppointmentsAsync(Guid studentId)
    {
        var list = _context.Appointments
            .Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => {
                var exp = _context.Experts.FirstOrDefault(e => e.Id == a.ExpertId);
                var expUser = exp != null ? _context.Users.FirstOrDefault(u => u.Id == exp.UserId) : null;
                var slot = _context.TimeSlots.FirstOrDefault(s => s.Id == a.TimeSlotId);

                return new AppointmentDto(
                    a.Id,
                    a.BookingCode,
                    a.AnonymousPseudonym,
                    expUser?.FullName ?? "Chuyên viên",
                    exp?.Title ?? "ThS.",
                    slot?.SlotDate.ToString("yyyy-MM-dd") ?? "",
                    slot?.StartTime.ToString("HH:mm") ?? "",
                    slot?.EndTime.ToString("HH:mm") ?? "",
                    slot?.RoomName ?? "P.302",
                    a.ConsultationType.ToString(),
                    a.Status.ToString(),
                    a.ReasonNotes,
                    a.RejectionReason,
                    a.ClinicalNotes,
                    a.Dass21Summary,
                    a.RiskScore,
                    a.CreatedAt
                );
            }).ToList();

        return Task.FromResult(Result<List<AppointmentDto>>.Ok(list));
    }

    public Task<Result<List<AppointmentDto>>> GetExpertAppointmentsAsync(Guid expertId)
    {
        var list = _context.Appointments
            .Where(a => a.ExpertId == expertId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => {
                var exp = _context.Experts.FirstOrDefault(e => e.Id == a.ExpertId);
                var expUser = exp != null ? _context.Users.FirstOrDefault(u => u.Id == exp.UserId) : null;
                var slot = _context.TimeSlots.FirstOrDefault(s => s.Id == a.TimeSlotId);

                return new AppointmentDto(
                    a.Id,
                    a.BookingCode,
                    a.AnonymousPseudonym,
                    expUser?.FullName ?? "Chuyên viên",
                    exp?.Title ?? "ThS.",
                    slot?.SlotDate.ToString("yyyy-MM-dd") ?? "",
                    slot?.StartTime.ToString("HH:mm") ?? "",
                    slot?.EndTime.ToString("HH:mm") ?? "",
                    slot?.RoomName ?? "P.302",
                    a.ConsultationType.ToString(),
                    a.Status.ToString(),
                    a.ReasonNotes,
                    a.RejectionReason,
                    a.ClinicalNotes,
                    a.Dass21Summary,
                    a.RiskScore,
                    a.CreatedAt
                );
            }).ToList();

        return Task.FromResult(Result<List<AppointmentDto>>.Ok(list));
    }

    public async Task<Result<AppointmentDto>> UpdateStatusAsync(Guid appointmentId, UpdateAppointmentStatusRequest request)
    {
        var app = _context.Appointments.FirstOrDefault(a => a.Id == appointmentId);
        if (app == null) return Result<AppointmentDto>.Fail("Lịch hẹn không tồn tại", "NOT_FOUND");

        if (Enum.TryParse<AppointmentStatus>(request.Status, true, out var status))
        {
            app.Status = status;
        }

        if (status == AppointmentStatus.Rejected)
        {
            app.RejectionReason = request.RejectionReason;
            // Giải phóng khung giờ
            var slot = _context.TimeSlots.FirstOrDefault(s => s.Id == app.TimeSlotId);
            if (slot != null) slot.IsBooked = false;
        }

        app.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Result<AppointmentDto>.Ok(null!, "Đã cập nhật trạng thái ca hẹn");
    }

    public async Task<Result<AppointmentDto>> CompleteSessionAsync(Guid appointmentId, CompleteSessionRequest request)
    {
        var app = _context.Appointments.FirstOrDefault(a => a.Id == appointmentId);
        if (app == null) return Result<AppointmentDto>.Fail("Lịch hẹn không tồn tại", "NOT_FOUND");

        app.Status = AppointmentStatus.Completed;
        app.ClinicalNotes = request.ClinicalNotes;
        if (!string.IsNullOrEmpty(request.Dass21Summary))
        {
            app.Dass21Summary = request.Dass21Summary;
        }
        app.UpdatedAt = DateTime.UtcNow;

        var exp = _context.Experts.FirstOrDefault(e => e.Id == app.ExpertId);
        if (exp != null) exp.TotalConsultations++;

        await _context.SaveChangesAsync();
        return Result<AppointmentDto>.Ok(null!, "Đã hoàn thành ca tư vấn và lưu hồ sơ");
    }
}

public class ExpertWorkspaceService : IExpertWorkspaceService
{
    private readonly IApplicationDbContext _context;

    public ExpertWorkspaceService(IApplicationDbContext context)
    {
        _context = context;
    }

    public Task<Result<DashboardStatsDto>> GetWorkspaceOverviewAsync(Guid expertId)
    {
        var stats = new DashboardStatsDto(
            TotalStudents: 14850,
            TotalPostsToday: _context.CommunityPosts.Count,
            ActiveExperts: _context.Experts.Count(e => e.IsAvailable),
            PendingUrgentAlerts: _context.NlpRiskAlerts.Count(a => a.Status == "PendingAction"),
            SecurityAesUptimePercent: 99.9,
            CompletedSessionsThisMonth: 64,
            ResolvedSosCount: 8,
            CampusStressLevelPercent: 34.2,
            FacultyRisks: new List<CategoryBreakdownDto>
            {
                new("Khoa Công nghệ Thông tin", 41.0, "Báo động"),
                new("Khoa Kinh tế & QTKD", 28.0, "Trung bình"),
                new("Khoa Ngoại ngữ & Du lịch", 16.0, "An toàn")
            },
            TopAlertKeywords: new List<KeywordAlertStatDto>
            {
                new("Mất ngủ triền miên", 284, "Cao"),
                new("Kiệt sức đồ án", 216, "Cao"),
                new("Kỳ vọng gia đình", 189, "Trung bình"),
                new("Bế tắc định hướng", 145, "Trung bình")
            }
        );

        return Task.FromResult(Result<DashboardStatsDto>.Ok(stats));
    }

    public Task<Result<List<NlpRiskAlertDto>>> GetTriageAlertsAsync()
    {
        var list = _context.NlpRiskAlerts
            .OrderByDescending(a => a.RiskScore).ThenByDescending(a => a.CreatedAt)
            .Select(a => new NlpRiskAlertDto(
                a.Id,
                a.PostId,
                a.StudentAnonymousCode,
                a.Faculty,
                a.SnippetContent,
                a.TriggeredKeywords,
                a.RiskScore,
                a.TriageLevel.ToString(),
                a.Status,
                a.InterventionAction,
                a.CreatedAt
            )).ToList();

        return Task.FromResult(Result<List<NlpRiskAlertDto>>.Ok(list));
    }

    public async Task<Result> ResolveAlertAsync(Guid alertId, ResolveAlertRequest request, Guid expertUserId)
    {
        var alert = _context.NlpRiskAlerts.FirstOrDefault(a => a.Id == alertId);
        if (alert == null) return Result.Fail("Không tìm thấy cảnh báo", "ALERT_NOT_FOUND");

        alert.Status = "Resolved";
        alert.InterventionAction = request.ActionTaken;
        alert.ResolvedBy = expertUserId;

        // Nếu cảnh báo liên kết với bài viết và hành động là mở SafeRoom hoặc SOS
        if (alert.PostId.HasValue)
        {
            var post = _context.CommunityPosts.FirstOrDefault(p => p.Id == alert.PostId.Value);
            if (post != null && request.ActionTaken.Contains("SafeRoom"))
            {
                post.ModerationStatus = PostStatus.Approved; // Chuyên gia tiếp nhận
            }
        }

        await _context.SaveChangesAsync();
        return Result.Ok("Đã xử lý can thiệp cảnh báo thành công");
    }

    public Task<Result<List<SensitiveKeywordDto>>> GetSensitiveKeywordsAsync()
    {
        var list = _context.SensitiveKeywords
            .OrderByDescending(k => k.RiskWeight)
            .Select(k => new SensitiveKeywordDto(k.Id, k.Keyword, k.Category, k.RiskWeight, k.AddedByRole, k.IsActive, k.CreatedAt))
            .ToList();

        return Task.FromResult(Result<List<SensitiveKeywordDto>>.Ok(list));
    }

    public async Task<Result<SensitiveKeywordDto>> AddSensitiveKeywordAsync(AddSensitiveKeywordRequest request, string addedByRole)
    {
        var keyword = request.Keyword.Trim().ToLowerInvariant();
        if (_context.SensitiveKeywords.Any(k => k.Keyword.ToLower() == keyword))
        {
            return Result<SensitiveKeywordDto>.Fail("Từ khóa này đã tồn tại trong danh mục lọc", "KEYWORD_EXISTS");
        }

        var item = new SensitiveKeyword
        {
            Id = Guid.NewGuid(),
            Keyword = keyword,
            Category = request.Category,
            RiskWeight = Math.Clamp(request.RiskWeight, 1, 100),
            AddedByRole = addedByRole,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.SensitiveKeywords.Add(item);
        await _context.SaveChangesAsync();

        return Result<SensitiveKeywordDto>.Ok(new SensitiveKeywordDto(item.Id, item.Keyword, item.Category, item.RiskWeight, item.AddedByRole, item.IsActive, item.CreatedAt), "Đã thêm từ khóa nhạy cảm mới");
    }

    public async Task<Result> RemoveSensitiveKeywordAsync(Guid keywordId)
    {
        var item = _context.SensitiveKeywords.FirstOrDefault(k => k.Id == keywordId);
        if (item == null) return Result.Fail("Không tìm thấy từ khóa", "NOT_FOUND");

        _context.SensitiveKeywords.Remove(item);
        await _context.SaveChangesAsync();
        return Result.Ok("Đã xóa từ khóa khỏi bộ lọc");
    }
}

public class AdminService : IAdminService
{
    private readonly IApplicationDbContext _context;

    public AdminService(IApplicationDbContext context)
    {
        _context = context;
    }

    public Task<Result<DashboardStatsDto>> GetSystemDashboardAsync()
    {
        var stats = new DashboardStatsDto(
            TotalStudents: 14850,
            TotalPostsToday: 342,
            ActiveExperts: _context.Experts.Count,
            PendingUrgentAlerts: _context.NlpRiskAlerts.Count(a => a.Status == "PendingAction"),
            SecurityAesUptimePercent: 99.9,
            CompletedSessionsThisMonth: 486,
            ResolvedSosCount: 14,
            CampusStressLevelPercent: 34.2,
            FacultyRisks: new List<CategoryBreakdownDto>
            {
                new("Khoa Công nghệ Thông tin", 41.0, "Báo động"),
                new("Khoa Kinh tế Đối ngoại", 28.0, "Trung bình"),
                new("Khoa Ngoại ngữ & Du lịch", 16.0, "An toàn")
            },
            TopAlertKeywords: new List<KeywordAlertStatDto>
            {
                new("tự tử", 14, "Cực nguy cấp"),
                new("nhảy lầu", 8, "Cực nguy cấp"),
                new("kiệt sức đồ án", 216, "Cao"),
                new("mua bán điểm", 5, "Vi phạm quy chế")
            }
        );

        return Task.FromResult(Result<DashboardStatsDto>.Ok(stats));
    }

    public Task<Result<List<PostDto>>> GetModerationQueueAsync()
    {
        var list = _context.CommunityPosts
            .Where(p => p.ModerationStatus == PostStatus.Flagged || p.HasKeywordsAlert || p.IsExtremeCrisis)
            .OrderByDescending(p => p.RiskScore).ThenByDescending(p => p.CreatedAt)
            .Select(p => new PostDto(
                p.Id,
                p.AnonymousPseudonym,
                p.StudentRoleTag,
                p.Content,
                p.CategoryTag,
                p.StressLevelTag,
                p.HugCount,
                p.EmpathyCount,
                p.CommentCount,
                p.CreatedAt,
                p.HasKeywordsAlert,
                p.DetectedKeywords,
                p.RiskScore,
                p.IsExtremeCrisis,
                p.IsSensitiveHiddenFromStudents,
                p.ModerationStatus.ToString(),
                new List<CommentDto>(),
                null
            )).ToList();

        return Task.FromResult(Result<List<PostDto>>.Ok(list));
    }

    public async Task<Result> ModeratePostAsync(Guid postId, ModeratePostRequest request, Guid adminUserId)
    {
        var post = _context.CommunityPosts.FirstOrDefault(p => p.Id == postId);
        if (post == null) return Result.Fail("Không tìm thấy bài viết", "NOT_FOUND");

        switch (request.Action.ToLower())
        {
            case "approve":
                post.ModerationStatus = PostStatus.Approved;
                post.IsSensitiveHiddenFromStudents = false;
                break;
            case "hide":
                post.ModerationStatus = PostStatus.Hidden;
                post.IsSensitiveHiddenFromStudents = true;
                break;
            case "reject":
                post.ModerationStatus = PostStatus.Rejected;
                post.IsSensitiveHiddenFromStudents = true;
                break;
            case "sos_intervene":
                post.ModerationStatus = PostStatus.Flagged;
                post.IsSensitiveHiddenFromStudents = true;
                // Tạo cảnh báo can thiệp khẩn
                _context.NlpRiskAlerts.Add(new NlpRiskAlert
                {
                    Id = Guid.NewGuid(),
                    PostId = post.Id,
                    StudentAnonymousCode = post.AnonymousPseudonym,
                    SnippetContent = post.Content,
                    TriggeredKeywords = "Admin kích hoạt can thiệp SOS",
                    RiskScore = 99,
                    TriageLevel = TriageLevel.Urgent,
                    Status = "InIntervention",
                    InterventionAction = "Admin đã điều phối đội chuyên viên SOS khẩn cấp"
                });
                break;
        }

        post.ModeratedBy = adminUserId;
        await _context.SaveChangesAsync();
        return Result.Ok("Đã cập nhật trạng thái kiểm duyệt");
    }

    public Task<Result<List<UserDto>>> GetAllUsersAsync()
    {
        var list = _context.Users
            .OrderBy(u => u.Role).ThenBy(u => u.FullName)
            .Select(u => new UserDto(u.Id, u.MSSV, u.FullName, u.Email, u.Role.ToString(), u.Faculty, u.AnonymousCode, u.AvatarUrl))
            .ToList();

        return Task.FromResult(Result<List<UserDto>>.Ok(list));
    }

    public async Task<Result> ToggleUserStatusAsync(Guid userId)
    {
        var user = _context.Users.FirstOrDefault(u => u.Id == userId);
        if (user == null) return Result.Fail("Không tìm thấy người dùng", "NOT_FOUND");

        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();
        return Result.Ok(user.IsActive ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
    }

    public Task<Result<List<SensitiveKeywordDto>>> GetSensitiveKeywordsAsync()
    {
        var list = _context.SensitiveKeywords
            .OrderByDescending(k => k.RiskWeight)
            .Select(k => new SensitiveKeywordDto(k.Id, k.Keyword, k.Category, k.RiskWeight, k.AddedByRole, k.IsActive, k.CreatedAt))
            .ToList();

        return Task.FromResult(Result<List<SensitiveKeywordDto>>.Ok(list));
    }

    public async Task<Result<SensitiveKeywordDto>> AddSensitiveKeywordAsync(AddSensitiveKeywordRequest request)
    {
        var keyword = request.Keyword.Trim().ToLowerInvariant();
        if (_context.SensitiveKeywords.Any(k => k.Keyword.ToLower() == keyword))
        {
            return Result<SensitiveKeywordDto>.Fail("Từ khóa này đã tồn tại", "KEYWORD_EXISTS");
        }

        var item = new SensitiveKeyword
        {
            Id = Guid.NewGuid(),
            Keyword = keyword,
            Category = request.Category,
            RiskWeight = Math.Clamp(request.RiskWeight, 1, 100),
            AddedByRole = "Admin",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.SensitiveKeywords.Add(item);
        await _context.SaveChangesAsync();
        return Result<SensitiveKeywordDto>.Ok(new SensitiveKeywordDto(item.Id, item.Keyword, item.Category, item.RiskWeight, item.AddedByRole, item.IsActive, item.CreatedAt), "Đã thêm từ khóa mới vào bộ lọc tự động");
    }

    public async Task<Result> DeleteSensitiveKeywordAsync(Guid keywordId)
    {
        var item = _context.SensitiveKeywords.FirstOrDefault(k => k.Id == keywordId);
        if (item == null) return Result.Fail("Không tìm thấy từ khóa", "NOT_FOUND");

        _context.SensitiveKeywords.Remove(item);
        await _context.SaveChangesAsync();
        return Result.Ok("Đã xóa từ khóa khỏi danh sách");
    }
}
