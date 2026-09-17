using Microsoft.AspNetCore.Mvc;
using UniMind.Application.Common.Models;
using UniMind.Application.Features;

namespace UniMind.WebAPI.Controllers;

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

    /// <summary>
    /// Lấy danh sách lịch sử nhật ký của sinh viên
    /// </summary>
    [HttpGet("student/{studentId:guid}")]
    public async Task<ActionResult<Result<List<MoodJournalDto>>>> GetStudentJournals(Guid studentId)
    {
        var result = await _journalService.GetStudentJournalsAsync(studentId);
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

    /// <summary>
    /// Lấy hồ sơ tâm lý và kết quả test gần nhất của sinh viên
    /// </summary>
    [HttpGet("student/{studentId:guid}/latest")]
    public async Task<ActionResult<Result<TestResultDto?>>> GetLatestResult(Guid studentId)
    {
        var result = await _testService.GetLatestResultAsync(studentId);
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

    /// <summary>
    /// Gửi bình luận thấu cảm (Bình luận có từ khóa nhạy cảm sẽ bị ẩn với SV nhưng gửi tới Chuyên viên/Admin)
    /// </summary>
    [HttpPost("posts/{postId:guid}/comments/user/{userId:guid}")]
    public async Task<ActionResult<Result<CommentDto>>> AddComment(Guid postId, Guid userId, [FromBody] CreateCommentRequest request, [FromQuery] bool isExpert = false)
    {
        var result = await _communityService.AddCommentAsync(userId, postId, request, isExpert);
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

    /// <summary>
    /// Lấy danh sách lịch hẹn của sinh viên
    /// </summary>
    [HttpGet("student/{studentId:guid}")]
    public async Task<ActionResult<Result<List<AppointmentDto>>>> GetStudentAppointments(Guid studentId)
    {
        var result = await _appointmentService.GetStudentAppointmentsAsync(studentId);
        return Ok(result);
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
    /// Bảng điều khiển quản trị toàn diện hệ thống (Admin Portal)
    /// </summary>
    [HttpGet("dashboard")]
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
