using Microsoft.AspNetCore.Mvc;
using UniMind.Application.Common.Models;
using UniMind.Application.Features;

namespace UniMind.WebAPI.Controllers;

public static class ControllerAuthExtensions
{
    public static Guid? GetUserIdFromRequest(this HttpRequest request)
    {
        if (request.Headers.TryGetValue("Authorization", out var authHeader))
        {
            var token = authHeader.ToString().Replace("Bearer ", "").Trim();
            var parts = token.Split('.');
            if (parts.Length >= 2)
            {
                try
                {
                    string payload = parts[1];
                    payload = payload.Replace('-', '+').Replace('_', '/');
                    switch (payload.Length % 4)
                    {
                        case 2: payload += "=="; break;
                        case 3: payload += "="; break;
                    }
                    var bytes = Convert.FromBase64String(payload);
                    var json = System.Text.Encoding.UTF8.GetString(bytes);
                    using var doc = System.Text.Json.JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("sub", out var sub) && Guid.TryParse(sub.GetString(), out var id))
                    {
                        return id;
                    }
                }
                catch { }
            }
        }
        return null;
    }
}

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Đăng nhập tài khoản (Sinh viên, Chuyên viên, Quản trị viên)
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<Result<AuthResponse>>> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>
    /// Đăng ký tài khoản sinh viên mới (Tự động sinh bí danh bảo mật)
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<Result<AuthResponse>>> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin tài khoản hiện tại
    /// </summary>
    [HttpGet("me/{userId:guid}")]
    public async Task<ActionResult<Result<UserDto>>> GetMe(Guid userId)
    {
        var result = await _authService.GetCurrentUserAsync(userId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("me")]
    public async Task<ActionResult<Result<UserDto>>> GetMeCurrent([FromQuery] Guid? userId = null)
    {
        var uid = userId ?? Request.GetUserIdFromRequest() ?? Guid.Parse("22222222-2222-2222-2222-222222222221");
        var result = await _authService.GetCurrentUserAsync(uid);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }
}

[ApiController]
[Route("api/mood-journals")]
[Produces("application/json")]
public class MoodJournalsController : ControllerBase
{
    private readonly IMoodJournalService _journalService;

    public MoodJournalsController(IMoodJournalService journalService)
    {
        _journalService = journalService;
    }

    /// <summary>
    /// Ghi nhật ký cảm xúc hôm nay (AI tự động chấm điểm Sentiment & gợi ý hơi thở)
    /// </summary>
    [HttpPost("student/{studentId:guid}")]
    public async Task<ActionResult<Result<MoodJournalDto>>> CreateJournal(Guid studentId, [FromBody] CreateMoodJournalRequest request)
    {
        var result = await _journalService.CreateJournalAsync(studentId, request);
        return Ok(result);
    }

    [HttpPost]
    [HttpPost("my")]
    public async Task<ActionResult<Result<MoodJournalDto>>> CreateJournalDefault([FromBody] CreateMoodJournalRequest request, [FromQuery] Guid? studentId = null)
    {
        var targetStudentId = studentId ?? request.StudentId ?? Guid.Parse("22222222-2222-2222-2222-222222222221");
        var result = await _journalService.CreateJournalAsync(targetStudentId, request);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách lịch sử nhật ký của sinh viên
    /// </summary>
    [HttpGet("student/{studentId:guid}")]
    public async Task<ActionResult<Result<List<MoodJournalDto>>>> GetStudentJournals(Guid studentId)
    {
        var result = await _journalService.GetStudentJournalsAsync(studentId);
        return Ok(result);
    }

    [HttpGet]
    [HttpGet("my")]
    public async Task<ActionResult<Result<List<MoodJournalDto>>>> GetStudentJournalsDefault([FromQuery] Guid? studentId = null)
    {
        var targetStudentId = studentId ?? Guid.Parse("22222222-2222-2222-2222-222222222221");
        var result = await _journalService.GetStudentJournalsAsync(targetStudentId);
        return Ok(result);
    }

    /// <summary>
    /// Lấy thống kê và dữ liệu vẽ biểu đồ biến thiên tâm trạng 7 ngày / tháng
    /// </summary>
    [HttpGet("student/{studentId:guid}/stats")]
    public async Task<ActionResult<Result<MoodStatsDto>>> GetMoodStats(Guid studentId)
    {
        var result = await _journalService.GetMoodStatsAsync(studentId);
        return Ok(result);
    }
}

[ApiController]
[Route("api/psychological-tests")]
[Produces("application/json")]
public class PsychologicalTestsController : ControllerBase
{
    private readonly IPsychologicalTestService _testService;

