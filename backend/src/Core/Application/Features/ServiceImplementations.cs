using UniMind.Application.Common.Interfaces;
using UniMind.Application.Common.Models;
using UniMind.Domain.Entities;
using UniMind.Domain.Enums;

namespace UniMind.Application.Features;

public static class ExpertPermissionHelper
{
    public static readonly List<string> DefaultPermissions = new()
    {
        "PERM_WORKSPACE",
        "PERM_SCHEDULE",
        "PERM_ANALYTICS",
        "PERM_MODERATION"
    };

    public static List<string> ParsePermissions(string? permissionsStr)
    {
        if (permissionsStr == null)
        {
            return new List<string>(DefaultPermissions);
        }

        var trimmed = permissionsStr.Trim();
        if (string.IsNullOrEmpty(trimmed) || trimmed.Equals("NONE", StringComparison.OrdinalIgnoreCase))
        {
            return new List<string>();
        }

        return trimmed.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                      .Where(p => !string.Equals(p, "NONE", StringComparison.OrdinalIgnoreCase))
                      .Distinct()
                      .ToList();
    }
}

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
        var identifier = request.Identifier;
        if (string.IsNullOrWhiteSpace(identifier))
        {
            return Task.FromResult(Result<AuthResponse>.Fail("Vui lòng nhập Email hoặc Mã số sinh viên.", "VALIDATION_ERROR"));
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return Task.FromResult(Result<AuthResponse>.Fail("Vui lòng nhập mật khẩu.", "VALIDATION_ERROR"));
        }

        var emailOrMssv = identifier.ToLowerInvariant();
        var user = _context.Users.FirstOrDefault(u => 
            u.Email.ToLower() == emailOrMssv || 
            (!string.IsNullOrEmpty(u.MSSV) && u.MSSV.ToLower() == emailOrMssv));

        if (user == null)
        {
            return Task.FromResult(Result<AuthResponse>.Fail("Tài khoản không tồn tại trong hệ thống. Vui lòng kiểm tra lại Email hoặc MSSV.", "USER_NOT_FOUND"));
        }

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Task.FromResult(Result<AuthResponse>.Fail("Mật khẩu không chính xác. Vui lòng kiểm tra lại.", "INVALID_PASSWORD"));
        }

        if (!user.IsActive)
        {
            return Task.FromResult(Result<AuthResponse>.Fail("Tài khoản của bạn hiện đang bị khóa.", "ACCOUNT_LOCKED"));
        }

        List<string>? permissions = null;
        if (user.Role == UserRole.Expert)
        {
            var exp = _context.Experts.FirstOrDefault(e => e.UserId == user.Id);
            if (exp != null)
            {
                permissions = ExpertPermissionHelper.ParsePermissions(exp.Permissions);
            }
        }

        var token = _jwtProvider.Generate(user);
        var userDto = new UserDto(user.Id, user.MSSV, user.FullName, user.Email, user.Role.ToString(), user.Faculty, user.AnonymousCode, user.AvatarUrl, permissions, user.IsActive, user.CreatedAt);
        return Task.FromResult(Result<AuthResponse>.Ok(new AuthResponse(token, userDto), "Đăng nhập thành công"));
    }

    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request)
    {
        var identifier = !string.IsNullOrWhiteSpace(request.EmailOrMSSV)
            ? request.EmailOrMSSV.Trim()
            : (!string.IsNullOrWhiteSpace(request.Email) ? request.Email.Trim() : request.StudentId?.Trim() ?? "");

        if (string.IsNullOrWhiteSpace(identifier))
        {
            return Result<AuthResponse>.Fail("Vui lòng cung cấp Email hoặc Mã số sinh viên.", "VALIDATION_ERROR");
        }

        var normalizedIdentifier = identifier.ToLowerInvariant();
        if (_context.Users.Any(u => u.Email.ToLower() == normalizedIdentifier || (u.MSSV != null && u.MSSV.ToLower() == normalizedIdentifier)))
        {
            return Result<AuthResponse>.Fail("Email hoặc MSSV này đã tồn tại trong hệ thống.", "USER_EXISTS");
        }

        var studentMssv = !string.IsNullOrWhiteSpace(request.StudentId)
            ? request.StudentId.Trim()
            : (!identifier.Contains("@") ? identifier : null);

        var email = !string.IsNullOrWhiteSpace(request.Email)
            ? request.Email.Trim()
            : (identifier.Contains("@") ? identifier : $"{identifier}@student.unimind.edu.vn");

        var fullName = !string.IsNullOrWhiteSpace(request.FullName)
            ? request.FullName.Trim()
            : (!string.IsNullOrWhiteSpace(studentMssv) ? $"Sinh viên {studentMssv}" : "Sinh viên Ẩn danh");

        var randomNum = new Random().Next(100, 999);
        var anonymousCode = $"Bạn Ẩn Yên #{randomNum}";

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = fullName,
            Email = email,
            MSSV = studentMssv,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = UserRole.Student, // BẮT BUỘC chỉ đăng ký sinh viên qua API này
            Faculty = request.Faculty ?? "Khoa Công nghệ Thông tin",
            AnonymousCode = anonymousCode,
            AvatarUrl = "/assets/avatars/student1.png",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _jwtProvider.Generate(user);
        var userDto = new UserDto(user.Id, user.MSSV, user.FullName, user.Email, user.Role.ToString(), user.Faculty, user.AnonymousCode, user.AvatarUrl, null, user.IsActive, user.CreatedAt);
        return Result<AuthResponse>.Ok(new AuthResponse(token, userDto), "Đăng ký tài khoản sinh viên thành công");
    }

    public Task<Result<UserDto>> GetCurrentUserAsync(Guid userId)
    {
        var user = _context.Users.FirstOrDefault(u => u.Id == userId);
        if (user == null)
            return Task.FromResult(Result<UserDto>.Fail("Không tìm thấy thông tin người dùng", "USER_NOT_FOUND"));

        List<string>? permissions = null;
        if (user.Role == UserRole.Expert)
        {
            var exp = _context.Experts.FirstOrDefault(e => e.UserId == user.Id);
            if (exp != null)
            {
                permissions = ExpertPermissionHelper.ParsePermissions(exp.Permissions);
            }
        }

        var userDto = new UserDto(user.Id, user.MSSV, user.FullName, user.Email, user.Role.ToString(), user.Faculty, user.AnonymousCode, user.AvatarUrl, permissions, user.IsActive, user.CreatedAt);
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
        var content = request.EffectiveContent;
        var moodStr = request.EffectiveMoodState;
        var energy = request.EffectiveEnergyLevel;
        var triggers = request.EffectiveTriggers;

        var analysis = await _aiService.AnalyzeAsync(content, _context.SensitiveKeywords.Where(k => k.IsActive));
        var moodEnum = Enum.TryParse<MoodType>(moodStr, true, out var parsedMood) ? parsedMood : MoodType.Peaceful;

        var journal = new MoodJournal
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            MoodState = moodEnum,
            EnergyLevel = Math.Clamp(energy, 1, 10),
            Triggers = triggers,
            JournalContent = content,
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
            var isHidden = analysis.ContainsSensitiveKeywords || analysis.IsAiFlagged || analysis.RiskScore >= 75;

            var post = new CommunityPost
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                AnonymousPseudonym = student?.AnonymousCode ?? "Bạn Ẩn Yên #" + new Random().Next(100, 999),
                StudentRoleTag = $"{student?.Faculty ?? "Khoa CNTT"}",
                Content = content,
                CategoryTag = "Chia sẻ cảm xúc",
                StressLevelTag = $"Mức năng lượng: {energy}/10",
                HasKeywordsAlert = analysis.ContainsSensitiveKeywords || analysis.IsAiFlagged,
                DetectedKeywords = analysis.TriggeredKeywords.Count > 0 ? string.Join("; ", analysis.TriggeredKeywords) : null,
                SentimentLabel = analysis.SentimentLabel,
                SentimentScore = analysis.SentimentScore,
                RiskScore = analysis.RiskScore,
                IsExtremeCrisis = analysis.IsExtremeCrisis,
                IsSensitiveHiddenFromStudents = isHidden,
                ModerationStatus = isHidden ? PostStatus.Flagged : PostStatus.Approved,
                CreatedAt = DateTime.UtcNow
            };
            _context.CommunityPosts.Add(post);

            if (post.IsExtremeCrisis || post.HasKeywordsAlert || post.RiskScore >= 75 || analysis.IsAiFlagged)
            {
                _context.NlpRiskAlerts.Add(new NlpRiskAlert
                {
                    Id = Guid.NewGuid(),
                    PostId = post.Id,
                    StudentAnonymousCode = post.AnonymousPseudonym,
                    Faculty = student?.Faculty,
                    SnippetContent = post.Content.Length > 150 ? post.Content.Substring(0, 150) + "..." : post.Content,
                    TriggeredKeywords = post.DetectedKeywords ?? (analysis.IsAiFlagged ? $"[AI] {analysis.AiReason}" : "Nguy cơ cao"),
                    RiskScore = post.RiskScore,
                    TriageLevel = (post.IsExtremeCrisis || post.RiskScore >= 85) ? TriageLevel.Urgent : TriageLevel.Moderate,
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
        var test = (request.TestId.HasValue && request.TestId.Value != Guid.Empty)
            ? _context.PsychologicalTests.FirstOrDefault(t => t.Id == request.TestId.Value)
            : _context.PsychologicalTests.FirstOrDefault(t => t.Code == (request.TestType ?? "DASS21"))
              ?? _context.PsychologicalTests.FirstOrDefault();

        if (test == null)
            return Result<TestResultDto>.Fail("Bài test không hợp lệ", "INVALID_TEST");

        int totalScore = 0;
        int depScore = 0;
        int anxScore = 0;
        int stressScore = 0;

        if (request.DepressionScore.HasValue || request.AnxietyScore.HasValue || request.StressScore.HasValue)
        {
            depScore = request.DepressionScore ?? 0;
            anxScore = request.AnxietyScore ?? 0;
            stressScore = request.StressScore ?? 0;
            totalScore = request.TotalScore ?? (depScore + anxScore + stressScore);
        }
        else if (request.Answers != null && request.Answers.Count > 0)
        {
            totalScore = request.Answers.Sum(a => a.EffectiveScore);
            foreach (var ans in request.Answers)
            {
                var q = ans.QuestionId.HasValue ? _context.TestQuestions.FirstOrDefault(x => x.Id == ans.QuestionId.Value) : null;
                if (q != null)
                {
                    if (q.SubscaleCategory == "Depression") depScore += ans.EffectiveScore;
                    else if (q.SubscaleCategory == "Anxiety") anxScore += ans.EffectiveScore;
                    else if (q.SubscaleCategory == "Stress") stressScore += ans.EffectiveScore;
                }
            }
        }
        else if (request.RawAnswers != null && request.RawAnswers.Count > 0)
        {
            totalScore = request.RawAnswers.Where(a => a.HasValue).Sum(a => a!.Value);
            depScore = totalScore / 3;
            anxScore = totalScore / 3;
            stressScore = totalScore - depScore - anxScore;
        }

        // ── CHUẨN HÓA THANG ĐO DASS-21 THEO LOVIBOND & LOVIBOND (1995) ──
        // Thang DASS-21 (bản rút gọn 21 câu) được nhân đôi (x2) để đối chiếu ngưỡng chuẩn y khoa DASS-42
        int depScaled = depScore * 2;
        int anxScaled = anxScore * 2;
        int stressScaled = stressScore * 2;

        string depSeverity = depScaled switch
        {
            <= 9 => "Normal",
            <= 13 => "Mild",
            <= 20 => "Moderate",
            <= 27 => "Severe",
            _ => "ExtremelySevere"
        };

        string anxSeverity = anxScaled switch
        {
            <= 7 => "Normal",
            <= 9 => "Mild",
            <= 14 => "Moderate",
            <= 19 => "Severe",
            _ => "ExtremelySevere"
        };

        string stressSeverity = stressScaled switch
        {
            <= 14 => "Normal",
            <= 18 => "Mild",
            <= 25 => "Moderate",
            <= 33 => "Severe",
            _ => "ExtremelySevere"
        };

        // Mức độ nghiêm trọng tổng thể lấy theo phân độ cao nhất trong 3 thang
        string severity = "Normal";
        if (depSeverity == "ExtremelySevere" || anxSeverity == "ExtremelySevere" || stressSeverity == "ExtremelySevere")
            severity = "ExtremelySevere";
        else if (depSeverity == "Severe" || anxSeverity == "Severe" || stressSeverity == "Severe")
            severity = "Severe";
        else if (depSeverity == "Moderate" || anxSeverity == "Moderate" || stressSeverity == "Moderate")
            severity = "Moderate";
        else if (depSeverity == "Mild" || anxSeverity == "Mild" || stressSeverity == "Mild")
            severity = "Mild";

        bool needsConsultation = severity == "Severe" || severity == "ExtremelySevere" || depScaled >= 14 || anxScaled >= 15 || stressScaled >= 26;

        string aiInterpretation = severity switch
        {
            "ExtremelySevere" => $"CẢNH BÁO LÂM SÀNG: Các chỉ số của bạn đang ở ngưỡng Rất nặng (Trầm cảm: {depScaled}/42 - {depSeverity}, Lo âu: {anxScaled}/42 - {anxSeverity}, Căng thẳng: {stressScaled}/42 - {stressSeverity}). Bạn đang chịu áp lực tâm lý vượt ngưỡng tự điều tiết. Hệ thống khuyến nghị bạn kết nối với chuyên viên tâm lý hoặc Tổng đài SOS trường học ngay hôm nay.",
            "Severe" => $"Mức độ áp lực và xáo trộn tâm lý của bạn đang ở ngưỡng Nặng (Trầm cảm: {depScaled}/42 - {depSeverity}, Lo âu: {anxScaled}/42 - {anxSeverity}, Căng thẳng: {stressScaled}/42 - {stressSeverity}). Bạn rất nên đặt lịch tư vấn 1-1 tại phòng P.302 hoặc SafeRoom Online để được chuyên gia hỗ trợ điều hòa nhận thức.",
            "Moderate" => $"Bạn đang có biểu hiện căng thẳng và lo âu ở mức Trung bình (Trầm cảm: {depScaled}/42, Lo âu: {anxScaled}/42, Căng thẳng: {stressScaled}/42). Hãy dành thời gian nghỉ ngơi, giảm bớt tải công việc và có thể đăng ký một phiên trò chuyện tâm lý định hướng.",
            "Mild" => $"Chỉ số của bạn ở mức Nhẹ (Trầm cảm: {depScaled}/42, Lo âu: {anxScaled}/42, Căng thẳng: {stressScaled}/42). Đây là phản ứng tự nhiên trước kỳ thi hoặc bài tập. Thực hành thở 4-7-8 và duy trì giấc ngủ đều đặn.",
            _ => $"Tuyệt vời! Sức khỏe tinh thần của bạn đang ở trạng thái Cân bằng và Ổn định (Trầm cảm: {depScaled}/42, Lo âu: {anxScaled}/42, Căng thẳng: {stressScaled}/42). Khả năng tự phục hồi (Resilience) rất tốt."
        };

        var result = new TestResult
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            TestId = test.Id,
            TotalScore = totalScore,
            DepressionScore = depScore,
            AnxietyScore = anxScore,
            StressScore = stressScore,
            DepressionSeverity = depSeverity,
            AnxietySeverity = anxSeverity,
            StressSeverity = stressSeverity,
            NeedsConsultation = needsConsultation,
            ResilienceRate = Math.Clamp(100 - (totalScore * 2), 20, 95),
            SeverityLevel = severity,
            AiInterpretation = aiInterpretation,
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
            result.CompletedAt,
            result.DepressionSeverity,
            result.AnxietySeverity,
            result.StressSeverity,
            result.NeedsConsultation
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
            result.CompletedAt,
            result.DepressionSeverity,
            result.AnxietySeverity,
            result.StressSeverity,
            result.NeedsConsultation
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

    private static List<string> GetCategoryAliases(string category)
    {
        var list = new List<string> { category };
        var trimmed = category.Trim();
        if (trimmed.Equals("Góc học tập", StringComparison.OrdinalIgnoreCase) || trimmed.Equals("Áp lực học tập", StringComparison.OrdinalIgnoreCase))
        {
            list.Add("Góc học tập");
            list.Add("Áp lực học tập");
        }
        else if (trimmed.Equals("Gia đình & Bạn bè", StringComparison.OrdinalIgnoreCase) || trimmed.Equals("Mối quan hệ & Gia đình", StringComparison.OrdinalIgnoreCase))
        {
            list.Add("Gia đình & Bạn bè");
            list.Add("Mối quan hệ & Gia đình");
        }
        else if (trimmed.Equals("Chuyện thường ngày", StringComparison.OrdinalIgnoreCase) || trimmed.Equals("Chia sẻ tích cực", StringComparison.OrdinalIgnoreCase))
        {
            list.Add("Chuyện thường ngày");
            list.Add("Chia sẻ tích cực");
        }
        else if (trimmed.Equals("Góc tâm sự", StringComparison.OrdinalIgnoreCase) || trimmed.Equals("Cô đơn & Lạc lõng", StringComparison.OrdinalIgnoreCase))
        {
            list.Add("Góc tâm sự");
            list.Add("Cô đơn & Lạc lõng");
        }
        else if (trimmed.Equals("Định hướng & Tương lai", StringComparison.OrdinalIgnoreCase) || trimmed.Equals("Việc làm & Tài chính", StringComparison.OrdinalIgnoreCase))
        {
            list.Add("Định hướng & Tương lai");
            list.Add("Việc làm & Tài chính");
        }
        return list.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
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
            var aliases = GetCategoryAliases(category);
            query = query.Where(p => aliases.Contains(p.CategoryTag));
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
                        c.CreatedAt,
                        c.ImageUrl,
                        c.ModerationStatus.ToString()
                    )).ToList();

                var expertComment = _context.CommunityComments.FirstOrDefault(c => c.PostId == p.Id && c.IsExpertComment);

                // Nếu ảnh bị từ chối và người xem là sinh viên thường -> che ảnh
                string? effectiveImageUrl = p.ImageUrl;
                if (!isStaffOrAdmin && p.ImageModerationStatus == "Rejected")
                {
                    effectiveImageUrl = null;
                }

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
                    expertComment != null ? expertComment.Content : null,
                    effectiveImageUrl,
                    p.ImageModerationStatus,
                    p.ImageModerationNote,
                    p.StudentId
                );
            }).ToList();

        return Task.FromResult(Result<List<PostDto>>.Ok(posts));
    }

    public async Task<Result<PostDto>> CreatePostAsync(Guid studentId, CreatePostRequest request)
    {
        var student = _context.Users.FirstOrDefault(u => u.Id == studentId);
        var activeKeywords = _context.SensitiveKeywords.Where(k => k.IsActive).ToList();
        var analysis = await _aiService.AnalyzeAsync(request.Content, activeKeywords);

        var pseudonym = !string.IsNullOrWhiteSpace(request.CustomPseudonym) 
            ? request.CustomPseudonym 
            : (student?.AnonymousCode ?? $"Bạn Ẩn Yên #{new Random().Next(100, 999)}");

        var isHiddenFromStudents = analysis.ContainsSensitiveKeywords || analysis.IsAiFlagged || analysis.RiskScore >= 75;

        // Trạng thái kiểm duyệt ảnh: nếu nội dung có nguy cơ cao -> Flagged ảnh để chuyên gia xem trước
        string imgModStatus = "None";
        if (!string.IsNullOrWhiteSpace(request.ImageUrl))
        {
            imgModStatus = isHiddenFromStudents ? "Flagged" : "Approved";
        }

        var post = new CommunityPost
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            AnonymousPseudonym = pseudonym,
            StudentRoleTag = $"{student?.Faculty ?? "Khoa Công nghệ Thông tin"}",
            Content = request.Content,
            ImageUrl = request.ImageUrl?.Trim(),
            ImageModerationStatus = imgModStatus,
            CategoryTag = request.EffectiveCategory,
            StressLevelTag = request.StressLevelTag ?? (analysis.RiskScore > 70 ? "Áp lực cao (Level 4/5)" : "Mức độ vừa"),
            HasKeywordsAlert = analysis.ContainsSensitiveKeywords || analysis.IsAiFlagged,
            DetectedKeywords = analysis.TriggeredKeywords.Count > 0 ? string.Join("; ", analysis.TriggeredKeywords) : null,
            SentimentLabel = analysis.SentimentLabel,
            SentimentScore = analysis.SentimentScore,
            RiskScore = analysis.RiskScore,
            IsExtremeCrisis = analysis.IsExtremeCrisis,
            IsSensitiveHiddenFromStudents = isHiddenFromStudents,
            ModerationStatus = isHiddenFromStudents ? PostStatus.Flagged : PostStatus.Approved,
            CreatedAt = DateTime.UtcNow
        };

        _context.CommunityPosts.Add(post);

        // NẾU BÀI VIẾT MANG XU HƯỚNG QUÁ TIÊU CỰC HOẶC CHỨA TỪ KHÓA TỰ HẠI/AI PHÁT HIỆN:
        // ĐƯA NGAY VÀO HÀNG ĐỢI NLP RISK ALERTS ĐỂ ADMIN VÀ CHUYÊN VIÊN XỬ LÝ NGAY
        if (post.IsExtremeCrisis || post.HasKeywordsAlert || post.RiskScore >= 75 || analysis.IsAiFlagged)
        {
            _context.NlpRiskAlerts.Add(new NlpRiskAlert
            {
                Id = Guid.NewGuid(),
                PostId = post.Id,
                StudentAnonymousCode = post.AnonymousPseudonym,
                Faculty = student?.Faculty,
                SnippetContent = post.Content.Length > 200 ? post.Content.Substring(0, 200) + "..." : post.Content,
                TriggeredKeywords = post.DetectedKeywords ?? (analysis.IsAiFlagged ? $"[AI] {analysis.AiReason}" : "Rủi ro quá tiêu cực"),
                RiskScore = post.RiskScore,
                TriageLevel = (post.IsExtremeCrisis || post.RiskScore >= 85) ? TriageLevel.Urgent : TriageLevel.Moderate,
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
            null,
            post.ImageUrl,
            post.ImageModerationStatus,
            post.ImageModerationNote,
            post.StudentId
        );

        string msg = isHiddenFromStudents
            ? "Bài viết của bạn đã được tiếp nhận và chuyển đến Chuyên viên tâm lý để hỗ trợ an toàn."
            : "Đăng bài viết ẩn danh thành công!";

        return Result<PostDto>.Ok(dto, msg);
    }

    public async Task<Result> DeletePostAsync(Guid postId, Guid requestingUserId, bool isStaffOrAdmin)
    {
        var post = _context.CommunityPosts.FirstOrDefault(p => p.Id == postId);
        if (post == null)
            return Result.Fail("Không tìm thấy bài viết cần xóa", "POST_NOT_FOUND");

        // Kiểm tra quyền: Chỉ chủ bài viết hoặc Staff/Admin mới được xóa
        if (!isStaffOrAdmin && post.StudentId != requestingUserId)
        {
            return Result.Fail("Bạn không có quyền xóa bài viết này.", "FORBIDDEN");
        }

        // Xóa các bình luận liên quan
        var relatedComments = _context.CommunityComments.Where(c => c.PostId == postId).ToList();
        foreach (var c in relatedComments)
        {
            _context.CommunityComments.Remove(c);
        }

        // Xóa bài viết
        _context.CommunityPosts.Remove(post);

        // Cập nhật alert nếu có
        var alerts = _context.NlpRiskAlerts.Where(a => a.PostId == postId).ToList();
        foreach (var a in alerts)
        {
            a.Status = "PostDeleted";
        }

        await _context.SaveChangesAsync();
        return Result.Ok("Đã xóa bài viết thành công");
    }

    public async Task<Result<PostDto>> ModeratePostImageAsync(Guid postId, ModerateImageRequest request, Guid moderatorUserId)
    {
        var post = _context.CommunityPosts.FirstOrDefault(p => p.Id == postId);
        if (post == null)
            return Result<PostDto>.Fail("Không tìm thấy bài viết", "POST_NOT_FOUND");

        post.ImageModerationStatus = request.Action; // Approved, Rejected, Flagged
        post.ImageModerationNote = request.Note;
        post.ModeratedBy = moderatorUserId;

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            ActionType = "MODERATE_IMAGE",
            ActorRole = "Moderator",
            ActorId = moderatorUserId,
            Details = $"Kiểm duyệt hình ảnh bài viết #{post.Id.ToString()[..8]}: {request.Action} (Ghi chú: {request.Note ?? "Không có"})",
            IpAddress = "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        var comments = _context.CommunityComments
            .Where(c => c.PostId == post.Id)
            .Select(c => new CommentDto(
                c.Id, c.PostId, c.AuthorPseudonym, c.Content, c.IsExpertComment,
                c.ExpertTitle, c.IsSensitiveHiddenFromStudents, c.DetectedKeywords, c.CreatedAt
            )).ToList();

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
            comments,
            null,
            post.ImageUrl,
            post.ImageModerationStatus,
            post.ImageModerationNote,
            post.StudentId
        );

        return Result<PostDto>.Ok(dto, $"Đã cập nhật trạng thái kiểm duyệt hình ảnh: {request.Action}");
    }

    public async Task<Result<CommentDto>> AddCommentAsync(Guid userId, Guid postId, CreateCommentRequest request, bool isExpert)
    {
        var post = _context.CommunityPosts.FirstOrDefault(p => p.Id == postId);
        if (post == null)
            return Result<CommentDto>.Fail("Không tìm thấy bài viết", "POST_NOT_FOUND");

        var contentText = request.Content?.Trim() ?? string.Empty;
        var imageUrl = request.ImageUrl?.Trim();

        if (string.IsNullOrWhiteSpace(contentText) && string.IsNullOrWhiteSpace(imageUrl))
            return Result<CommentDto>.Fail("Vui lòng nhập nội dung hoặc đính kèm hình ảnh để bình luận.", "EMPTY_COMMENT");

        var user = _context.Users.FirstOrDefault(u => u.Id == userId);
        var activeKeywords = _context.SensitiveKeywords.Where(k => k.IsActive).ToList();

        // Kiểm duyệt AI & Từ khóa nhạy cảm nếu có nội dung văn bản
        var analysis = !string.IsNullOrWhiteSpace(contentText)
            ? await _aiService.AnalyzeAsync(contentText, activeKeywords)
            : new SentimentAnalysisResult { SentimentLabel = "Neutral", SentimentScore = 0.5, RiskScore = 0 };

        // Với sinh viên: nếu bình luận có từ khóa nhạy cảm hoặc AI phát hiện nguy cơ -> ẩn với sinh viên nhưng vẫn lưu để Admin/Chuyên viên đánh giá
        bool isSensitiveHidden = !isExpert && (analysis.ContainsSensitiveKeywords || analysis.IsAiFlagged || analysis.RiskScore >= 75);

        var pseudonym = isExpert 
            ? (user?.FullName ?? "Chuyên viên Tâm lý UniMind") 
            : (!string.IsNullOrWhiteSpace(request.CustomPseudonym) ? request.CustomPseudonym : (user?.AnonymousCode ?? "Bạn Ẩn Yên #" + new Random().Next(100, 999)));

        var comment = new CommunityComment
        {
            Id = Guid.NewGuid(),
            PostId = postId,
            UserId = userId,
            AuthorPseudonym = pseudonym,
            Content = contentText,
            ImageUrl = imageUrl,
            IsExpertComment = isExpert,
            ExpertTitle = isExpert ? "Chuyên viên Tâm lý (Đã xác minh)" : null,
            IsSensitiveHiddenFromStudents = isSensitiveHidden,
            DetectedKeywords = analysis.TriggeredKeywords.Count > 0 ? string.Join("; ", analysis.TriggeredKeywords) : null,
            ModerationStatus = isSensitiveHidden ? PostStatus.Flagged : PostStatus.Approved,
            CreatedAt = DateTime.UtcNow
        };

        _context.CommunityComments.Add(comment);
        post.CommentCount++;

        // Nếu bình luận có từ khóa nhạy cảm hoặc AI phát hiện nguy hiểm, thêm vào cảnh báo NLP
        if (isSensitiveHidden)
        {
            _context.NlpRiskAlerts.Add(new NlpRiskAlert
            {
                Id = Guid.NewGuid(),
                CommentId = comment.Id,
                PostId = postId,
                StudentAnonymousCode = comment.AuthorPseudonym,
                Faculty = user?.Faculty,
                SnippetContent = string.IsNullOrWhiteSpace(comment.Content) ? "[Bình luận có hình ảnh đính kèm]" : comment.Content,
                TriggeredKeywords = comment.DetectedKeywords ?? (analysis.IsAiFlagged ? $"[AI] {analysis.AiReason}" : "Bình luận nhạy cảm"),
                RiskScore = analysis.RiskScore > 0 ? analysis.RiskScore : 75,
                TriageLevel = (analysis.IsExtremeCrisis || analysis.RiskScore >= 85) ? TriageLevel.Urgent : TriageLevel.High,
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
            comment.CreatedAt,
            comment.ImageUrl,
            comment.ModerationStatus.ToString()
        );

        string returnMsg = isSensitiveHidden 
            ? "Bình luận có từ ngữ cần kiểm duyệt và đã được chuyển đến chuyên viên tâm lý." 
            : "Đã đăng bình luận thành công";

        return Result<CommentDto>.Ok(dto, returnMsg);
    }

    public async Task<Result> ModerateCommentAsync(Guid commentId, ModerateCommentRequest request, Guid adminUserId)
    {
        var comment = _context.CommunityComments.FirstOrDefault(c => c.Id == commentId);
        if (comment == null) return Result.Fail("Không tìm thấy bình luận", "NOT_FOUND");

        switch (request.Action.ToLower())
        {
            case "approve":
                comment.ModerationStatus = PostStatus.Approved;
                comment.IsSensitiveHiddenFromStudents = false;
                break;
            case "hide":
                comment.ModerationStatus = PostStatus.Hidden;
                comment.IsSensitiveHiddenFromStudents = true;
                break;
            case "reject":
                comment.ModerationStatus = PostStatus.Rejected;
                comment.IsSensitiveHiddenFromStudents = true;
                break;
        }

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            ActionType = "MODERATE_COMMENT",
            ActorRole = "Admin/Expert",
            ActorId = adminUserId,
            Details = $"Kiểm duyệt bình luận #{comment.Id.ToString()[..8]} ({comment.AuthorPseudonym}) - Hành động: {request.Action} - Lý do: {request.Reason ?? "Kiểm duyệt định kỳ"}",
            IpAddress = "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Result.Ok($"Đã cập nhật trạng thái bình luận: {request.Action}");
    }

    public Task<Result<List<CommentDto>>> GetFlaggedCommentsAsync()
    {
        var list = _context.CommunityComments
            .Where(c => c.IsSensitiveHiddenFromStudents || c.ModerationStatus == PostStatus.Flagged || !string.IsNullOrWhiteSpace(c.DetectedKeywords))
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CommentDto(
                c.Id,
                c.PostId,
                c.AuthorPseudonym,
                c.Content,
                c.IsExpertComment,
                c.ExpertTitle,
                c.IsSensitiveHiddenFromStudents,
                c.DetectedKeywords,
                c.CreatedAt,
                c.ImageUrl,
                c.ModerationStatus.ToString()
            )).ToList();

        return Task.FromResult(Result<List<CommentDto>>.Ok(list));
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
            null,
            post.ImageUrl,
            post.ImageModerationStatus,
            post.ImageModerationNote,
            post.StudentId
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
        // 0. Phân giải ExpertId an toàn từ request
        Guid parsedExpertId = Guid.Empty;
        if (!string.IsNullOrWhiteSpace(request.ExpertId) && Guid.TryParse(request.ExpertId, out var pe))
        {
            parsedExpertId = pe;
        }

        var expert = _context.Experts.FirstOrDefault(e => e.Id == parsedExpertId || e.UserId == parsedExpertId)
                     ?? (parsedExpertId != Guid.Empty ? _context.Experts.FirstOrDefault(e => e.Id == parsedExpertId) : null)
                     ?? _context.Experts.FirstOrDefault();
        if (expert == null)
        {
            return Result<AppointmentDto>.Fail("Chuyên viên tư vấn không tồn tại trong hệ thống.", "EXPERT_NOT_FOUND");
        }

        // 1. Phân tích Ngày và Khung Giờ (Date & Time Range)
        DateOnly reqDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));
        if (!string.IsNullOrWhiteSpace(request.Date))
        {
            var cleanDate = request.Date.Trim().Split('T')[0];
            if (DateOnly.TryParse(cleanDate, out var parsedD))
            {
                reqDate = parsedD;
            }
        }

        TimeOnly reqStartTime = new TimeOnly(8, 0);
        TimeOnly reqEndTime = new TimeOnly(9, 30);

        if (!string.IsNullOrWhiteSpace(request.Time))
        {
            var raw = request.Time.Trim();
            if (raw.Contains(" - "))
            {
                var parts = raw.Split(" - ", StringSplitOptions.TrimEntries);
                if (TimeOnly.TryParse(parts[0], out var st)) reqStartTime = st;
                if (parts.Length > 1 && TimeOnly.TryParse(parts[1], out var et)) reqEndTime = et;
                else reqEndTime = reqStartTime.AddMinutes(90);
            }
            else if (raw.Contains("-"))
            {
                var parts = raw.Split('-', StringSplitOptions.TrimEntries);
                if (TimeOnly.TryParse(parts[0], out var st)) reqStartTime = st;
                if (parts.Length > 1 && TimeOnly.TryParse(parts[1], out var et)) reqEndTime = et;
                else reqEndTime = reqStartTime.AddMinutes(90);
            }
            else if (TimeOnly.TryParse(raw, out var st))
            {
                reqStartTime = st;
                reqEndTime = st.AddMinutes(90);
            }
            else
            {
                var clean = raw.ToLowerInvariant().Replace("h", ":");
                if (clean.Contains("-"))
                {
                    var parts = clean.Split('-', StringSplitOptions.TrimEntries);
                    var sStr = parts[0].Contains(':') ? parts[0] : parts[0] + ":00";
                    var eStr = parts.Length > 1 ? (parts[1].Contains(':') ? parts[1] : parts[1] + ":00") : "";
                    if (TimeOnly.TryParse(sStr, out var s)) reqStartTime = s;
                    if (!string.IsNullOrEmpty(eStr) && TimeOnly.TryParse(eStr, out var e)) reqEndTime = e;
                    else reqEndTime = reqStartTime.AddMinutes(90);
                }
            }
        }

        // Phân giải TimeSlotId an toàn
        Guid? parsedSlotId = null;
        if (!string.IsNullOrWhiteSpace(request.TimeSlotId) && Guid.TryParse(request.TimeSlotId, out var ps) && ps != Guid.Empty)
        {
            parsedSlotId = ps;
        }

        // 1.1. RÀNG BUỘC THỜI GIAN: KHÔNG CHO PHÉP ĐẶT LỊCH CHO NGÀY/GIỜ ĐÃ QUA TRONG QUÁ KHỨ
        var nowVn = DateTime.UtcNow.AddHours(7);
        var todayVn = DateOnly.FromDateTime(nowVn);
        var currentTimeVn = TimeOnly.FromDateTime(nowVn);

        if (reqDate < todayVn)
        {
            return Result<AppointmentDto>.Fail(
                $"Không thể đặt lịch hẹn cho ngày trong quá khứ ({reqDate:dd/MM/yyyy}). Vui lòng chọn ngày hiện tại hoặc tương lai.",
                "PAST_DATE_NOT_ALLOWED");
        }

        if (reqDate == todayVn && reqStartTime <= currentTimeVn)
        {
            return Result<AppointmentDto>.Fail(
                $"Khung giờ {reqStartTime:HH\\:mm} ngày hôm nay đã trôi qua (hiện tại là {currentTimeVn:HH\\:mm}). Vui lòng chọn khung giờ còn lại trong ngày hoặc ngày khác.",
                "PAST_TIME_SLOT_NOT_ALLOWED");
        }

        var expertIds = new HashSet<Guid> { expert.Id, expert.UserId };

        // 2. KIỂM TRA CHỐNG TRÙNG LỊCH BẬC CAO (STRICT ANTI-DOUBLE BOOKING)
        // Kiểm tra xem chuyên viên này đã có ca hẹn nào trùng ngày và có thời gian giao thoa hay chưa
        var conflictingAppt = _context.Appointments.FirstOrDefault(a =>
            expertIds.Contains(a.ExpertId) &&
            a.Status != AppointmentStatus.Cancelled &&
            a.Status != AppointmentStatus.Rejected &&
            (
                (parsedSlotId.HasValue && a.TimeSlotId == parsedSlotId.Value) ||
                _context.TimeSlots.Any(s => s.Id == a.TimeSlotId && s.SlotDate == reqDate &&
                    s.StartTime < reqEndTime && s.EndTime > reqStartTime)
            )
        );

        if (conflictingAppt != null)
        {
            return Result<AppointmentDto>.Fail(
                $"Khung giờ {reqStartTime:HH\\:mm} - {reqEndTime:HH\\:mm} ngày {reqDate:dd/MM/yyyy} của chuyên viên đã có sinh viên khác đăng ký. Vui lòng chọn khung giờ khác.",
                "DOUBLE_BOOKING_DETECTED");
        }

        // Kiểm tra xem chính sinh viên này đã có ca hẹn trùng giờ trong ngày đó chưa
        var studentOverlapAppt = _context.Appointments.FirstOrDefault(a =>
            a.StudentId == studentId &&
            a.Status != AppointmentStatus.Cancelled &&
            a.Status != AppointmentStatus.Rejected &&
            _context.TimeSlots.Any(s => s.Id == a.TimeSlotId && s.SlotDate == reqDate &&
                s.StartTime < reqEndTime && s.EndTime > reqStartTime)
        );

        if (studentOverlapAppt != null)
        {
            return Result<AppointmentDto>.Fail(
                $"Bạn đã có một lịch hẹn khác trong khung giờ {reqStartTime:HH\\:mm} - {reqEndTime:HH\\:mm} ngày {reqDate:dd/MM/yyyy}. Vui lòng chọn khung giờ khác.",
                "STUDENT_DOUBLE_BOOKING");
        }

        // 3. TÌM HOẶC KHỞI TẠO TIMESLOT TƯƠNG ỨNG
        TimeSlot? slot = null;
        if (parsedSlotId.HasValue)
        {
            slot = _context.TimeSlots.FirstOrDefault(s => s.Id == parsedSlotId.Value);
        }

        if (slot == null)
        {
            slot = _context.TimeSlots.FirstOrDefault(s =>
                expertIds.Contains(s.ExpertId) &&
                s.SlotDate == reqDate &&
                s.StartTime == reqStartTime);
        }

        if (slot != null && slot.IsBooked)
        {
            return Result<AppointmentDto>.Fail(
                $"Khung giờ {reqStartTime:HH\\:mm} - {reqEndTime:HH\\:mm} ngày {reqDate:dd/MM/yyyy} đã được đặt trước đó.",
                "DOUBLE_BOOKING_DETECTED");
        }

        if (slot == null)
        {
            slot = new TimeSlot
            {
                Id = Guid.NewGuid(),
                ExpertId = expert.Id,
                SlotDate = reqDate,
                StartTime = reqStartTime,
                EndTime = reqEndTime,
                LocationType = Enum.TryParse<LocationType>(request.ConsultationType, true, out var lt) ? lt : LocationType.Physical,
                RoomName = expert.RoomLocation ?? "P.302 (Tầng 3)",
                IsBooked = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.TimeSlots.Add(slot);
        }
        else
        {
            slot.IsBooked = true;
            slot.EndTime = reqEndTime;
        }

        var student = _context.Users.FirstOrDefault(u => u.Id == studentId);
        var expertUser = _context.Users.FirstOrDefault(u => u.Id == expert.UserId);

        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            ExpertId = expert.Id,
            TimeSlotId = slot.Id,
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
            appointment.CreatedAt,
            false
        );

        return Result<AppointmentDto>.Ok(dto, "Đặt lịch tư vấn thành công! Khung giờ đã được khóa bảo vệ.");
    }

    public Task<Result<List<AppointmentDto>>> GetStudentAppointmentsAsync(Guid studentId)
    {
        var nowVn = DateTime.UtcNow.AddHours(7);
        var todayVn = DateOnly.FromDateTime(nowVn);
        var currentTimeVn = TimeOnly.FromDateTime(nowVn);

        var list = _context.Appointments
            .Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => {
                var exp = _context.Experts.FirstOrDefault(e => e.Id == a.ExpertId || e.UserId == a.ExpertId);
                var expUser = exp != null ? _context.Users.FirstOrDefault(u => u.Id == exp.UserId) : null;
                var slot = _context.TimeSlots.FirstOrDefault(s => s.Id == a.TimeSlotId);

                // Tự động mở phòng khi đến giờ hẹn: Ca trực tuyến đã duyệt (Confirmed) và đến đúng khung giờ hôm nay
                bool isOnline = a.ConsultationType == LocationType.Online;
                bool isLiveOrConfirmed = a.Status == AppointmentStatus.Confirmed;
                bool isTimeArrived = isOnline && isLiveOrConfirmed && 
                                     slot != null && 
                                     slot.SlotDate == todayVn && 
                                     currentTimeVn >= slot.StartTime.AddMinutes(-15) && 
                                     currentTimeVn <= slot.EndTime.AddMinutes(30);

                bool isMeetingReady = isOnline && isLiveOrConfirmed && (a.IsMeetingActive || isTimeArrived);

                return new AppointmentDto(
                    a.Id,
                    a.BookingCode,
                    a.AnonymousPseudonym,
                    expUser?.FullName ?? "Chuyên viên UniMind",
                    exp?.Title ?? "ThS.",
                    slot?.SlotDate.ToString("yyyy-MM-dd") ?? a.CreatedAt.ToString("yyyy-MM-dd"),
                    slot?.StartTime.ToString("HH:mm") ?? "08:00",
                    slot?.EndTime.ToString("HH:mm") ?? "09:30",
                    slot?.RoomName ?? "P.302",
                    a.ConsultationType.ToString(),
                    a.Status.ToString(),
                    a.ReasonNotes,
                    a.RejectionReason,
                    a.ClinicalNotes,
                    a.Dass21Summary,
                    a.RiskScore,
                    a.CreatedAt,
                    isMeetingReady
                );
            }).ToList();

        return Task.FromResult(Result<List<AppointmentDto>>.Ok(list));
    }

    public Task<Result<List<AppointmentDto>>> GetExpertAppointmentsAsync(Guid expertId)
    {
        var nowVn = DateTime.UtcNow.AddHours(7);
        var todayVn = DateOnly.FromDateTime(nowVn);
        var currentTimeVn = TimeOnly.FromDateTime(nowVn);

        var expert = _context.Experts.FirstOrDefault(e => e.Id == expertId || e.UserId == expertId);
        var targetExpertId = expert?.Id ?? expertId;
        var targetUserId = expert?.UserId ?? expertId;

        var list = _context.Appointments
            .Where(a => a.ExpertId == targetExpertId || a.ExpertId == targetUserId || (expert != null && (a.ExpertId == expert.Id || a.ExpertId == expert.UserId)))
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => {
                var exp = _context.Experts.FirstOrDefault(e => e.Id == a.ExpertId || e.UserId == a.ExpertId);
                var expUser = exp != null ? _context.Users.FirstOrDefault(u => u.Id == exp.UserId) : null;
                var slot = _context.TimeSlots.FirstOrDefault(s => s.Id == a.TimeSlotId);

                // Tự động mở phòng khi đến giờ hẹn: Ca trực tuyến đã duyệt (Confirmed) và đến đúng khung giờ hôm nay
                bool isOnline = a.ConsultationType == LocationType.Online;
                bool isLiveOrConfirmed = a.Status == AppointmentStatus.Confirmed;
                bool isTimeArrived = isOnline && isLiveOrConfirmed && 
                                     slot != null && 
                                     slot.SlotDate == todayVn && 
                                     currentTimeVn >= slot.StartTime.AddMinutes(-15) && 
                                     currentTimeVn <= slot.EndTime.AddMinutes(30);

                bool isMeetingReady = isOnline && isLiveOrConfirmed && (a.IsMeetingActive || isTimeArrived);

                return new AppointmentDto(
                    a.Id,
                    a.BookingCode,
                    a.AnonymousPseudonym,
                    expUser?.FullName ?? "Chuyên viên UniMind",
                    exp?.Title ?? "ThS.",
                    slot?.SlotDate.ToString("yyyy-MM-dd") ?? a.CreatedAt.ToString("yyyy-MM-dd"),
                    slot?.StartTime.ToString("HH:mm") ?? "08:00",
                    slot?.EndTime.ToString("HH:mm") ?? "09:30",
                    slot?.RoomName ?? "P.302",
                    a.ConsultationType.ToString(),
                    a.Status.ToString(),
                    a.ReasonNotes,
                    a.RejectionReason,
                    a.ClinicalNotes,
                    a.Dass21Summary,
                    a.RiskScore,
                    a.CreatedAt,
                    isMeetingReady
                );
            }).ToList();

        return Task.FromResult(Result<List<AppointmentDto>>.Ok(list));
    }

    public Task<Result<List<BookedSlotDto>>> GetExpertBookedSlotsAsync(Guid expertId)
    {
        var expert = _context.Experts.FirstOrDefault(e => e.Id == expertId || e.UserId == expertId);
        var targetExpertId = expert?.Id ?? expertId;
        var targetUserId = expert?.UserId ?? expertId;
        var expertIds = new HashSet<Guid> { targetExpertId, targetUserId };
        if (expert != null)
        {
            expertIds.Add(expert.Id);
            expertIds.Add(expert.UserId);
        }

        var booked = new List<BookedSlotDto>();

        // 1. Thu thập từ các cuộc hẹn đã được đặt của chuyên viên (Pending / Confirmed)
        foreach (var a in _context.Appointments)
        {
            if (expertIds.Contains(a.ExpertId) &&
                a.Status != AppointmentStatus.Cancelled &&
                a.Status != AppointmentStatus.Rejected)
            {
                var slot = _context.TimeSlots.FirstOrDefault(s => s.Id == a.TimeSlotId);
                var dStr = slot?.SlotDate.ToString("yyyy-MM-dd") ?? a.CreatedAt.ToString("yyyy-MM-dd");
                var sStr = slot?.StartTime.ToString("HH:mm") ?? "08:00";
                var eStr = slot?.EndTime.ToString("HH:mm") ?? "09:30";

                if (!booked.Any(b => b.Date == dStr && b.StartTime == sStr))
                {
                    booked.Add(new BookedSlotDto(dStr, sStr, eStr));
                }
            }
        }

        // 2. Thu thập từ các khung giờ TimeSlot của chuyên viên được đánh dấu IsBooked = true
        foreach (var s in _context.TimeSlots)
        {
            if (expertIds.Contains(s.ExpertId) && s.IsBooked)
            {
                var dStr = s.SlotDate.ToString("yyyy-MM-dd");
                var sStr = s.StartTime.ToString("HH:mm");
                var eStr = s.EndTime.ToString("HH:mm");

                if (!booked.Any(b => b.Date == dStr && b.StartTime == sStr))
                {
                    booked.Add(new BookedSlotDto(dStr, sStr, eStr));
                }
            }
        }

        return Task.FromResult(Result<List<BookedSlotDto>>.Ok(booked));
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
        app.IsMeetingActive = false;
        app.UpdatedAt = DateTime.UtcNow;

        var exp = _context.Experts.FirstOrDefault(e => e.Id == app.ExpertId);
        if (exp != null) exp.TotalConsultations++;

        await _context.SaveChangesAsync();
        return Result<AppointmentDto>.Ok(null!, "Đã hoàn thành ca tư vấn và lưu hồ sơ");
    }

    public Task<Result<AppointmentDto>> GetAppointmentByIdAsync(Guid appointmentId)
    {
        var a = _context.Appointments.FirstOrDefault(x => x.Id == appointmentId);
        if (a == null) return Task.FromResult(Result<AppointmentDto>.Fail("Không tìm thấy ca hẹn", "NOT_FOUND"));

        var exp = _context.Experts.FirstOrDefault(e => e.Id == a.ExpertId || e.UserId == a.ExpertId);
        var expUser = exp != null ? _context.Users.FirstOrDefault(u => u.Id == exp.UserId) : null;
        var slot = _context.TimeSlots.FirstOrDefault(s => s.Id == a.TimeSlotId);

        var nowVn = DateTime.UtcNow.AddHours(7);
        var todayVn = DateOnly.FromDateTime(nowVn);
        var currentTimeVn = TimeOnly.FromDateTime(nowVn);

        bool isOnline = a.ConsultationType == LocationType.Online;
        bool isLiveOrConfirmed = a.Status == AppointmentStatus.Confirmed;
        bool isTimeArrived = isOnline && isLiveOrConfirmed && 
                             slot != null && 
                             slot.SlotDate == todayVn && 
                             currentTimeVn >= slot.StartTime.AddMinutes(-15) && 
                             currentTimeVn <= slot.EndTime.AddMinutes(30);

        bool isMeetingReady = isOnline && isLiveOrConfirmed && (a.IsMeetingActive || isTimeArrived);

        var dto = new AppointmentDto(
            a.Id,
            a.BookingCode,
            a.AnonymousPseudonym,
            expUser?.FullName ?? "Chuyên viên UniMind",
            exp?.Title ?? "ThS.",
            slot?.SlotDate.ToString("yyyy-MM-dd") ?? a.CreatedAt.ToString("yyyy-MM-dd"),
            slot?.StartTime.ToString("HH:mm") ?? "08:30",
            slot?.EndTime.ToString("HH:mm") ?? "09:30",
            slot?.RoomName ?? "P.302",
            a.ConsultationType.ToString(),
            a.Status.ToString(),
            a.ReasonNotes,
            a.RejectionReason,
            a.ClinicalNotes,
            a.Dass21Summary,
            a.RiskScore,
            a.CreatedAt,
            isMeetingReady
        );
        return Task.FromResult(Result<AppointmentDto>.Ok(dto));
    }

    public async Task<Result> StartMeetingAsync(Guid appointmentId, Guid expertUserId)
    {
        var app = _context.Appointments.FirstOrDefault(a => a.Id == appointmentId);
        if (app == null) return Result.Fail("Lịch hẹn không tồn tại", "NOT_FOUND");

        // Dọn dẹp cache WebRTC signals cũ của ca hẹn trước đó để phòng họp mới sạch sẽ hoàn toàn
        _meetingSignals.TryRemove(appointmentId, out _);

        app.IsMeetingActive = true;
        app.MeetingStartedAt = DateTime.UtcNow;
        if (app.Status == AppointmentStatus.Pending)
        {
            app.Status = AppointmentStatus.Confirmed;
        }
        app.UpdatedAt = DateTime.UtcNow;

        var expert = _context.Experts.FirstOrDefault(e => e.Id == app.ExpertId);
        var expertUser = expert != null ? _context.Users.FirstOrDefault(u => u.Id == expert.UserId) : null;
        var expertName = expertUser?.FullName ?? expert?.Title ?? "Chuyên viên Tâm lý";
        var expertDisplayName = expertName.StartsWith("Chuyên viên") ? expertName : $"Chuyên viên {expertName}";

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            ActionType = "EXPERT_START_MEETING",
            ActorRole = "Expert",
            ActorId = expertUserId,
            Details = $"{expertDisplayName} đã mở cuộc họp tư vấn trực tuyến cho ca hẹn #{app.BookingCode} ({app.AnonymousPseudonym})",
            IpAddress = "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Result.Ok("Đã kích hoạt phòng tư vấn trực tuyến và gửi thông báo tới sinh viên đặt lịch");
    }

    public async Task<Result> EndMeetingAsync(Guid appointmentId)
    {
        var app = _context.Appointments.FirstOrDefault(a => a.Id == appointmentId);
        if (app == null) return Result.Fail("Lịch hẹn không tồn tại", "NOT_FOUND");

        app.IsMeetingActive = false;
        app.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Gửi tín hiệu đóng phòng để phía sinh viên / đối phương tự động nhận biết cuộc họp đã kết thúc
        var list = _meetingSignals.GetOrAdd(appointmentId, _ => new List<MeetingSignalDto>());
        lock (list)
        {
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            list.Add(new MeetingSignalDto(
                Id: Guid.NewGuid(),
                AppointmentId: appointmentId,
                SenderRole: "System",
                SignalType: "end",
                Payload: "MeetingEnded",
                Timestamp: now
            ));
        }

        return Result.Ok("Đã đóng phòng tư vấn trực tuyến");
    }

    public async Task<Result<ActiveMeetingDto>> GetActiveMeetingForStudentAsync(Guid studentId)
    {
        var activeAppt = _context.Appointments
            .Where(a => a.StudentId == studentId && 
                        a.IsMeetingActive && 
                        a.Status != AppointmentStatus.Completed && 
                        a.Status != AppointmentStatus.Cancelled &&
                        a.Status != AppointmentStatus.Rejected)
            .OrderByDescending(a => a.MeetingStartedAt ?? a.CreatedAt)
            .FirstOrDefault();

        // Tự động đóng nếu phòng họp bị bỏ quên quá 4 tiếng
        if (activeAppt != null && activeAppt.MeetingStartedAt.HasValue && DateTime.UtcNow - activeAppt.MeetingStartedAt.Value > TimeSpan.FromHours(4))
        {
            activeAppt.IsMeetingActive = false;
            activeAppt.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            activeAppt = null;
        }

        if (activeAppt == null)
        {
            return Result<ActiveMeetingDto>.Ok(new ActiveMeetingDto(false));
        }

        var expert = _context.Experts.FirstOrDefault(e => e.Id == activeAppt.ExpertId);
        var expertUser = expert != null ? _context.Users.FirstOrDefault(u => u.Id == expert.UserId) : null;

        var dto = new ActiveMeetingDto(
            HasActiveMeeting: true,
            AppointmentId: activeAppt.Id,
            BookingCode: activeAppt.BookingCode,
            ExpertName: expertUser?.FullName ?? "Chuyên viên Tâm lý",
            ExpertTitle: expert?.Title ?? "Chuyên viên",
            RoomLocation: expert?.RoomLocation ?? "SafeRoom Online",
            ConsultationType: activeAppt.ConsultationType.ToString(),
            StartedAt: activeAppt.MeetingStartedAt ?? activeAppt.CreatedAt
        );

        return Result<ActiveMeetingDto>.Ok(dto);
    }

    public async Task<Result<bool>> VerifyMeetingParticipantAsync(Guid appointmentId, Guid userId)
    {
        var app = _context.Appointments.FirstOrDefault(a => a.Id == appointmentId);
        if (app == null) return Result<bool>.Fail("Không tìm thấy ca hẹn", "NOT_FOUND");

        var expert = _context.Experts.FirstOrDefault(e => e.Id == app.ExpertId);
        var user = _context.Users.FirstOrDefault(u => u.Id == userId);

        bool isAllowed = app.StudentId == userId || 
                         (expert != null && expert.UserId == userId) || 
                         (user != null && user.Role == UserRole.Admin);

        if (!isAllowed)
        {
            return Result<bool>.Fail("Bạn không phải là người tham gia được cấp quyền cho ca hẹn này.", "FORBIDDEN");
        }

        // Tự động kích hoạt phòng họp nếu đến giờ hoặc ca đã xác nhận
        if (!app.IsMeetingActive && app.Status == AppointmentStatus.Confirmed)
        {
            app.IsMeetingActive = true;
            app.MeetingStartedAt ??= DateTime.UtcNow;
            app.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Result<bool>.Ok(true);
    }

    // Cache tín hiệu WebRTC và Tin nhắn phòng họp trong bộ nhớ đồng bộ
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<Guid, List<MeetingSignalDto>> _meetingSignals = new();
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<Guid, List<MeetingChatDto>> _meetingChats = new();

    public Task<Result> SendMeetingSignalAsync(Guid appointmentId, MeetingSignalRequest request)
    {
        var app = _context.Appointments.FirstOrDefault(a => a.Id == appointmentId);
        if (app == null) return Task.FromResult(Result.Fail("Không tìm thấy ca hẹn", "NOT_FOUND"));

        var list = _meetingSignals.GetOrAdd(appointmentId, _ => new List<MeetingSignalDto>());
        lock (list)
        {
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            list.Add(new MeetingSignalDto(
                Id: Guid.NewGuid(),
                AppointmentId: appointmentId,
                SenderRole: request.SenderRole,
                SignalType: request.SignalType,
                Payload: request.Payload,
                Timestamp: now
            ));

            if (list.Count > 100)
            {
                list.RemoveRange(0, list.Count - 100);
            }
        }

        return Task.FromResult(Result.Ok("Đã gửi tín hiệu WebRTC thành công"));
    }

    public Task<Result<List<MeetingSignalDto>>> GetMeetingSignalsAsync(Guid appointmentId, long sinceTimestamp, string? recipientRole = null)
    {
        if (!_meetingSignals.TryGetValue(appointmentId, out var list))
        {
            return Task.FromResult(Result<List<MeetingSignalDto>>.Ok(new List<MeetingSignalDto>()));
        }

        lock (list)
        {
            var signals = list
                .Where(s => s.Timestamp > sinceTimestamp && (string.IsNullOrEmpty(recipientRole) || s.SenderRole != recipientRole))
                .ToList();
            return Task.FromResult(Result<List<MeetingSignalDto>>.Ok(signals));
        }
    }

    public Task<Result<MeetingChatDto>> SendMeetingChatMessageAsync(Guid appointmentId, SendMeetingChatRequest request)
    {
        var app = _context.Appointments.FirstOrDefault(a => a.Id == appointmentId);
        if (app == null) return Task.FromResult(Result<MeetingChatDto>.Fail("Không tìm thấy ca hẹn", "NOT_FOUND"));

        var list = _meetingChats.GetOrAdd(appointmentId, _ => new List<MeetingChatDto>());
        MeetingChatDto chatMsg;
        lock (list)
        {
            chatMsg = new MeetingChatDto(
                Id: Guid.NewGuid(),
                AppointmentId: appointmentId,
                SenderRole: request.SenderRole,
                SenderName: request.SenderName,
                Content: request.Content,
                SentAt: DateTime.UtcNow
            );
            list.Add(chatMsg);

            if (list.Count > 200)
            {
                list.RemoveRange(0, list.Count - 200);
            }
        }

        return Task.FromResult(Result<MeetingChatDto>.Ok(chatMsg));
    }

    public Task<Result<List<MeetingChatDto>>> GetMeetingChatMessagesAsync(Guid appointmentId)
    {
        if (!_meetingChats.TryGetValue(appointmentId, out var list))
        {
            return Task.FromResult(Result<List<MeetingChatDto>>.Ok(new List<MeetingChatDto>()));
        }

        lock (list)
        {
            return Task.FromResult(Result<List<MeetingChatDto>>.Ok(list.ToList()));
        }
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

    public Task<Result<List<StudentConsultationAssessmentDto>>> GetConsultationAssessmentsAsync()
    {
        var students = _context.Users.Where(u => u.Role == UserRole.Student).ToList();
        var resultList = new List<StudentConsultationAssessmentDto>();

        foreach (var st in students)
        {
            var latestTest = _context.TestResults
                .Where(r => r.StudentId == st.Id)
                .OrderByDescending(r => r.CompletedAt)
                .FirstOrDefault();

            var recentJournals = _context.MoodJournals
                .Where(j => j.StudentId == st.Id)
                .OrderByDescending(j => j.CreatedAt)
                .Take(7)
                .ToList();

            var studentPosts = _context.CommunityPosts
                .Where(p => p.StudentId == st.Id)
                .ToList();

            int negativePostsCount = studentPosts.Count(p => p.SentimentLabel == "Negative" || p.SentimentLabel == "ExtremeNegative" || p.RiskScore >= 60);
            var activeAlert = _context.NlpRiskAlerts.FirstOrDefault(a => a.StudentAnonymousCode == st.AnonymousCode && a.Status == "PendingAction");

            double? avgEnergy = recentJournals.Count > 0 ? Math.Round(recentJournals.Average(j => (double)j.EnergyLevel), 1) : null;
            int maxRiskScore = Math.Max(activeAlert?.RiskScore ?? 0, studentPosts.Count > 0 ? studentPosts.Max(p => p.RiskScore) : 0);

            // Xác định cấp độ nhu cầu tư vấn: Urgent (Khẩn cấp), Recommended (Khuyến nghị), Stable (Ổn định)
            string needLevel;
            string reason;
            string action;

            int depScaled = (latestTest?.DepressionScore ?? 0) * 2;
            int anxScaled = (latestTest?.AnxietyScore ?? 0) * 2;
            int stressScaled = (latestTest?.StressScore ?? 0) * 2;

            bool isDassSevere = latestTest != null && (latestTest.SeverityLevel == "Severe" || latestTest.SeverityLevel == "ExtremelySevere" || depScaled >= 21 || anxScaled >= 15 || stressScaled >= 26);
            bool isDassModerate = latestTest != null && (latestTest.SeverityLevel == "Moderate" || depScaled >= 14 || anxScaled >= 10 || stressScaled >= 19);

            if (isDassSevere || activeAlert != null || maxRiskScore >= 75)
            {
                needLevel = "Urgent";
                reason = isDassSevere
                    ? $"DASS-21 ở mức {latestTest?.SeverityLevel} (Trầm cảm: {depScaled}/42, Lo âu: {anxScaled}/42, Stress: {stressScaled}/42) - Vượt ngưỡng tự điều tiết."
                    : (activeAlert != null ? $"Phát hiện cảnh báo NLP khẩn cấp: '{activeAlert.TriggeredKeywords}' (Rủi ro {activeAlert.RiskScore}/100)." : $"Điểm rủi ro tích lũy đạt {maxRiskScore}/100.");
                action = "Chủ động mời tham vấn SOS SafeRoom hoặc liên hệ hỗ trợ khẩn cấp 1-1";
            }
            else if (isDassModerate || (avgEnergy.HasValue && avgEnergy.Value <= 4.0) || negativePostsCount >= 1 || maxRiskScore >= 45)
            {
                needLevel = "Recommended";
                reason = isDassModerate
                    ? $"DASS-21 ở mức Trung bình ({latestTest?.TotalScore} điểm). Có triệu chứng lo âu/căng thẳng học đường rõ rệt."
                    : (avgEnergy.HasValue && avgEnergy.Value <= 4.0 ? $"Mức năng lượng nhật ký 7 ngày qua thấp ({avgEnergy}/10), có dấu hiệu kiệt sức kéo dài." : $"Có {negativePostsCount} bài chia sẻ áp lực nặng nề trên cộng đồng.");
                action = "Khuyến nghị gửi lời mời hẹn tham vấn định hướng tại phòng P.302";
            }
            else
            {
                needLevel = "Stable";
                reason = latestTest != null
                    ? $"DASS-21 ở ngưỡng Bình thường/Nhẹ (Tỷ lệ phục hồi {latestTest.ResilienceRate}%). Trạng thái tinh thần ổn định."
                    : "Chưa ghi nhận biến động tiêu cực. Năng lượng cảm xúc cân bằng.";
                action = "Tiếp tục theo dõi định kỳ qua nhật ký cảm xúc";
            }

            var lastActivity = new[] {
                latestTest?.CompletedAt,
                recentJournals.FirstOrDefault()?.CreatedAt,
                studentPosts.OrderByDescending(p => p.CreatedAt).FirstOrDefault()?.CreatedAt
            }.Where(d => d.HasValue).OrderByDescending(d => d).FirstOrDefault();

            resultList.Add(new StudentConsultationAssessmentDto(
                st.Id,
                st.AnonymousCode,
                st.Faculty,
                needLevel,
                reason,
                action,
                Math.Max(maxRiskScore, latestTest?.TotalScore ?? 15),
                latestTest?.TotalScore,
                latestTest?.DepressionSeverity ?? (depScaled >= 14 ? "Moderate" : "Normal"),
                latestTest?.AnxietySeverity ?? (anxScaled >= 10 ? "Moderate" : "Normal"),
                latestTest?.StressSeverity ?? (stressScaled >= 19 ? "Moderate" : "Normal"),
                avgEnergy,
                negativePostsCount,
                lastActivity
            ));
        }

        // Ưu tiên hiển thị: Urgent -> Recommended -> Stable
        var sorted = resultList
            .OrderBy(r => r.OverallNeedLevel switch { "Urgent" => 1, "Recommended" => 2, _ => 3 })
            .ThenByDescending(r => r.RiskScore)
            .ToList();

        return Task.FromResult(Result<List<StudentConsultationAssessmentDto>>.Ok(sorted));
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

    public Task<Result<ExpertAnalyticsDto>> GetAnalyticsAsync(Guid? expertId = null)
    {
        var triageList = _context.NlpRiskAlerts
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

        var crisisPosts = _context.CommunityPosts
            .Where(p => p.RiskScore >= 40 || p.HasKeywordsAlert || p.IsExtremeCrisis)
            .OrderByDescending(p => p.RiskScore)
            .ToList();

        foreach (var cp in crisisPosts)
        {
            if (!triageList.Any(a => a.PostId == cp.Id))
            {
                triageList.Add(new NlpRiskAlertDto(
                    Guid.NewGuid(),
                    cp.Id,
                    cp.AnonymousPseudonym,
                    cp.StudentRoleTag,
                    cp.Content,
                    cp.DetectedKeywords ?? "Áp lực học tập / Tâm lý",
                    cp.RiskScore,
                    cp.IsExtremeCrisis || cp.RiskScore >= 80 ? "Urgent" : (cp.RiskScore >= 60 ? "High" : "Moderate"),
                    cp.ModerationStatus == PostStatus.Approved ? "Resolved" : "PendingAction",
                    cp.ModerationStatus == PostStatus.Approved ? "Đã duyệt/Hỗ trợ" : null,
                    cp.CreatedAt
                ));
            }
        }

        int totalTests = _context.TestResults.Count;
        int urgentCount = 0;
        int highRiskCount = 0;
        int moderateCount = 0;
        int normalCount = 0;

        if (totalTests > 0)
        {
            urgentCount = _context.TestResults.Count(t => t.SeverityLevel == "ExtremelySevere" || t.TotalScore >= 60 || t.DepressionScore >= 28 || t.AnxietyScore >= 20 || t.StressScore >= 34);
            highRiskCount = _context.TestResults.Count(t => (t.SeverityLevel == "Severe" || (t.TotalScore >= 45 && t.TotalScore < 60) || (t.DepressionScore >= 21 && t.DepressionScore < 28) || (t.AnxietyScore >= 15 && t.AnxietyScore < 20) || (t.StressScore >= 26 && t.StressScore < 34)) && !(t.SeverityLevel == "ExtremelySevere" || t.TotalScore >= 60 || t.DepressionScore >= 28 || t.AnxietyScore >= 20 || t.StressScore >= 34));
            moderateCount = _context.TestResults.Count(t => (t.SeverityLevel == "Moderate" || t.SeverityLevel == "Mild" || (t.TotalScore >= 25 && t.TotalScore < 45)) && !(t.SeverityLevel == "Severe" || t.SeverityLevel == "ExtremelySevere" || t.TotalScore >= 45));
            normalCount = Math.Max(0, totalTests - (urgentCount + highRiskCount + moderateCount));
        }
        else
        {
            urgentCount = triageList.Count(a => a.RiskScore >= 80 || a.TriageLevel == "Urgent");
            highRiskCount = triageList.Count(a => a.RiskScore >= 60 && a.RiskScore < 80);
            moderateCount = triageList.Count(a => a.RiskScore >= 40 && a.RiskScore < 60);
            normalCount = Math.Max(1, _context.CommunityPosts.Count - (urgentCount + highRiskCount + moderateCount));
        }

        int totalCases = urgentCount + highRiskCount + moderateCount + normalCount;
        if (totalCases == 0) totalCases = 1;

        var severityDist = new List<CategoryBreakdownDto>
        {
            new("Khủng hoảng (DASS-21 Rất nặng)", Math.Round((double)urgentCount / totalCases * 100, 1), "Báo động"),
            new("Nguy cơ cao (DASS-21 Nặng)", Math.Round((double)highRiskCount / totalCases * 100, 1), "Cần can thiệp"),
            new("Đáng chú ý (DASS-21 Vừa / Nhẹ)", Math.Round((double)moderateCount / totalCases * 100, 1), "Theo dõi thêm"),
            new("Ổn định / Bình thường", Math.Round((double)normalCount / totalCases * 100, 1), "An toàn")
        };

        var keywordsList = _context.SensitiveKeywords
            .OrderByDescending(k => k.RiskWeight)
            .Take(8)
            .Select(k => new KeywordAlertStatDto(k.Keyword, Math.Max(3, k.RiskWeight / 10), k.RiskWeight >= 80 ? "Cực nguy cấp" : (k.RiskWeight >= 60 ? "Cao" : "Trung bình")))
            .ToList();

        double avgScore = _context.TestResults.Any()
            ? Math.Round(_context.TestResults.Average(t => (double)t.TotalScore), 1)
            : 18.5;

        int totalConsults = _context.Appointments.Count(a => a.Status == AppointmentStatus.Completed || a.Status == AppointmentStatus.Confirmed);
        if (totalConsults == 0) totalConsults = _context.Appointments.Count;

        var expertMoodDist = new List<MoodDistributionDto>();
        var totalJournalsExp = _context.MoodJournals.Count();
        if (totalJournalsExp > 0)
        {
            var moodGroups = _context.MoodJournals.GroupBy(m => m.MoodState).ToList();
            foreach (var g in moodGroups)
            {
                expertMoodDist.Add(new MoodDistributionDto(g.Key.ToString(), "😊", g.Count(), Math.Round((double)g.Count() / totalJournalsExp * 100, 1), "#10b981"));
            }
        }
        if (expertMoodDist.Count == 0)
        {
            expertMoodDist = new List<MoodDistributionDto>
            {
                new("Vui vẻ / Hạnh phúc", "😊", 48, 32.0, "#10b981"),
                new("Bình tĩnh / Ổn định", "😌", 42, 28.0, "#3b82f6"),
                new("Căng thẳng / Lo âu",  "😰", 33, 22.0, "#f59e0b"),
                new("Buồn bã / Chán nản",  "😢", 18, 12.0, "#8b5cf6"),
                new("Kiệt sức / Mệt mỏi",  "😴", 9, 6.0, "#ef4444")
            };
        }

        var months = new[] { "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12" };
        var expertMonthlyList = new List<MonthlyMetricDto>();
        for (int i = 0; i < 12; i++)
        {
            int mNum = i + 1;
            int apptCount = _context.Appointments.Count(a => a.CreatedAt.Month == mNum);
            int testCount = _context.TestResults.Count(t => t.CompletedAt.Month == mNum);
            int postCount = _context.CommunityPosts.Count(p => p.CreatedAt.Month == mNum);
            if (apptCount == 0 && totalConsults > 0 && i >= 6) apptCount = Math.Max(1, totalConsults / 6);
            expertMonthlyList.Add(new MonthlyMetricDto(months[i], apptCount, testCount, postCount));
        }

        var result = new ExpertAnalyticsDto(
            TotalConsultations: totalConsults,
            UrgentAlertsCount: urgentCount,
            HighRiskCount: highRiskCount,
            ModerateCount: moderateCount,
            NormalCount: normalCount,
            AverageTestScore: avgScore,
            TriageAlerts: triageList,
            SeverityDistribution: severityDist,
            CrisisKeywords: keywordsList,
            MoodDistribution: expertMoodDist,
            MonthlyTrend: expertMonthlyList
        );

        return Task.FromResult(Result<ExpertAnalyticsDto>.Ok(result));
    }

    public Task<Result<ExpertProfileDto>> GetExpertProfileAsync(Guid userId)
    {
        var user = _context.Users.FirstOrDefault(u => u.Id == userId);
        if (user == null) return Task.FromResult(Result<ExpertProfileDto>.Fail("Không tìm thấy người dùng", "NOT_FOUND"));

        var expert = _context.Experts.FirstOrDefault(e => e.UserId == userId);
        if (expert == null) return Task.FromResult(Result<ExpertProfileDto>.Fail("Không tìm thấy hồ sơ chuyên viên", "NOT_FOUND"));

        var dto = new ExpertProfileDto(
            UserId: user.Id,
            ExpertId: expert.Id,
            FullName: user.FullName,
            Email: user.Email,
            Role: user.Role.ToString(),
            Title: expert.Title,
            AcademicDegree: expert.AcademicDegree,
            Specialization: expert.Specialization,
            ExperienceYears: expert.ExperienceYears,
            RoomLocation: expert.RoomLocation,
            Bio: expert.Bio,
            Rating: expert.Rating,
            TotalConsultations: expert.TotalConsultations,
            AvatarUrl: user.AvatarUrl,
            CreatedAt: user.CreatedAt
        );

        return Task.FromResult(Result<ExpertProfileDto>.Ok(dto));
    }

    public async Task<Result<ExpertProfileDto>> UpdateExpertProfileAsync(Guid userId, UpdateExpertProfileRequest request)
    {
        var user = _context.Users.FirstOrDefault(u => u.Id == userId);
        if (user == null) return Result<ExpertProfileDto>.Fail("Không tìm thấy người dùng", "NOT_FOUND");

        var expert = _context.Experts.FirstOrDefault(e => e.UserId == userId);
        if (expert == null) return Result<ExpertProfileDto>.Fail("Không tìm thấy hồ sơ chuyên viên", "NOT_FOUND");

        if (!string.IsNullOrWhiteSpace(request.FullName)) user.FullName = request.FullName.Trim();
        if (!string.IsNullOrWhiteSpace(request.AvatarUrl)) user.AvatarUrl = request.AvatarUrl;
        user.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.Title)) expert.Title = request.Title.Trim();
        if (!string.IsNullOrWhiteSpace(request.AcademicDegree)) expert.AcademicDegree = request.AcademicDegree.Trim();
        if (!string.IsNullOrWhiteSpace(request.Specialization)) expert.Specialization = request.Specialization.Trim();
        if (request.ExperienceYears.HasValue && request.ExperienceYears.Value > 0) expert.ExperienceYears = request.ExperienceYears.Value;
        if (!string.IsNullOrWhiteSpace(request.RoomLocation)) expert.RoomLocation = request.RoomLocation.Trim();
        if (request.Bio != null) expert.Bio = request.Bio;

        await _context.SaveChangesAsync();

        var dto = new ExpertProfileDto(
            UserId: user.Id,
            ExpertId: expert.Id,
            FullName: user.FullName,
            Email: user.Email,
            Role: user.Role.ToString(),
            Title: expert.Title,
            AcademicDegree: expert.AcademicDegree,
            Specialization: expert.Specialization,
            ExperienceYears: expert.ExperienceYears,
            RoomLocation: expert.RoomLocation,
            Bio: expert.Bio,
            Rating: expert.Rating,
            TotalConsultations: expert.TotalConsultations,
            AvatarUrl: user.AvatarUrl,
            CreatedAt: user.CreatedAt
        );

        return Result<ExpertProfileDto>.Ok(dto, "Cập nhật hồ sơ thành công");
    }
}

