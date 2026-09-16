using UniMind.Application.Common.Interfaces;
using UniMind.Application.Common.Models;
using UniMind.Domain.Entities;
using UniMind.Domain.Enums;

namespace UniMind.Application.Features;

public interface IAuthService
{
    Task<Result<AuthResponse>> LoginAsync(LoginRequest request);
    Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request);
    Task<Result<UserDto>> GetCurrentUserAsync(Guid userId);
}

public interface IMoodJournalService
{
    Task<Result<MoodJournalDto>> CreateJournalAsync(Guid studentId, CreateMoodJournalRequest request);
    Task<Result<List<MoodJournalDto>>> GetStudentJournalsAsync(Guid studentId);
    Task<Result<MoodStatsDto>> GetMoodStatsAsync(Guid studentId);
}

public interface IPsychologicalTestService
{
    Task<Result<List<TestDto>>> GetAvailableTestsAsync();
    Task<Result<TestDetailDto>> GetTestDetailsAsync(Guid testId);
    Task<Result<TestResultDto>> SubmitTestAsync(Guid studentId, SubmitTestRequest request);
    Task<Result<TestResultDto?>> GetLatestResultAsync(Guid studentId);
}

public interface ICommunityService
{
    Task<Result<List<PostDto>>> GetFeedAsync(bool isStaffOrAdmin, string? category = null);
    Task<Result<PostDto>> CreatePostAsync(Guid studentId, CreatePostRequest request);
    Task<Result<CommentDto>> AddCommentAsync(Guid userId, Guid postId, CreateCommentRequest request, bool isExpert);
    Task<Result<PostDto>> ReactAsync(Guid postId, string reactionType);
}

public interface IAppointmentService
{
    Task<Result<List<ExpertDto>>> GetExpertsAsync(string? specialty = null);
    Task<Result<AppointmentDto>> BookAppointmentAsync(Guid studentId, BookAppointmentRequest request);
    Task<Result<List<AppointmentDto>>> GetStudentAppointmentsAsync(Guid studentId);
    Task<Result<List<AppointmentDto>>> GetExpertAppointmentsAsync(Guid expertId);
    Task<Result<AppointmentDto>> UpdateStatusAsync(Guid appointmentId, UpdateAppointmentStatusRequest request);
    Task<Result<AppointmentDto>> CompleteSessionAsync(Guid appointmentId, CompleteSessionRequest request);
}

public interface IExpertWorkspaceService
{
    Task<Result<DashboardStatsDto>> GetWorkspaceOverviewAsync(Guid expertId);
    Task<Result<List<NlpRiskAlertDto>>> GetTriageAlertsAsync();
    Task<Result> ResolveAlertAsync(Guid alertId, ResolveAlertRequest request, Guid expertUserId);
    Task<Result<List<SensitiveKeywordDto>>> GetSensitiveKeywordsAsync();
    Task<Result<SensitiveKeywordDto>> AddSensitiveKeywordAsync(AddSensitiveKeywordRequest request, string addedByRole);
    Task<Result> RemoveSensitiveKeywordAsync(Guid keywordId);
}

public interface IAdminService
{
    Task<Result<DashboardStatsDto>> GetSystemDashboardAsync();
    Task<Result<List<PostDto>>> GetModerationQueueAsync();
    Task<Result> ModeratePostAsync(Guid postId, ModeratePostRequest request, Guid adminUserId);
    Task<Result<List<UserDto>>> GetAllUsersAsync();
    Task<Result> ToggleUserStatusAsync(Guid userId);
    Task<Result<List<SensitiveKeywordDto>>> GetSensitiveKeywordsAsync();
    Task<Result<SensitiveKeywordDto>> AddSensitiveKeywordAsync(AddSensitiveKeywordRequest request);
    Task<Result> DeleteSensitiveKeywordAsync(Guid keywordId);
}