    public PsychologicalTestsController(IPsychologicalTestService testService)
    {
        _testService = testService;
    }

    /// <summary>
    /// Lấy danh sách các bài trắc nghiệm chuẩn hóa (DASS-21, PHQ-9, GAD-7, MBI-SS)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<Result<List<TestDto>>>> GetTests()
    {
        var result = await _testService.GetAvailableTestsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết bộ câu hỏi và thang điểm bài test
    /// </summary>
    [HttpGet("{testId:guid}")]
    public async Task<ActionResult<Result<TestDetailDto>>> GetTestDetails(Guid testId)
    {
        var result = await _testService.GetTestDetailsAsync(testId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    /// <summary>
    /// Nộp bài trắc nghiệm (Tự động chấm điểm 3 chỉ số D-A-S và xuất nhận định AI)
    /// </summary>
    [HttpPost("student/{studentId:guid}/submit")]
    public async Task<ActionResult<Result<TestResultDto>>> SubmitTest(Guid studentId, [FromBody] SubmitTestRequest request)
    {
        var result = await _testService.SubmitTestAsync(studentId, request);
        return Ok(result);
    }

    [HttpPost("submit")]
    public async Task<ActionResult<Result<TestResultDto>>> SubmitTestDefault([FromBody] SubmitTestRequest request, [FromQuery] Guid? studentId = null)
    {
        var targetStudentId = studentId ?? request.StudentId ?? Guid.Parse("22222222-2222-2222-2222-222222222221");
        var result = await _testService.SubmitTestAsync(targetStudentId, request);
        return Ok(result);
    }

    /// <summary>
    /// Lấy hồ sơ tâm lý và kết quả test gần nhất của sinh viên
    /// </summary>
    [HttpGet("student/{studentId:guid}/latest")]
    public async Task<ActionResult<Result<TestResultDto?>>> GetLatestResult(Guid studentId)
    {
        var result = await _testService.GetLatestResultAsync(studentId);
        return Ok(result);
    }

    [HttpGet("latest")]
    public async Task<ActionResult<Result<TestResultDto?>>> GetLatestResultDefault([FromQuery] Guid? studentId = null)
    {
        var targetStudentId = studentId ?? Guid.Parse("22222222-2222-2222-2222-222222222221");
        var result = await _testService.GetLatestResultAsync(targetStudentId);
        return Ok(result);
    }
}

[ApiController]
[Route("api/community")]
[Produces("application/json")]
public class CommunityController : ControllerBase
{
    private readonly ICommunityService _communityService;

    public CommunityController(ICommunityService communityService)
    {
        _communityService = communityService;
    }

    /// <summary>
    /// Lấy bảng tin cộng đồng (Tự động ẩn bình luận/bài viết nhạy cảm đối với sinh viên)
    /// </summary>
    [HttpGet("posts")]
    public async Task<ActionResult<Result<List<PostDto>>>> GetFeed([FromQuery] bool isStaff = false, [FromQuery] string? category = null)
    {
        var result = await _communityService.GetFeedAsync(isStaff, category);
        return Ok(result);
    }

    /// <summary>
    /// Đăng bài viết ẩn danh (AI quét từ khóa nhạy cảm, bài quá tiêu cực sẽ kích hoạt cảnh báo nguy cơ)
    /// </summary>
    [HttpPost("posts/student/{studentId:guid}")]
    public async Task<ActionResult<Result<PostDto>>> CreatePost(Guid studentId, [FromBody] CreatePostRequest request)
    {
        var result = await _communityService.CreatePostAsync(studentId, request);
        return Ok(result);
    }

    [HttpPost("posts")]
    public async Task<ActionResult<Result<PostDto>>> CreatePostDefault([FromBody] CreatePostRequest request, [FromQuery] Guid? studentId = null)
    {
        var targetStudentId = studentId ?? request.StudentId ?? Guid.Parse("22222222-2222-2222-2222-222222222221");
        var result = await _communityService.CreatePostAsync(targetStudentId, request);
        return Ok(result);
    }

    /// <summary>
    /// Gửi bình luận thấu cảm (Bình luận có từ khóa nhạy cảm sẽ bị ẩn với SV nhưng gửi tới Chuyên viên/Admin)
    /// </summary>
    [HttpPost("posts/{postId:guid}/comments/user/{userId:guid}")]
    public async Task<ActionResult<Result<CommentDto>>> AddComment(Guid postId, Guid userId, [FromBody] CreateCommentRequest request, [FromQuery] bool isExpert = false)
    {
        var result = await _communityService.AddCommentAsync(userId, postId, request, isExpert);
        return Ok(result);
    }

    [HttpPost("posts/{postId:guid}/comments")]
    public async Task<ActionResult<Result<CommentDto>>> AddCommentDefault(Guid postId, [FromBody] CreateCommentRequest request, [FromQuery] Guid? userId = null, [FromQuery] bool isExpert = false)
    {
        var targetUserId = userId ?? request.UserId ?? Guid.Parse("22222222-2222-2222-2222-222222222221");
        var result = await _communityService.AddCommentAsync(targetUserId, postId, request, isExpert);
        return Ok(result);
    }

    /// <summary>
    /// Thả cảm xúc: "Ôm một cái" (hug) hoặc "Đồng cảm" (empathy)
    /// </summary>
    [HttpPost("posts/{postId:guid}/react")]
    public async Task<ActionResult<Result<PostDto>>> React(Guid postId, [FromBody] ReactRequest request)
    {
        var result = await _communityService.ReactAsync(postId, request.ReactionType);
        return Ok(result);
    }

    [HttpGet("triage-alerts")]
    public async Task<ActionResult<Result<List<NlpRiskAlertDto>>>> GetTriageAlerts([FromServices] IExpertWorkspaceService expertService)
    {
        var result = await expertService.GetTriageAlertsAsync();
        return Ok(result);
    }
}

[ApiController]
[Route("api/appointments")]
[Produces("application/json")]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentsController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    /// <summary>
    /// Lấy danh sách chuyên viên tâm lý và khung giờ trống
    /// </summary>
    [HttpGet("experts")]
    public async Task<ActionResult<Result<List<ExpertDto>>>> GetExperts([FromQuery] string? specialty = null)
    {
        var result = await _appointmentService.GetExpertsAsync(specialty);
        return Ok(result);
    }

    /// <summary>
    /// Đặt lịch hẹn tư vấn 1-1 (Áp dụng thuật toán chống trùng lịch)
    /// </summary>
    [HttpPost("student/{studentId:guid}/book")]
    public async Task<ActionResult<Result<AppointmentDto>>> BookAppointment(Guid studentId, [FromBody] BookAppointmentRequest request)
    {
        var result = await _appointmentService.BookAppointmentAsync(studentId, request);
        if (!result.Success)
        {
            if (result.ErrorCode == "DOUBLE_BOOKING_DETECTED")
                return Conflict(result);
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpPost("book")]
    public async Task<ActionResult<Result<AppointmentDto>>> BookAppointmentDefault([FromBody] BookAppointmentRequest request, [FromQuery] Guid? studentId = null)
    {
        var targetStudentId = studentId ?? Request.GetUserIdFromRequest() ?? Guid.Parse("22222222-2222-2222-2222-222222222221");
        var result = await _appointmentService.BookAppointmentAsync(targetStudentId, request);
        if (!result.Success)
        {
            if (result.ErrorCode == "DOUBLE_BOOKING_DETECTED")
                return Conflict(result);
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách lịch hẹn của sinh viên
    /// </summary>
    [HttpGet("student/{studentId:guid}")]
    public async Task<ActionResult<Result<List<AppointmentDto>>>> GetStudentAppointments(Guid studentId)
    {
        var result = await _appointmentService.GetStudentAppointmentsAsync(studentId);
        return Ok(result);
    }

    [HttpGet]
    [HttpGet("my")]
    public async Task<ActionResult<Result<List<AppointmentDto>>>> GetStudentAppointmentsDefault([FromQuery] Guid? studentId = null)
    {
        var targetStudentId = studentId ?? Request.GetUserIdFromRequest() ?? Guid.Parse("22222222-2222-2222-2222-222222222221");
        var result = await _appointmentService.GetStudentAppointmentsAsync(targetStudentId);
        return Ok(result);
    }

    [HttpGet("expert/today")]
    public async Task<ActionResult<Result<List<AppointmentDto>>>> GetExpertToday([FromQuery] Guid? expertId = null)
    {
        var targetExpertId = expertId ?? Request.GetUserIdFromRequest() ?? Guid.Parse("33333333-3333-3333-3333-333333333331");
        var result = await _appointmentService.GetExpertAppointmentsAsync(targetExpertId);
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var filtered = result.Data?.Where(a => a.Date == today || a.Status == "Confirmed").ToList() ?? new();
        return Ok(Result<List<AppointmentDto>>.Ok(filtered));
    }

    [HttpGet("expert/pending")]
    public async Task<ActionResult<Result<List<AppointmentDto>>>> GetExpertPending([FromQuery] Guid? expertId = null)
    {
        var targetExpertId = expertId ?? Request.GetUserIdFromRequest() ?? Guid.Parse("33333333-3333-3333-3333-333333333331");
        var result = await _appointmentService.GetExpertAppointmentsAsync(targetExpertId);
        var filtered = result.Data?.Where(a => a.Status == "Pending").ToList() ?? new();
        return Ok(Result<List<AppointmentDto>>.Ok(filtered));
    }

    /// <summary>
    /// Lấy danh sách lịch hẹn của chuyên viên
    /// </summary>
    [HttpGet("expert/{expertId:guid}")]
    public async Task<ActionResult<Result<List<AppointmentDto>>>> GetExpertAppointments(Guid expertId)
    {
        var result = await _appointmentService.GetExpertAppointmentsAsync(expertId);
        return Ok(result);
    }

    /// <summary>
    /// Chuyên viên phê duyệt hoặc từ chối ca hẹn
    /// </summary>
    [HttpPatch("{appointmentId:guid}/status")]
    public async Task<ActionResult<Result<AppointmentDto>>> UpdateStatus(Guid appointmentId, [FromBody] UpdateAppointmentStatusRequest request)
    {
        var result = await _appointmentService.UpdateStatusAsync(appointmentId, request);
        return Ok(result);
    }

    /// <summary>
    /// Hoàn thành phiên tư vấn và lưu sổ tay lâm sàng
    /// </summary>
    [HttpPost("{appointmentId:guid}/complete")]
    public async Task<ActionResult<Result<AppointmentDto>>> CompleteSession(Guid appointmentId, [FromBody] CompleteSessionRequest request)
    {
        var result = await _appointmentService.CompleteSessionAsync(appointmentId, request);
        return Ok(result);
    }
}

[ApiController]
[Route("api/expert")]
[Produces("application/json")]
public class ExpertController : ControllerBase
{
    private readonly IExpertWorkspaceService _expertService;

    public ExpertController(IExpertWorkspaceService expertService)
    {
        _expertService = expertService;
    }

    /// <summary>
    /// Bảng điều khiển Workspace chuyên viên (Thống kê ca trực, nhiệt kế tâm lý toàn trường)
    /// </summary>
    [HttpGet("overview/{expertId:guid}")]
    public async Task<ActionResult<Result<DashboardStatsDto>>> GetOverview(Guid expertId)
    {
        var result = await _expertService.GetWorkspaceOverviewAsync(expertId);
        return Ok(result);
    }

    /// <summary>
    /// Lấy hàng đợi cảnh báo rủi ro NLP Triage (Các bài viết quá tiêu cực cần can thiệp)
    /// </summary>
    [HttpGet("triage-alerts")]
    public async Task<ActionResult<Result<List<NlpRiskAlertDto>>>> GetTriageAlerts()
    {
        var result = await _expertService.GetTriageAlertsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Xử lý can thiệp khẩn cấp (Mở SafeRoom, Gửi thông điệp nâng đỡ, Kích hoạt SOS)
    /// </summary>
    [HttpPost("alerts/{alertId:guid}/resolve/{expertUserId:guid}")]
    public async Task<ActionResult<Result>> ResolveAlert(Guid alertId, Guid expertUserId, [FromBody] ResolveAlertRequest request)
    {
        var result = await _expertService.ResolveAlertAsync(alertId, request, expertUserId);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách từ khóa nhạy cảm
    /// </summary>
    [HttpGet("sensitive-keywords")]
    public async Task<ActionResult<Result<List<SensitiveKeywordDto>>>> GetSensitiveKeywords()
    {
        var result = await _expertService.GetSensitiveKeywordsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Chuyên viên thêm từ khóa nhạy cảm để tự động lọc bài
    /// </summary>
    [HttpPost("sensitive-keywords")]
    public async Task<ActionResult<Result<SensitiveKeywordDto>>> AddSensitiveKeyword([FromBody] AddSensitiveKeywordRequest request)
    {
        var result = await _expertService.AddSensitiveKeywordAsync(request, "Expert");
        return Ok(result);
    }

    /// <summary>
    /// Xóa từ khóa nhạy cảm
    /// </summary>
    [HttpDelete("sensitive-keywords/{keywordId:guid}")]
    public async Task<ActionResult<Result>> RemoveKeyword(Guid keywordId)
    {
        var result = await _expertService.RemoveSensitiveKeywordAsync(keywordId);
        return Ok(result);
    }
    /// <summary>
    /// Báo cáo phân tích chuyên sâu Triage cảnh báo lâm sàng cho Chuyên viên
    /// </summary>
    [HttpGet("analytics")]
    public async Task<ActionResult<Result<ExpertAnalyticsDto>>> GetAnalytics([FromQuery] Guid? expertId = null)
    {
        var targetExpertId = expertId ?? Request.GetUserIdFromRequest();
        var result = await _expertService.GetAnalyticsAsync(targetExpertId);
        return Ok(result);
    }

    /// <summary>
    /// Lấy hồ sơ chuyên viên hiện tại
    /// </summary>
    [HttpGet("profile/{userId:guid}")]
    public async Task<ActionResult<Result<ExpertProfileDto>>> GetExpertProfile(Guid userId)
    {
        var result = await _expertService.GetExpertProfileAsync(userId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("profile")]
    public async Task<ActionResult<Result<ExpertProfileDto>>> GetExpertProfileCurrent([FromQuery] Guid? userId = null)
    {
        var uid = userId ?? Request.GetUserIdFromRequest() ?? Guid.Parse("22222222-2222-2222-2222-222222222221");
        var result = await _expertService.GetExpertProfileAsync(uid);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    /// <summary>
    /// Cập nhật hồ sơ chuyên viên (tên, bio, chuyên môn,...)
    /// </summary>
    [HttpPut("profile/{userId:guid}")]
    public async Task<ActionResult<Result<ExpertProfileDto>>> UpdateExpertProfile(Guid userId, [FromBody] UpdateExpertProfileRequest request)
    {
        var result = await _expertService.UpdateExpertProfileAsync(userId, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("profile")]
    public async Task<ActionResult<Result<ExpertProfileDto>>> UpdateExpertProfileCurrent([FromBody] UpdateExpertProfileRequest request, [FromQuery] Guid? userId = null)
    {
        var uid = userId ?? Request.GetUserIdFromRequest() ?? Guid.Parse("22222222-2222-2222-2222-222222222221");
        var result = await _expertService.UpdateExpertProfileAsync(uid, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

[ApiController]
[Route("api/admin")]
[Produces("application/json")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    /// <summary>
    /// Báo cáo và thống kê toàn hệ thống từ CSDL
    /// </summary>
    [HttpGet("reports")]
    [HttpGet("reports/analytics")]
    public async Task<ActionResult<Result<AdminReportsDto>>> GetReports()
    {
        var result = await _adminService.GetReportsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Nhật ký hoạt động hệ thống từ CSDL
    /// </summary>
    [HttpGet("audit-logs")]
    public async Task<ActionResult<Result<List<AuditLogDto>>>> GetAuditLogs()
    {
        var result = await _adminService.GetAuditLogsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Bảng điều khiển quản trị toàn diện hệ thống (Admin Portal)
    /// </summary>
    [HttpGet("dashboard")]
    [HttpGet("dashboard/stats")]
    public async Task<ActionResult<Result<DashboardStatsDto>>> GetDashboard()
    {
        var result = await _adminService.GetSystemDashboardAsync();
        return Ok(result);
    }

    /// <summary>
    /// Hàng đợi kiểm duyệt bài viết & thảo luận forum (Bài chứa từ khóa nhạy cảm/quá tiêu cực)
    /// </summary>
    [HttpGet("moderation-queue")]
    public async Task<ActionResult<Result<List<PostDto>>>> GetModerationQueue()
    {
        var result = await _adminService.GetModerationQueueAsync();
        return Ok(result);
    }

    /// <summary>
    /// Admin duyệt bài, ẩn bài, xóa bài hoặc kích hoạt can thiệp SOS
    /// </summary>
    [HttpPost("posts/{postId:guid}/moderate/{adminUserId:guid}")]
    public async Task<ActionResult<Result>> ModeratePost(Guid postId, Guid adminUserId, [FromBody] ModeratePostRequest request)
    {
        var result = await _adminService.ModeratePostAsync(postId, request, adminUserId);
        return Ok(result);
    }

    [HttpPost("posts/{postId:guid}/moderate")]
    public async Task<ActionResult<Result>> ModeratePostDefault(Guid postId, [FromBody] ModeratePostRequest request, [FromQuery] Guid? adminId = null)
    {
        var targetAdminId = adminId ?? Request.GetUserIdFromRequest() ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        var result = await _adminService.ModeratePostAsync(postId, request, targetAdminId);
        return Ok(result);
    }

    /// <summary>
    /// Quản lý danh sách toàn bộ người dùng hệ thống
    /// </summary>
    [HttpGet("users")]
    public async Task<ActionResult<Result<List<UserDto>>>> GetAllUsers()
    {
        var result = await _adminService.GetAllUsersAsync();
        return Ok(result);
    }

    /// <summary>
    /// Khóa hoặc mở khóa tài khoản
    /// </summary>
    [HttpPatch("users/{userId:guid}/toggle-status")]
    public async Task<ActionResult<Result>> ToggleUserStatus(Guid userId)
    {
        var result = await _adminService.ToggleUserStatusAsync(userId);
        return Ok(result);
    }

    /// <summary>
    /// Cập nhật vai trò người dùng
    /// </summary>
    [HttpPatch("users/{userId:guid}/role")]
    public async Task<ActionResult<Result<UserDto>>> UpdateUserRole(Guid userId, [FromBody] UpdateUserRoleRequest request)
    {
        var result = await _adminService.UpdateUserRoleAsync(userId, request.Role);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>
    /// Nhật ký hoạt động hệ thống (có phân trang, lọc theo ngày/tháng)
    /// </summary>
    [HttpGet("audit-logs/history")]
    public async Task<ActionResult<Result<AuditLogHistoryResponseDto>>> GetAuditLogHistory(
        [FromQuery] Guid? userId = null,
        [FromQuery] string? date = null,
        [FromQuery] int? month = null,
        [FromQuery] int? year = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _adminService.GetAuditLogHistoryAsync(userId, date, month, year, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Tùy chọn lọc cho Nhật ký - danh sách nhân sự
    /// </summary>
    [HttpGet("audit-logs/filter-options")]
    public async Task<ActionResult<Result<List<AuditLogEmployeeOptionDto>>>> GetAuditLogFilterOptions()
    {
        var result = await _adminService.GetAuditLogFilterOptionsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách từ khóa nhạy cảm
    /// </summary>
    [HttpGet("sensitive-keywords")]
    public async Task<ActionResult<Result<List<SensitiveKeywordDto>>>> GetSensitiveKeywords()
    {
        var result = await _adminService.GetSensitiveKeywordsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Admin thêm từ khóa nhạy cảm để tự động lọc bài
    /// </summary>
    [HttpPost("sensitive-keywords")]
    public async Task<ActionResult<Result<SensitiveKeywordDto>>> AddSensitiveKeyword([FromBody] AddSensitiveKeywordRequest request)
    {
        var result = await _adminService.AddSensitiveKeywordAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Admin xóa từ khóa nhạy cảm
    /// </summary>
    [HttpDelete("sensitive-keywords/{keywordId:guid}")]
    public async Task<ActionResult<Result>> DeleteSensitiveKeyword(Guid keywordId)
    {
        var result = await _adminService.DeleteSensitiveKeywordAsync(keywordId);
        return Ok(result);
    }

    /// <summary>
    /// Thêm chuyên viên tư vấn tâm lý mới
    /// </summary>
    [HttpPost("experts")]
    public async Task<ActionResult<Result<ExpertDto>>> CreateExpert([FromBody] CreateExpertRequest request)
    {
        var result = await _adminService.CreateExpertAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