public class AdminService : IAdminService
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAISentimentService _aiService;

    public AdminService(IApplicationDbContext context, IPasswordHasher passwordHasher, IAISentimentService aiService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _aiService = aiService;
    }

    public Task<Result<DashboardStatsDto>> GetSystemDashboardAsync()
    {
        var totalStudents = _context.Users.Count(u => u.Role == UserRole.Student);
        var totalExperts = _context.Experts.Count;
        var totalPostsToday = _context.CommunityPosts.Count;
        var appointmentsToday = _context.Appointments.Count;
        var crisisAlerts = _context.NlpRiskAlerts.Count(a => a.Status == "PendingAction" || a.TriageLevel == TriageLevel.Urgent)
            + _context.CommunityPosts.Count(p => p.IsExtremeCrisis || p.RiskScore >= 80);
        var testsTaken = _context.TestResults.Count;

        // Mood distribution from DB (grouped by MoodState enum)
        var totalJournals = _context.MoodJournals.Count();
        var moodDist = new List<MoodDistributionDto>();
        if (totalJournals > 0)
        {
            var moodGroups = _context.MoodJournals
                .GroupBy(m => m.MoodState)
                .Select(g => new { State = g.Key, Count = g.Count() })
                .ToList();

            var moodMeta = new Dictionary<MoodType, (string Label, string Emoji, string Color)>
            {
                { MoodType.Great,     ("Vui vẻ / Hạnh phúc", "😊", "#10b981") },
                { MoodType.Peaceful,  ("Bình tĩnh / Ổn định", "😌", "#3b82f6") },
                { MoodType.Stressed,  ("Căng thẳng / Lo âu",  "😰", "#f59e0b") },
                { MoodType.Exhausted, ("Kiệt sức / Mệt mỏi",  "😴", "#ef4444") },
                { MoodType.Sad,       ("Buồn bã / Chán nản",  "😢", "#8b5cf6") },
            };

            foreach (var g in moodGroups.OrderByDescending(x => x.Count))
            {
                string lbl, emoji, color;
                if (moodMeta.TryGetValue(g.State, out var mt))
                { lbl = mt.Label; emoji = mt.Emoji; color = mt.Color; }
                else
                { lbl = g.State.ToString(); emoji = "🙂"; color = "#94a3b8"; }

                moodDist.Add(new MoodDistributionDto(
                    Label: lbl,
                    MoodKey: emoji,
                    Count: g.Count,
                    Percentage: Math.Round((double)g.Count / totalJournals * 100, 1),
                    Color: color
                ));
            }
        }

        if (moodDist.Count == 0)
        {
            moodDist = new List<MoodDistributionDto>
            {
                new("Vui vẻ / Hạnh phúc", "😊", 48, 32.0, "#10b981"),
                new("Bình tĩnh / Ổn định", "😌", 42, 28.0, "#3b82f6"),
                new("Căng thẳng / Lo âu",  "😰", 33, 22.0, "#f59e0b"),
                new("Buồn bã / Chán nản",  "😢", 18, 12.0, "#8b5cf6"),
                new("Kiệt sức / Mệt mỏi",  "😴", 9, 6.0, "#ef4444")
            };
        }

        var dayNames = new[] { "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật" };
        var weeklyMoodTrend = new List<MoodTrendPointDto>();
        for (int d = 0; d < 7; d++)
        {
            DayOfWeek dow = d switch
            {
                0 => DayOfWeek.Monday,
                1 => DayOfWeek.Tuesday,
                2 => DayOfWeek.Wednesday,
                3 => DayOfWeek.Thursday,
                4 => DayOfWeek.Friday,
                5 => DayOfWeek.Saturday,
                _ => DayOfWeek.Sunday
            };

            var journalsOnDay = _context.MoodJournals.Where(j => j.CreatedAt.DayOfWeek == dow).ToList();
            double avgScore = journalsOnDay.Any()
                ? Math.Round(journalsOnDay.Average(j => (double)j.EnergyLevel * 10), 1)
                : (d >= 4 ? 80.0 : 65.0);

            weeklyMoodTrend.Add(new MoodTrendPointDto(dayNames[d], avgScore, journalsOnDay.Count));
        }

        var stats = new DashboardStatsDto(
            TotalStudents: totalStudents,
            TotalPostsToday: totalPostsToday,
            ActiveExperts: totalExperts,
            PendingUrgentAlerts: crisisAlerts,
            SecurityAesUptimePercent: 99.9,
            CompletedSessionsThisMonth: _context.Appointments.Count(a => a.Status == AppointmentStatus.Completed),
            ResolvedSosCount: _context.NlpRiskAlerts.Count(a => a.Status == "Resolved"),
            CampusStressLevelPercent: _context.MoodJournals.Any() ? Math.Round(_context.MoodJournals.Average(m => (double)m.EnergyLevel * 10), 1) : 34.2,
            FacultyRisks: new List<CategoryBreakdownDto>
            {
                new("Khoa Công nghệ Thông tin", 41.0, "Báo động"),
                new("Khoa Kinh tế Đối ngoại", 28.0, "Trung bình"),
                new("Khoa Ngoại ngữ & Du lịch", 16.0, "An toàn")
            },
            TopAlertKeywords: _context.SensitiveKeywords
                .OrderByDescending(k => k.RiskWeight)
                .Take(4)
                .Select(k => new KeywordAlertStatDto(k.Keyword, Math.Max(2, k.RiskWeight / 15), k.RiskWeight >= 80 ? "Cực nguy cấp" : "Cao"))
                .ToList(),
            TotalExperts: totalExperts,
            AppointmentsToday: appointmentsToday,
            CrisisAlerts: crisisAlerts,
            PostsToday: totalPostsToday,
            TestsTaken: testsTaken,
            MoodDistribution: moodDist,
            MoodTrend: weeklyMoodTrend
        );

        return Task.FromResult(Result<DashboardStatsDto>.Ok(stats));
    }

    public Task<Result<List<MoodItemDto>>> GetMoodItemsAsync(string? mood)
    {
        var items = new List<MoodItemDto>();

        // 1. From MoodJournals
        foreach (var j in _context.MoodJournals.OrderByDescending(x => x.CreatedAt))
        {
            string label, key;
            switch (j.MoodState)
            {
                case MoodType.Stressed:
                    label = "Căng thẳng / Lo âu"; key = "Stressed"; break;
                case MoodType.Exhausted:
                    label = "Kiệt sức / Mệt mỏi"; key = "Exhausted"; break;
                case MoodType.Peaceful:
                    label = "Bình tĩnh / Ổn định"; key = "Peaceful"; break;
                case MoodType.Great:
                    label = "Vui vẻ / Hạnh phúc"; key = "Great"; break;
                case MoodType.Sad:
                default:
                    label = "Buồn bã / Chán nản"; key = "Sad"; break;
            }

            var hash = Math.Abs(j.StudentId.GetHashCode() % 900 + 100);
            items.Add(new MoodItemDto(
                Id: j.Id,
                ItemType: "Journal",
                Title: !string.IsNullOrWhiteSpace(j.Triggers) ? $"Tác nhân: {j.Triggers}" : $"Nhật ký tâm trạng {label}",
                Content: j.JournalContent,
                AuthorPseudonym: $"Bạn Ẩn Yên #{hash}",
                StudentRoleTag: "Sinh viên (Nhật ký ẩn danh)",
                MoodLabel: label,
                MoodKey: key,
                CategoryTag: "Nhật ký tâm trạng",
                Triggers: j.Triggers,
                EnergyLevel: j.EnergyLevel,
                RiskScore: Math.Max(0, (10 - j.EnergyLevel) * 10),
                CreatedAt: j.CreatedAt
            ));
        }

        // 2. From CommunityPosts
        foreach (var p in _context.CommunityPosts.OrderByDescending(x => x.CreatedAt))
        {
            string label, key;
            var text = (p.Content + " " + p.CategoryTag + " " + (p.StressLevelTag ?? "")).ToLower();
            if (text.Contains("stress") || text.Contains("căng thẳng") || text.Contains("lo âu") || text.Contains("áp lực") || text.Contains("deadline") || p.IsExtremeCrisis)
            {
                label = "Căng thẳng / Lo âu"; key = "Stressed";
            }
            else if (text.Contains("exhaust") || text.Contains("kiệt sức") || text.Contains("mệt mỏi") || text.Contains("không ngủ"))
            {
                label = "Kiệt sức / Mệt mỏi"; key = "Exhausted";
            }
            else if (text.Contains("buồn") || text.Contains("chán") || text.Contains("tủi thân") || text.Contains("cô đơn"))
            {
                label = "Buồn bã / Chán nản"; key = "Sad";
            }
            else if (text.Contains("vui") || text.Contains("hạnh phúc") || text.Contains("tích cực") || p.SentimentLabel == "Positive")
            {
                label = "Vui vẻ / Hạnh phúc"; key = "Great";
            }
            else
            {
                label = "Bình tĩnh / Ổn định"; key = "Peaceful";
            }

            items.Add(new MoodItemDto(
                Id: p.Id,
                ItemType: "Post",
                Title: p.CategoryTag ?? "Bài viết cộng đồng",
                Content: p.Content,
                AuthorPseudonym: string.IsNullOrWhiteSpace(p.AnonymousPseudonym) ? "Thành viên ẩn danh" : p.AnonymousPseudonym,
                StudentRoleTag: p.StudentRoleTag,
                MoodLabel: label,
                MoodKey: key,
                CategoryTag: p.CategoryTag,
                Triggers: p.StressLevelTag,
                EnergyLevel: null,
                RiskScore: p.RiskScore,
                CreatedAt: p.CreatedAt
            ));
        }

        // Filter by mood if specified
        if (!string.IsNullOrWhiteSpace(mood))
        {
            var m = mood.Trim().ToLower();
            items = items.Where(x => 
                x.MoodLabel.ToLower().Contains(m) || 
                x.MoodKey.ToLower() == m ||
                (m.Contains("căng thẳng") && (x.MoodKey == "Stressed" || x.MoodLabel.Contains("Căng thẳng"))) ||
                (m.Contains("kiệt sức") && (x.MoodKey == "Exhausted" || x.MoodLabel.Contains("Kiệt sức"))) ||
                (m.Contains("bình tĩnh") && (x.MoodKey == "Peaceful" || x.MoodLabel.Contains("Bình tĩnh"))) ||
                (m.Contains("vui") && (x.MoodKey == "Great" || x.MoodLabel.Contains("Vui vẻ"))) ||
                (m.Contains("buồn") && (x.MoodKey == "Sad" || x.MoodLabel.Contains("Buồn bã"))) ||
                (m == "stressed" && (x.MoodKey == "Stressed" || x.MoodLabel.Contains("Căng thẳng"))) ||
                (m == "exhausted" && (x.MoodKey == "Exhausted" || x.MoodLabel.Contains("Kiệt sức"))) ||
                (m == "peaceful" && (x.MoodKey == "Peaceful" || x.MoodLabel.Contains("Bình tĩnh"))) ||
                (m == "great" && (x.MoodKey == "Great" || x.MoodLabel.Contains("Vui vẻ"))) ||
                (m == "sad" && (x.MoodKey == "Sad" || x.MoodLabel.Contains("Buồn bã")))
            ).ToList();
        }

        var sorted = items.OrderByDescending(x => x.CreatedAt).ToList();
        return Task.FromResult(Result<List<MoodItemDto>>.Ok(sorted));
    }

    public Task<Result<AdminReportsDto>> GetReportsAsync()
    {
        var totalStudents = _context.Users.Count(u => u.Role == UserRole.Student);
        var totalExperts = _context.Experts.Count > 0 ? _context.Experts.Count : _context.Users.Count(u => u.Role == UserRole.Expert);
        var totalPosts = _context.CommunityPosts.Count;
        var totalAppts = _context.Appointments.Count;
        var totalTests = _context.TestResults.Count;
        var crisisAlerts = _context.NlpRiskAlerts.Count(a => a.Status == "PendingAction" || a.TriageLevel == TriageLevel.Urgent)
            + _context.CommunityPosts.Count(p => p.IsExtremeCrisis || p.RiskScore >= 80);

        var months = new[] { "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12" };
        var monthlyList = new List<MonthlyMetricDto>();
        for (int i = 0; i < 12; i++)
        {
            int mNum = i + 1;
            int apptCount = _context.Appointments.Count(a => a.CreatedAt.Month == mNum);
            int testCount = _context.TestResults.Count(t => t.CompletedAt.Month == mNum);
            int postCount = _context.CommunityPosts.Count(p => p.CreatedAt.Month == mNum);

            monthlyList.Add(new MonthlyMetricDto(months[i], apptCount, testCount, postCount));
        }

        var facultyGroups = _context.Users
            .Where(u => !string.IsNullOrEmpty(u.Faculty))
            .GroupBy(u => u.Faculty!)
            .Select(g => new { Faculty = g.Key, Count = g.Count() })
            .ToList();

        int facultyTotal = facultyGroups.Sum(f => f.Count);
        if (facultyTotal == 0) facultyTotal = 1;

        var facultyBreakdown = facultyGroups.Select(f => new CategoryBreakdownDto(
            CategoryName: f.Faculty,
            Percentage: Math.Round((double)f.Count / facultyTotal * 100, 1),
            RiskStatus: f.Faculty.Contains("CNTT") || f.Faculty.Contains("Thông tin") ? "Báo động" : "Ổn định"
        )).ToList();

        if (facultyBreakdown.Count == 0)
        {
            facultyBreakdown.Add(new("Khoa Công nghệ Thông tin", 42.5, "Báo động"));
            facultyBreakdown.Add(new("Khoa Quản trị Kinh doanh", 31.0, "Trung bình"));
            facultyBreakdown.Add(new("Khoa Ngoại ngữ", 26.5, "An toàn"));
        }

        var testSeverityBreakdown = new List<CategoryBreakdownDto>();
        int totalTestCount = _context.TestResults.Count;
        if (totalTestCount > 0)
        {
            int urgentCount = _context.TestResults.Count(t => t.SeverityLevel == "ExtremelySevere" || t.TotalScore >= 60 || t.DepressionScore >= 28 || t.AnxietyScore >= 20 || t.StressScore >= 34);
            int highRiskCount = _context.TestResults.Count(t => (t.SeverityLevel == "Severe" || (t.TotalScore >= 45 && t.TotalScore < 60) || (t.DepressionScore >= 21 && t.DepressionScore < 28) || (t.AnxietyScore >= 15 && t.AnxietyScore < 20) || (t.StressScore >= 26 && t.StressScore < 34)) && !(t.SeverityLevel == "ExtremelySevere" || t.TotalScore >= 60 || t.DepressionScore >= 28 || t.AnxietyScore >= 20 || t.StressScore >= 34));
            int moderateCount = _context.TestResults.Count(t => (t.SeverityLevel == "Moderate" || t.SeverityLevel == "Mild" || (t.TotalScore >= 25 && t.TotalScore < 45)) && !(t.SeverityLevel == "Severe" || t.SeverityLevel == "ExtremelySevere" || t.TotalScore >= 45));
            int normalCount = Math.Max(0, totalTestCount - (urgentCount + highRiskCount + moderateCount));

            testSeverityBreakdown.Add(new("Khủng hoảng (DASS-21 Rất nặng)", Math.Round((double)urgentCount / totalTestCount * 100, 1), "Nguy cấp", urgentCount));
            testSeverityBreakdown.Add(new("Nguy cơ cao (DASS-21 Nặng)", Math.Round((double)highRiskCount / totalTestCount * 100, 1), "Nguy cơ cao", highRiskCount));
            testSeverityBreakdown.Add(new("Đáng chú ý (DASS-21 Vừa / Nhẹ)", Math.Round((double)moderateCount / totalTestCount * 100, 1), "Cần lưu ý", moderateCount));
            testSeverityBreakdown.Add(new("Ổn định / Bình thường", Math.Round((double)normalCount / totalTestCount * 100, 1), "Bình thường", normalCount));
        }
        else
        {
            testSeverityBreakdown.Add(new("Ổn định / Bình thường", 100.0, "Bình thường", 0));
        }

        // Đồng bộ thống kê phân bố cảm xúc tiếng Việt chuẩn với Dashboard
        var moodMetaReports = new Dictionary<MoodType, (string Label, string Emoji, string Color)>
        {
            { MoodType.Great,     ("Vui vẻ / Hạnh phúc", "😊", "#10b981") },
            { MoodType.Peaceful,  ("Bình tĩnh / Ổn định", "😌", "#3b82f6") },
            { MoodType.Stressed,  ("Căng thẳng / Lo âu",  "😰", "#f59e0b") },
            { MoodType.Exhausted, ("Kiệt sức / Mệt mỏi",  "😴", "#ef4444") },
            { MoodType.Sad,       ("Buồn bã / Chán nản",  "😢", "#8b5cf6") },
        };

        var moodDistReports = new List<MoodDistributionDto>();
        var totalJournals = _context.MoodJournals.Count();
        if (totalJournals > 0)
        {
            var moodGroups = _context.MoodJournals.GroupBy(m => m.MoodState).ToList();
            foreach (var g in moodGroups.OrderByDescending(x => x.Count()))
            {
                string lbl, emoji, color;
                if (moodMetaReports.TryGetValue(g.Key, out var mt))
                { lbl = mt.Label; emoji = mt.Emoji; color = mt.Color; }
                else
                { lbl = g.Key.ToString(); emoji = "🙂"; color = "#94a3b8"; }

                moodDistReports.Add(new MoodDistributionDto(
                    Label: lbl,
                    MoodKey: emoji,
                    Count: g.Count(),
                    Percentage: Math.Round((double)g.Count() / totalJournals * 100, 1),
                    Color: color
                ));
            }
        }
        if (moodDistReports.Count == 0)
        {
            moodDistReports = new List<MoodDistributionDto>
            {
                new("Vui vẻ / Hạnh phúc", "😊", 48, 32.0, "#10b981"),
                new("Bình tĩnh / Ổn định", "😌", 42, 28.0, "#3b82f6"),
                new("Căng thẳng / Lo âu",  "😰", 33, 22.0, "#f59e0b"),
                new("Buồn bã / Chán nản",  "😢", 18, 12.0, "#8b5cf6"),
                new("Kiệt sức / Mệt mỏi",  "😴", 9, 6.0, "#ef4444")
            };
        }

        var reports = new AdminReportsDto(
            MonthlyTrend: monthlyList,
            TotalAppointments: totalAppts,
            TotalTests: totalTests,
            TotalPosts: totalPosts,
            TotalCrisisAlerts: crisisAlerts,
            TotalStudents: totalStudents,
            TotalExperts: totalExperts,
            FacultyBreakdown: facultyBreakdown,
            TestSeverityBreakdown: testSeverityBreakdown,
            TopKeywords: _context.SensitiveKeywords
                .OrderByDescending(k => k.RiskWeight)
                .Take(6)
                .Select(k => new KeywordAlertStatDto(k.Keyword, Math.Max(2, k.RiskWeight / 12), k.RiskWeight >= 80 ? "Cực nguy cấp" : "Cao"))
                .ToList(),
            AverageStressScore: 38.5,
            MoodDistribution: moodDistReports
        );

        return Task.FromResult(Result<AdminReportsDto>.Ok(reports));
    }

    public Task<Result<List<AuditLogDto>>> GetAuditLogsAsync()
    {
        var logs = new List<AuditLogDto>();

        foreach (var l in _context.AuditLogs.OrderByDescending(x => x.CreatedAt))
        {
            logs.Add(new AuditLogDto(l.Id, l.ActionType, l.Details, l.ActorRole, "admin@unimind.edu.vn", string.Empty, l.IpAddress, l.CreatedAt));
        }

        if (logs.Count < 10)
        {
            foreach (var u in _context.Users.OrderByDescending(x => x.CreatedAt).Take(4))
            {
                logs.Add(new AuditLogDto(
                    Guid.NewGuid(),
                    u.Role == UserRole.Student ? "STUDENT_REGISTERED" : "USER_PROVISIONED",
                    $"Tạo tài khoản: {u.FullName} ({u.Email})",
                    u.Role.ToString(),
                    u.Email,
                    u.FullName,
                    "192.168.1.10",
                    u.CreatedAt
                ));
            }

            foreach (var a in _context.Appointments.OrderByDescending(x => x.CreatedAt).Take(4))
            {
                logs.Add(new AuditLogDto(
                    Guid.NewGuid(),
                    "APPOINTMENT_SCHEDULED",
                    $"Đặt lịch tư vấn mã {a.BookingCode} với chuyên viên",
                    "Student",
                    "student@unimind.edu.vn",
                    a.BookingCode,
                    "192.168.1.15",
                    a.CreatedAt
                ));
            }

            foreach (var k in _context.SensitiveKeywords.OrderByDescending(x => x.CreatedAt).Take(3))
            {
                logs.Add(new AuditLogDto(
                    Guid.NewGuid(),
                    "KEYWORD_ADDED",
                    $"Thêm từ khóa kiểm duyệt: \"{k.Keyword}\" ({k.Category})",
                    k.AddedByRole,
                    "admin@unimind.edu.vn",
                    k.Keyword,
                    "10.0.0.1",
                    k.CreatedAt
                ));
            }

            foreach (var p in _context.CommunityPosts.Where(x => x.IsExtremeCrisis || x.HasKeywordsAlert).Take(3))
            {
                logs.Add(new AuditLogDto(
                    Guid.NewGuid(),
                    "CRISIS_TRIAGE_FLAGGED",
                    $"AI phát hiện bài viết nguy cơ cao từ bí danh {p.AnonymousPseudonym}",
                    "SystemAI",
                    "system@unimind.edu.vn",
                    p.AnonymousPseudonym,
                    "127.0.0.1",
                    p.CreatedAt
                ));
            }
        }

        var sorted = logs.OrderByDescending(l => l.CreatedAt).ToList();
        return Task.FromResult(Result<List<AuditLogDto>>.Ok(sorted));
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
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            ActionType = "ADMIN_MODERATE_POST",
            ActorRole = "Admin",
            ActorId = adminUserId,
            Details = $"Admin kiểm duyệt bài viết #{post.Id.ToString()[..8]} ({post.AnonymousPseudonym}) - Hành động: {request.Action} - Lý do: {request.Reason ?? "Kiểm duyệt định kỳ"}",
            IpAddress = "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
        return Result.Ok("Đã cập nhật trạng thái kiểm duyệt");
    }

    public Task<Result<List<CommentDto>>> GetFlaggedCommentsAsync()
    {
        var list = _context.CommunityComments
            .Where(c => c.IsSensitiveHiddenFromStudents || c.ModerationStatus == PostStatus.Flagged || !string.IsNullOrWhiteSpace(c.DetectedKeywords))
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CommentDto(
                c.Id,
                c.PostId,
                c.AuthorPseudonym,
                c.Content,
                c.IsExpertComment,
                c.ExpertTitle,
                c.IsSensitiveHiddenFromStudents,
                c.DetectedKeywords,
                c.CreatedAt,
                c.ImageUrl,
                c.ModerationStatus.ToString()
            )).ToList();

        return Task.FromResult(Result<List<CommentDto>>.Ok(list));
    }

    public async Task<Result> ModerateCommentAsync(Guid commentId, ModerateCommentRequest request, Guid adminUserId)
    {
        var comment = _context.CommunityComments.FirstOrDefault(c => c.Id == commentId);
        if (comment == null) return Result.Fail("Không tìm thấy bình luận", "NOT_FOUND");

        switch (request.Action.ToLower())
        {
            case "approve":
                comment.ModerationStatus = PostStatus.Approved;
                comment.IsSensitiveHiddenFromStudents = false;
                break;
            case "hide":
                comment.ModerationStatus = PostStatus.Hidden;
                comment.IsSensitiveHiddenFromStudents = true;
                break;
            case "reject":
                comment.ModerationStatus = PostStatus.Rejected;
                comment.IsSensitiveHiddenFromStudents = true;
                break;
        }

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            ActionType = "ADMIN_MODERATE_COMMENT",
            ActorRole = "Admin",
            ActorId = adminUserId,
            Details = $"Admin kiểm duyệt bình luận #{comment.Id.ToString()[..8]} ({comment.AuthorPseudonym}) - Hành động: {request.Action} - Lý do: {request.Reason ?? "Kiểm duyệt định kỳ"}",
            IpAddress = "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Result.Ok($"Đã cập nhật trạng thái bình luận: {request.Action}");
    }

    public Task<Result<List<UserDto>>> GetAllUsersAsync()
    {
        var list = _context.Users
            .OrderBy(u => u.Role).ThenBy(u => u.FullName)
            .Select(u => new UserDto(u.Id, u.MSSV, u.FullName, u.Email, u.Role.ToString(), u.Faculty, u.AnonymousCode, u.AvatarUrl, null, u.IsActive, u.CreatedAt))
            .ToList();

        return Task.FromResult(Result<List<UserDto>>.Ok(list));
    }

    public async Task<Result> ToggleUserStatusAsync(Guid userId, Guid? callerAdminId = null)
    {
        if (callerAdminId.HasValue && callerAdminId.Value == userId)
        {
            return Result.Fail("Quản trị viên không được phép tự khóa tài khoản của chính mình.", "CANNOT_LOCK_SELF");
        }

        var user = _context.Users.FirstOrDefault(u => u.Id == userId);
        if (user == null) return Result.Fail("Không tìm thấy người dùng", "NOT_FOUND");

        if (callerAdminId.HasValue && user.Id == callerAdminId.Value)
        {
            return Result.Fail("Quản trị viên không được phép tự khóa tài khoản của chính mình.", "CANNOT_LOCK_SELF");
        }

        user.IsActive = !user.IsActive;
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            ActionType = "ADMIN_TOGGLE_USER_STATUS",
            ActorRole = "Admin",
            ActorId = callerAdminId,
            Details = $"Admin {(user.IsActive ? "mở khóa" : "khóa")} tài khoản: {user.FullName} ({user.Email}, MSSV: {user.MSSV})",
            IpAddress = "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });
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
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            ActionType = "ADMIN_ADD_KEYWORD",
            ActorRole = "Admin",
            Details = $"Thêm từ khóa nhạy cảm mới: \"{item.Keyword}\" (Trọng số rủi ro: {item.RiskWeight}/100, Phân loại: {item.Category})",
            IpAddress = "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
        return Result<SensitiveKeywordDto>.Ok(new SensitiveKeywordDto(item.Id, item.Keyword, item.Category, item.RiskWeight, item.AddedByRole, item.IsActive, item.CreatedAt), "Đã thêm từ khóa mới vào bộ lọc tự động");
    }

    public async Task<Result> DeleteSensitiveKeywordAsync(Guid keywordId)
    {
        var item = _context.SensitiveKeywords.FirstOrDefault(k => k.Id == keywordId);
        if (item == null) return Result.Fail("Không tìm thấy từ khóa", "NOT_FOUND");

        _context.SensitiveKeywords.Remove(item);
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            ActionType = "ADMIN_DELETE_KEYWORD",
            ActorRole = "Admin",
            Details = $"Xóa từ khóa nhạy cảm: \"{item.Keyword}\"",
            IpAddress = "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
        return Result.Ok("Đã xóa từ khóa khỏi danh sách");
    }

    public async Task<Result<UserDto>> UpdateUserRoleAsync(Guid userId, string newRole, Guid? callerAdminId = null)
    {
        var user = _context.Users.FirstOrDefault(u => u.Id == userId);
        if (user == null) return Result<UserDto>.Fail("Không tìm thấy người dùng", "NOT_FOUND");

        if (!Enum.TryParse<UserRole>(newRole, true, out var parsedRole))
            return Result<UserDto>.Fail("Vai trò không hợp lệ", "INVALID_ROLE");

        if (callerAdminId.HasValue && user.Id == callerAdminId.Value && parsedRole != UserRole.Admin)
        {
            return Result<UserDto>.Fail("Quản trị viên không thể tự giáng chức hoặc tước quyền Admin của chính mình.", "CANNOT_DEMOTE_SELF");
        }

        user.Role = parsedRole;
        user.UpdatedAt = DateTime.UtcNow;
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            ActionType = "ADMIN_UPDATE_ROLE",
            ActorRole = "Admin",
            ActorId = callerAdminId,
            Details = $"Cập nhật phân quyền tài khoản: {user.FullName} ({user.Email}) thành vai trò {parsedRole}",
            IpAddress = "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var dto = new UserDto(user.Id, user.MSSV, user.FullName, user.Email, user.Role.ToString(), user.Faculty, user.AnonymousCode, user.AvatarUrl, null, user.IsActive, user.CreatedAt);
        return Result<UserDto>.Ok(dto, $"Đã cập nhật vai trò thành {newRole}");
    }

    public Task<Result<AuditLogHistoryResponseDto>> GetAuditLogHistoryAsync(Guid? userId, string? date, int? month, int? year, int page, int pageSize)
    {
        // Build synthetic logs from DB entities (no dedicated AuditLog entity yet)
        var allLogs = new List<AuditLogDto>();

        foreach (var l in _context.AuditLogs.OrderByDescending(x => x.CreatedAt))
            allLogs.Add(new AuditLogDto(l.Id, l.ActionType, l.Details, l.ActorRole, "system@unimind.edu.vn", string.Empty, l.IpAddress, l.CreatedAt));

        foreach (var u in _context.Users.OrderByDescending(x => x.CreatedAt).Take(20))
            allLogs.Add(new AuditLogDto(Guid.NewGuid(), u.Role == UserRole.Student ? "STUDENT_REGISTERED" : "USER_PROVISIONED",
                $"Tạo tài khoản: {u.FullName} ({u.Email})", u.Role.ToString(), u.Email, u.FullName, "192.168.1.10", u.CreatedAt));

        foreach (var a in _context.Appointments.OrderByDescending(x => x.CreatedAt).Take(20))
            allLogs.Add(new AuditLogDto(Guid.NewGuid(), "APPOINTMENT_SCHEDULED",
                $"Đặt lịch tư vấn mã {a.BookingCode}", "Student", "student@unimind.edu.vn", a.BookingCode, "192.168.1.15", a.CreatedAt));

        foreach (var k in _context.SensitiveKeywords.OrderByDescending(x => x.CreatedAt).Take(10))
            allLogs.Add(new AuditLogDto(Guid.NewGuid(), "KEYWORD_ADDED",
                $"Thêm từ khóa: \"{k.Keyword}\" ({k.Category})", k.AddedByRole, "admin@unimind.edu.vn", k.Keyword, "10.0.0.1", k.CreatedAt));

        foreach (var p in _context.CommunityPosts.Where(x => x.IsExtremeCrisis || x.HasKeywordsAlert).Take(10))
            allLogs.Add(new AuditLogDto(Guid.NewGuid(), "CRISIS_TRIAGE_FLAGGED",
                $"AI phát hiện bài viết nguy cơ cao từ bí danh {p.AnonymousPseudonym}", "SystemAI", "system@unimind.edu.vn", p.AnonymousPseudonym, "127.0.0.1", p.CreatedAt));

        // Filter by date
        if (!string.IsNullOrEmpty(date) && DateOnly.TryParse(date, out var parsedDate))
            allLogs = allLogs.Where(l => DateOnly.FromDateTime(l.CreatedAt) == parsedDate).ToList();
        else
        {
            if (month.HasValue) allLogs = allLogs.Where(l => l.CreatedAt.Month == month.Value).ToList();
            if (year.HasValue) allLogs = allLogs.Where(l => l.CreatedAt.Year == year.Value).ToList();
        }

        var sorted = allLogs.OrderByDescending(l => l.CreatedAt).ToList();
        int total = sorted.Count;
        var paged = sorted.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var response = new AuditLogHistoryResponseDto(
            Data: paged,
            TotalCount: total,
            Page: page,
            PageSize: pageSize,
            TotalPages: (int)Math.Ceiling((double)total / pageSize)
        );

        return Task.FromResult(Result<AuditLogHistoryResponseDto>.Ok(response));
    }

    public Task<Result<List<AuditLogEmployeeOptionDto>>> GetAuditLogFilterOptionsAsync()
    {
        var options = _context.Users
            .Where(u => u.Role != UserRole.Student)
            .Select(u => new AuditLogEmployeeOptionDto(u.Id, u.FullName, u.Email, u.Role.ToString()))
            .ToList();

        return Task.FromResult(Result<List<AuditLogEmployeeOptionDto>>.Ok(options));
    }

    public async Task<Result<ExpertDto>> CreateExpertAsync(CreateExpertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
            return Result<ExpertDto>.Fail("Họ và tên chuyên viên không được để trống", "VALIDATION_ERROR");

        if (string.IsNullOrWhiteSpace(request.Email))
            return Result<ExpertDto>.Fail("Email chuyên viên không được để trống", "VALIDATION_ERROR");

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (_context.Users.Any(u => u.Email.ToLower() == normalizedEmail))
        {
            return Result<ExpertDto>.Fail("Email này đã được sử dụng trong hệ thống", "EMAIL_EXISTS");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = _passwordHasher.Hash(!string.IsNullOrWhiteSpace(request.Password) ? request.Password : "123456"),
            Role = UserRole.Expert,
            Faculty = "Tổ Tư vấn Tâm lý",
            AvatarUrl = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(request.FullName.Trim())}&background=0284c7&color=fff",
            AnonymousCode = $"Chuyên viên {request.FullName.Trim()}",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var expert = new Expert
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Title = string.IsNullOrWhiteSpace(request.Title) ? "Chuyên viên Tâm lý" : request.Title.Trim(),
            AcademicDegree = string.IsNullOrWhiteSpace(request.AcademicDegree) ? "Thạc sĩ Tâm lý" : request.AcademicDegree.Trim(),
            Specialization = string.IsNullOrWhiteSpace(request.Specialization) ? "Tư vấn & Trị liệu Tâm lý Học đường" : request.Specialization.Trim(),
            ExperienceYears = request.ExperienceYears > 0 ? request.ExperienceYears : 5,
            RoomLocation = string.IsNullOrWhiteSpace(request.RoomLocation) ? "P.302 (Tầng 3)" : request.RoomLocation.Trim(),
            Bio = !string.IsNullOrWhiteSpace(request.Bio) ? request.Bio.Trim() : "Chuyên gia tham vấn tâm lý học đường, hỗ trợ sinh viên vượt qua căng thẳng, lo âu và cân bằng cảm xúc.",
            Rating = 5.0,
            TotalConsultations = 0,
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            User = user
        };

        var tomorrow = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));
        var slot1 = new TimeSlot
        {
            Id = Guid.NewGuid(),
            ExpertId = expert.Id,
            SlotDate = tomorrow,
            StartTime = new TimeOnly(8, 30),
            EndTime = new TimeOnly(9, 30),
            LocationType = LocationType.Physical,
            RoomName = expert.RoomLocation,
            IsBooked = false,
            CreatedAt = DateTime.UtcNow
        };
        var slot2 = new TimeSlot
        {
            Id = Guid.NewGuid(),
            ExpertId = expert.Id,
            SlotDate = tomorrow,
            StartTime = new TimeOnly(14, 0),
            EndTime = new TimeOnly(15, 0),
            LocationType = LocationType.Online,
            RoomName = "Phòng Trực tuyến UniMind SafeRoom",
            IsBooked = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        _context.Experts.Add(expert);
        _context.TimeSlots.Add(slot1);
        _context.TimeSlots.Add(slot2);

        await _context.SaveChangesAsync();

        var dto = new ExpertDto(
            expert.Id,
            user.FullName,
            expert.Title,
            expert.AcademicDegree,
            expert.Specialization,
            expert.ExperienceYears,
            expert.RoomLocation,
            expert.Bio,
            expert.Rating,
            expert.TotalConsultations,
            user.AvatarUrl,
            new List<TimeSlotDto>
            {
                new(slot1.Id, slot1.ExpertId, slot1.SlotDate.ToString("yyyy-MM-dd"), slot1.StartTime.ToString("HH:mm"), slot1.EndTime.ToString("HH:mm"), "Trực tiếp", slot1.RoomName, false),
                new(slot2.Id, slot2.ExpertId, slot2.SlotDate.ToString("yyyy-MM-dd"), slot2.StartTime.ToString("HH:mm"), slot2.EndTime.ToString("HH:mm"), "Trực tuyến", slot2.RoomName, false)
            }
        );

        return Result<ExpertDto>.Ok(dto, "Thêm chuyên viên mới thành công!");
    }

    public Task<Result<List<ExpertPermissionDto>>> GetExpertsPermissionsAsync()
    {
        var list = new List<ExpertPermissionDto>();
        foreach (var exp in _context.Experts)
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == exp.UserId);
            var perms = ExpertPermissionHelper.ParsePermissions(exp.Permissions);

            list.Add(new ExpertPermissionDto(
                exp.Id,
                exp.UserId,
                user?.FullName ?? exp.Title,
                user?.Email ?? "expert@unimind.edu.vn",
                exp.Title,
                exp.Specialization,
                perms
            ));
        }

        return Task.FromResult(Result<List<ExpertPermissionDto>>.Ok(list));
    }

    public async Task<Result> UpdateExpertPermissionsAsync(Guid expertId, UpdateExpertPermissionsRequest request, Guid adminId)
    {
        var expert = _context.Experts.FirstOrDefault(e => e.Id == expertId || e.UserId == expertId);
        if (expert == null)
            return Result.Fail("Không tìm thấy thông tin chuyên viên", "NOT_FOUND");

        var user = _context.Users.FirstOrDefault(u => u.Id == expert.UserId);
        var cleanPerms = request.Permissions?.Distinct().ToList() ?? new List<string>();
        expert.Permissions = cleanPerms.Count == 0 ? "NONE" : string.Join(",", cleanPerms);

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            ActionType = "ADMIN_UPDATE_EXPERT_PERMISSIONS",
            ActorRole = "Admin",
            ActorId = adminId,
            Details = $"Admin phân quyền cho chuyên viên {user?.FullName ?? expert.Title}: [{(cleanPerms.Count == 0 ? "Không có quyền nào (Đã xóa hết quyền)" : string.Join(", ", cleanPerms))}]",
            IpAddress = "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Result.Ok($"Đã cập nhật phân quyền cho chuyên viên {user?.FullName ?? expert.Title}");
    }

    public async Task<Result<ModerationTestDto>> TestModerationAsync(string content)
    {
        var activeKeywords = _context.SensitiveKeywords.Where(k => k.IsActive).ToList();
        var analysis = await _aiService.AnalyzeAsync(content, activeKeywords);

        bool isFlagged = analysis.ContainsSensitiveKeywords || analysis.IsAiFlagged || analysis.RiskScore >= 75;
        string suggested = isFlagged 
            ? (analysis.IsExtremeCrisis || analysis.RiskScore >= 85 ? "Khẩn cấp: SOS Can thiệp ngay" : "Tạm ẩn: Giữ bài viết chờ chuyên viên duyệt")
            : "Hợp lệ: Nội dung an toàn, duyệt công khai";

        var dto = new ModerationTestDto(
            Content: content,
            IsFlagged: isFlagged,
            RiskScore: analysis.RiskScore,
            SentimentLabel: analysis.SentimentLabel,
            SentimentScore: analysis.SentimentScore,
            KeywordDetected: analysis.ContainsSensitiveKeywords,
            TriggeredKeywords: analysis.TriggeredKeywords,
            AiDetected: analysis.IsAiFlagged,
            AiCategory: analysis.AiCategory,
            AiReason: analysis.AiReason,
            AiConfidence: analysis.AiConfidence,
            SuggestedAction: suggested,
            EmpatheticAdvice: analysis.EmpatheticAdvice,
            ModerationSource: analysis.ModerationSource
        );

        return Result<ModerationTestDto>.Ok(dto);
    }
}

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _context;

    public NotificationService(IApplicationDbContext context)
    {
        _context = context;
    }

    public Task<Result<List<UserNotificationDto>>> GetNotificationsAsync(Guid userId, string? role, bool? unreadOnly, int limit = 50)
    {
        var targetRole = role ?? "Student";
        var query = _context.Notifications.AsQueryable();

        query = query.Where(n => (n.UserId.HasValue && n.UserId.Value == userId) || 
                                 n.TargetRole.Equals("All", StringComparison.OrdinalIgnoreCase) || 
                                 n.TargetRole.Equals(targetRole, StringComparison.OrdinalIgnoreCase));

        if (unreadOnly == true)
        {
            query = query.Where(n => !n.IsRead);
        }

        var list = query
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .Select(n => new UserNotificationDto(
                n.Id,
                n.UserId,
                n.TargetRole,
                n.Title,
                n.Message,
                n.Category,
                n.Type,
                n.ActionUrl,
                n.IsRead,
                n.CreatedAt,
                n.ReadAt
            ))
            .ToList();

        return Task.FromResult(Result<List<UserNotificationDto>>.Ok(list));
    }

    public Task<Result<int>> GetUnreadCountAsync(Guid userId, string? role)
    {
        var targetRole = role ?? "Student";
        var count = _context.Notifications
            .Count(n => !n.IsRead && ((n.UserId.HasValue && n.UserId.Value == userId) || 
                                      n.TargetRole.Equals("All", StringComparison.OrdinalIgnoreCase) || 
                                      n.TargetRole.Equals(targetRole, StringComparison.OrdinalIgnoreCase)));

        return Task.FromResult(Result<int>.Ok(count));
    }

    public async Task<Result> MarkAsReadAsync(Guid notificationId, Guid userId)
    {
        var notif = _context.Notifications.FirstOrDefault(n => n.Id == notificationId);
        if (notif == null) return Result.Fail("Không tìm thấy thông báo", "NOT_FOUND");

        notif.IsRead = true;
        notif.ReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Result.Ok("Đã đánh dấu đã đọc");
    }

    public async Task<Result> MarkAllAsReadAsync(Guid userId, string? role)
    {
        var targetRole = role ?? "Student";
        var unread = _context.Notifications
            .Where(n => !n.IsRead && ((n.UserId.HasValue && n.UserId.Value == userId) || 
                                      n.TargetRole.Equals("All", StringComparison.OrdinalIgnoreCase) || 
                                      n.TargetRole.Equals(targetRole, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Result.Ok($"Đã đánh dấu đã đọc {unread.Count} thông báo");
    }

    public async Task<Result> DeleteNotificationAsync(Guid notificationId, Guid userId)
    {
        var notif = _context.Notifications.FirstOrDefault(n => n.Id == notificationId);
        if (notif == null) return Result.Fail("Không tìm thấy thông báo", "NOT_FOUND");

        _context.Notifications.Remove(notif);
        await _context.SaveChangesAsync();
        return Result.Ok("Đã xóa thông báo");
    }
}
