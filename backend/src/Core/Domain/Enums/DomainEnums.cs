namespace UniMind.Domain.Enums;

public enum UserRole
{
    Student,
    Expert,
    Admin
}

public enum AppointmentStatus
{
    Pending,
    Confirmed,
    Rejected,
    Completed,
    Cancelled
}

public enum LocationType
{
    Physical,
    Online
}

public enum MoodType
{
    Great,
    Peaceful,
    Stressed,
    Exhausted,
    Sad
}

public enum PostStatus
{
    Approved,
    PendingReview,
    Flagged,
    Rejected,
    Hidden
}

public enum TriageLevel
{
    Urgent,
    High,
    Moderate,
    Low
}

public enum ImageModerationStatus
{
    None,
    Pending,
    Approved,
    Flagged,
    Rejected
}

public enum ConsultationNeedLevel
{
    Stable,       // Bình thường, tự cân bằng tốt
    Recommended,  // Khuyến nghị tham vấn (Moderate distress)
    Urgent        // Cần can thiệp tư vấn khẩn cấp (Severe / Crisis)
}
