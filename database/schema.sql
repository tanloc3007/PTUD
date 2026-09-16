-- ============================================================================
-- UNIMIND DATABASE SCHEMA (SQL SERVER)
-- Dự án: Hệ thống Nhật ký cảm xúc & Hỗ trợ tư vấn tâm lý ẩn danh dành cho sinh viên
-- Học phần: Phát triển ứng dụng (PTUD) - GVHD: ThS. Lê Minh Nhật - ĐH Lạc Hồng
-- Nhóm: Ngô Tấn Lộc (120000212) - Lê Minh Luân (120000352)
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'UniMindDb')
BEGIN
    CREATE DATABASE UniMindDb;
END
GO

USE UniMindDb;
GO

-- 1. BẢNG NGƯỜI DÙNG (USERS)
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
CREATE TABLE dbo.Users (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    MSSV NVARCHAR(50) NULL,                     -- Dành cho sinh viên (bảo mật, không trả ra cộng đồng)
    FullName NVARCHAR(150) NOT NULL,            -- Họ tên thật (hoặc bí danh ban đầu)
    Email NVARCHAR(150) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(30) NOT NULL DEFAULT 'Student', -- Student, Expert, Admin
    Faculty NVARCHAR(100) NULL,                 -- Khoa: CNTT, Kinh tế, Ngoại ngữ, Dược,...
    AvatarUrl NVARCHAR(500) NULL,
    AnonymousCode NVARCHAR(50) NOT NULL,        -- Ví dụ: "Bạn Ẩn Yên #382"
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_Users_Email UNIQUE (Email)
);
GO

-- 2. BẢNG CHUYÊN VIÊN TÂM LÝ (EXPERTS)
IF OBJECT_ID('dbo.Experts', 'U') IS NOT NULL DROP TABLE dbo.Experts;
CREATE TABLE dbo.Experts (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Title NVARCHAR(50) NOT NULL,                -- ThS, TS, BS
    AcademicDegree NVARCHAR(100) NOT NULL,      -- Thạc sĩ Tâm lý học Lâm sàng
    Specialization NVARCHAR(255) NOT NULL,      -- Trầm cảm & Khủng hoảng, Áp lực học đường, CBT
    ExperienceYears INT NOT NULL DEFAULT 5,
    RoomLocation NVARCHAR(100) NOT NULL DEFAULT 'P.302 (Tầng 3)',
    Bio NVARCHAR(MAX) NULL,
    Rating FLOAT NOT NULL DEFAULT 5.0,
    TotalConsultations INT NOT NULL DEFAULT 0,
    IsAvailable BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Experts PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Experts_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE
);
GO

-- 3. BẢNG KHUNG GIỜ / CA TRỰC CHUYÊN GIA (TIME_SLOTS)
IF OBJECT_ID('dbo.TimeSlots', 'U') IS NOT NULL DROP TABLE dbo.TimeSlots;
CREATE TABLE dbo.TimeSlots (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    ExpertId UNIQUEIDENTIFIER NOT NULL,
    SlotDate DATE NOT NULL,
    StartTime TIME(0) NOT NULL,
    EndTime TIME(0) NOT NULL,
    LocationType NVARCHAR(30) NOT NULL DEFAULT 'Physical', -- Physical (Phòng trực tiếp), Online (SafeRoom E2EE)
    RoomName NVARCHAR(100) NOT NULL DEFAULT 'P.302',
    IsBooked BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_TimeSlots PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_TimeSlots_Experts FOREIGN KEY (ExpertId) REFERENCES dbo.Experts(Id) ON DELETE CASCADE
);
GO

-- 4. BẢNG ĐẶT LỊCH HẸN TƯ VẤN (APPOINTMENTS)
-- Có ràng buộc chống trùng lịch (Anti-double-booking)
IF OBJECT_ID('dbo.Appointments', 'U') IS NOT NULL DROP TABLE dbo.Appointments;
CREATE TABLE dbo.Appointments (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    StudentId UNIQUEIDENTIFIER NOT NULL,
    ExpertId UNIQUEIDENTIFIER NOT NULL,
    TimeSlotId UNIQUEIDENTIFIER NOT NULL,
    BookingCode NVARCHAR(30) NOT NULL,          -- Mã tra cứu ẩn danh: ST-8890, ST-9012
    AnonymousPseudonym NVARCHAR(100) NOT NULL,  -- Bí danh hiển thị cho chuyên gia: Mây Trắng #841
    ConsultationType NVARCHAR(30) NOT NULL DEFAULT 'Physical', -- Physical, Online
    Status NVARCHAR(30) NOT NULL DEFAULT 'Pending', -- Pending, Confirmed, Rejected, Completed, Cancelled
    ReasonNotes NVARCHAR(1000) NULL,            -- Lý do tư vấn do sinh viên cung cấp
    RejectionReason NVARCHAR(500) NULL,         -- Lý do từ chối (nếu có)
    ClinicalNotes NVARCHAR(MAX) NULL,           -- Sổ tay ghi chép chuyên môn sau ca tư vấn
    Dass21Summary NVARCHAR(500) NULL,           -- Tóm tắt kết quả trắc nghiệm đầu phiên
    RiskScore INT NOT NULL DEFAULT 0,           -- 0 - 100
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT PK_Appointments PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Appointments_Users FOREIGN KEY (StudentId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Appointments_Experts FOREIGN KEY (ExpertId) REFERENCES dbo.Experts(Id),
    CONSTRAINT FK_Appointments_TimeSlots FOREIGN KEY (TimeSlotId) REFERENCES dbo.TimeSlots(Id),
    CONSTRAINT UQ_Appointments_TimeSlot UNIQUE (TimeSlotId) -- Chống đặt trùng khung giờ
);
GO

-- 5. BẢNG NHẬT KÝ CẢM XÚC (MOOD_JOURNALS)
IF OBJECT_ID('dbo.MoodJournals', 'U') IS NOT NULL DROP TABLE dbo.MoodJournals;
CREATE TABLE dbo.MoodJournals (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    StudentId UNIQUEIDENTIFIER NOT NULL,
    MoodState NVARCHAR(50) NOT NULL,            -- Great (Tuyệt vời), Peaceful (Bình yên), Stressed (Căng thẳng), Exhausted (Mệt mỏi), Sad (Buồn bã)
    EnergyLevel INT NOT NULL DEFAULT 5,         -- 1 đến 10
    Triggers NVARCHAR(500) NULL,                -- Áp lực thi cử, Đồ án tốt nghiệp, Mất ngủ,...
    JournalContent NVARCHAR(MAX) NOT NULL,      -- Lưu trữ bảo mật (chuẩn mã hóa AES-256)
    SentimentScore FLOAT NOT NULL DEFAULT 0.0,  -- Điểm cảm xúc AI: -1.0 (rất tiêu cực) đến +1.0 (rất tích cực)
    SentimentLabel NVARCHAR(50) NOT NULL DEFAULT 'Neutral', -- Positive, Neutral, Negative, Crisis
    AiAdvice NVARCHAR(1000) NULL,               -- Phản hồi thấu cảm & gợi ý hơi thở từ AI
    IsSharedToCommunity BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_MoodJournals PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_MoodJournals_Users FOREIGN KEY (StudentId) REFERENCES dbo.Users(Id) ON DELETE CASCADE
);
GO

-- 6. BẢNG NGÂN HÀNG BÀI TEST TÂM LÝ (PSYCHOLOGICAL_TESTS)
IF OBJECT_ID('dbo.PsychologicalTests', 'U') IS NOT NULL DROP TABLE dbo.PsychologicalTests;
CREATE TABLE dbo.PsychologicalTests (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    Code NVARCHAR(50) NOT NULL,                 -- DASS21, PHQ9, GAD7, MBISS
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    EstimatedMinutes INT NOT NULL DEFAULT 5,
    QuestionCount INT NOT NULL DEFAULT 21,
    IsPublished BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_PsychologicalTests PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_PsychologicalTests_Code UNIQUE (Code)
);
GO

-- 7. BẢNG CÂU HỎI TRẮC NGHIỆM (TEST_QUESTIONS)
IF OBJECT_ID('dbo.TestQuestions', 'U') IS NOT NULL DROP TABLE dbo.TestQuestions;
CREATE TABLE dbo.TestQuestions (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    TestId UNIQUEIDENTIFIER NOT NULL,
    QuestionNumber INT NOT NULL,
    Content NVARCHAR(1000) NOT NULL,
    SubscaleCategory NVARCHAR(50) NOT NULL,     -- Depression, Anxiety, Stress
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_TestQuestions PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_TestQuestions_Tests FOREIGN KEY (TestId) REFERENCES dbo.PsychologicalTests(Id) ON DELETE CASCADE
);
GO

-- 8. BẢNG LỰA CHỌN TRẢ LỜI (TEST_OPTIONS)
IF OBJECT_ID('dbo.TestOptions', 'U') IS NOT NULL DROP TABLE dbo.TestOptions;
CREATE TABLE dbo.TestOptions (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    QuestionId UNIQUEIDENTIFIER NOT NULL,
    OptionOrder INT NOT NULL,
    OptionText NVARCHAR(255) NOT NULL,          -- Không đúng chút nào, Đúng 1 phần, Đúng phần nhiều, Rất đúng
    ScoreValue INT NOT NULL,                    -- 0, 1, 2, 3
    CONSTRAINT PK_TestOptions PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_TestOptions_Questions FOREIGN KEY (QuestionId) REFERENCES dbo.TestQuestions(Id) ON DELETE CASCADE
);
GO

-- 9. BẢNG KẾT QUẢ TEST CỦA SINH VIÊN (TEST_RESULTS)
IF OBJECT_ID('dbo.TestResults', 'U') IS NOT NULL DROP TABLE dbo.TestResults;
CREATE TABLE dbo.TestResults (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    StudentId UNIQUEIDENTIFIER NOT NULL,
    TestId UNIQUEIDENTIFIER NOT NULL,
    TotalScore INT NOT NULL,
    DepressionScore INT NULL,
    AnxietyScore INT NULL,
    StressScore INT NULL,
    ResilienceRate INT NOT NULL DEFAULT 50,     -- Tỷ lệ khả năng phục hồi (%)
    SeverityLevel NVARCHAR(50) NOT NULL,        -- Normal, Mild, Moderate, Severe, ExtremelySevere
    AiInterpretation NVARCHAR(MAX) NULL,        -- Nhận định chuyên gia & AI y khoa UniMind
    CompletedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_TestResults PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_TestResults_Users FOREIGN KEY (StudentId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_TestResults_Tests FOREIGN KEY (TestId) REFERENCES dbo.PsychologicalTests(Id)
);
GO

-- 10. BẢNG TỪ KHÓA NHẠY CẢM ĐỂ TỰ ĐỘNG LỌC BÀI (SENSITIVE_KEYWORDS)
-- Chuyên viên và Admin có thể thêm, sửa, xóa từ khóa
IF OBJECT_ID('dbo.SensitiveKeywords', 'U') IS NOT NULL DROP TABLE dbo.SensitiveKeywords;
CREATE TABLE dbo.SensitiveKeywords (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    Keyword NVARCHAR(100) NOT NULL,             -- Ví dụ: "tự tử", "nhảy lầu", "rạch tay", "mua bán điểm"
    Category NVARCHAR(50) NOT NULL DEFAULT 'SelfHarm', -- SelfHarm, AcademicFraud, Violence, Harassment
    RiskWeight INT NOT NULL DEFAULT 90,         -- Điểm rủi ro: 1 - 100
    AddedByRole NVARCHAR(30) NOT NULL DEFAULT 'Admin', -- Admin, Expert
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_SensitiveKeywords PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_SensitiveKeywords_Keyword UNIQUE (Keyword)
);
GO

-- 11. BẢNG BÀI VIẾT DIỄN ĐÀN ẨN DANH (COMMUNITY_POSTS)
-- Tích hợp AI Sentiment & Phát hiện từ khóa nhạy cảm / Thẻ cảnh báo rủi ro cao
IF OBJECT_ID('dbo.CommunityPosts', 'U') IS NOT NULL DROP TABLE dbo.CommunityPosts;
CREATE TABLE dbo.CommunityPosts (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    StudentId UNIQUEIDENTIFIER NOT NULL,        -- Lưu bảo mật, KHÔNG BAO GIỜ trả về API cộng đồng
    AnonymousPseudonym NVARCHAR(100) NOT NULL,  -- Cú Mèo Say Ngủ #402, Cún Mưa Rào #512
    StudentRoleTag NVARCHAR(100) NOT NULL DEFAULT 'Sinh viên', -- "Sinh viên năm 4 • Khoa CNTT"
    Content NVARCHAR(MAX) NOT NULL,
    CategoryTag NVARCHAR(100) NOT NULL DEFAULT 'Áp lực học tập', -- Áp lực học tập, Mối quan hệ, Việc làm
    StressLevelTag NVARCHAR(100) NULL,          -- Áp lực cao (Stress Level 4/5)
    HasKeywordsAlert BIT NOT NULL DEFAULT 0,    -- 1 nếu chứa từ khóa nhạy cảm
    DetectedKeywords NVARCHAR(500) NULL,        -- Danh sách từ khóa đã kích hoạt
    SentimentLabel NVARCHAR(50) NOT NULL DEFAULT 'Neutral', -- Positive, Neutral, Negative, ExtremeNegative
    SentimentScore FLOAT NOT NULL DEFAULT 0.0,
    RiskScore INT NOT NULL DEFAULT 0,           -- 0 - 100 (Điểm rủi ro do AI chấm)
    IsExtremeCrisis BIT NOT NULL DEFAULT 0,     -- 1: CẦN THẺ BÁO ĐỘNG ĐỎ GIẢI QUYẾT NGAY LẬP TỨC
    IsSensitiveHiddenFromStudents BIT NOT NULL DEFAULT 0, -- 1: Ẩn đối với sinh viên, chỉ Admin/Expert thấy
    ModerationStatus NVARCHAR(30) NOT NULL DEFAULT 'Approved', -- Approved, PendingReview, Flagged, Rejected
    ModeratedBy UNIQUEIDENTIFIER NULL,          -- UserId của Admin hoặc Expert đã duyệt
    HugCount INT NOT NULL DEFAULT 0,
    EmpathyCount INT NOT NULL DEFAULT 0,
    CommentCount INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CommunityPosts PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_CommunityPosts_Users FOREIGN KEY (StudentId) REFERENCES dbo.Users(Id)
);
GO

-- 12. BẢNG BÌNH LUẬN BÀI VIẾT (COMMUNITY_COMMENTS)
-- Bình luận có từ nhạy cảm sẽ bị ẩn với sinh viên nhưng vẫn gửi đến Chuyên viên & Admin
IF OBJECT_ID('dbo.CommunityComments', 'U') IS NOT NULL DROP TABLE dbo.CommunityComments;
CREATE TABLE dbo.CommunityComments (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    PostId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    AuthorPseudonym NVARCHAR(100) NOT NULL,     -- Keo Bông Gòn #84, Mây Trôi #88
    Content NVARCHAR(MAX) NOT NULL,
    IsExpertComment BIT NOT NULL DEFAULT 0,
    ExpertTitle NVARCHAR(150) NULL,             -- "Chuyên viên Tâm An (Đã xác minh)"
    IsSensitiveHiddenFromStudents BIT NOT NULL DEFAULT 0, -- 1: Ẩn đối với sinh viên, hiển thị cho Chuyên viên/Admin
    DetectedKeywords NVARCHAR(255) NULL,
    ModerationStatus NVARCHAR(30) NOT NULL DEFAULT 'Approved', -- Approved, Flagged, Hidden
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CommunityComments PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_CommunityComments_Posts FOREIGN KEY (PostId) REFERENCES dbo.CommunityPosts(Id) ON DELETE CASCADE,
    CONSTRAINT FK_CommunityComments_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
);
GO

-- 13. BẢNG HÀNG ĐỢI CẢNH BÁO NGUY CƠ NLP (NLP_RISK_ALERTS)
-- Dành riêng cho Chuyên viên & Admin để can thiệp các bài viết/sự việc quá tiêu cực
IF OBJECT_ID('dbo.NlpRiskAlerts', 'U') IS NOT NULL DROP TABLE dbo.NlpRiskAlerts;
CREATE TABLE dbo.NlpRiskAlerts (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    PostId UNIQUEIDENTIFIER NULL,
    CommentId UNIQUEIDENTIFIER NULL,
    StudentAnonymousCode NVARCHAR(100) NOT NULL,
    Faculty NVARCHAR(100) NULL,
    SnippetContent NVARCHAR(1000) NOT NULL,
    TriggeredKeywords NVARCHAR(500) NOT NULL,
    RiskScore INT NOT NULL DEFAULT 85,          -- Ví dụ: 94/100
    TriageLevel NVARCHAR(30) NOT NULL DEFAULT 'Urgent', -- Urgent (Báo động Đỏ), High, Moderate, Low
    Status NVARCHAR(30) NOT NULL DEFAULT 'PendingAction', -- PendingAction, InIntervention, Resolved, Dismissed
    InterventionAction NVARCHAR(100) NULL,      -- "Đã mở SafeRoom", "Đã gửi thông điệp nâng đỡ", "Đã kích hoạt SOS"
    ResolvedBy UNIQUEIDENTIFIER NULL,           -- Admin hoặc Expert ID
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_NlpRiskAlerts PRIMARY KEY CLUSTERED (Id)
);
GO

-- 14. BẢNG NHẬT KÝ BẢO MẬT & HỆ THỐNG (AUDIT_LOGS)
IF OBJECT_ID('dbo.AuditLogs', 'U') IS NOT NULL DROP TABLE dbo.AuditLogs;
CREATE TABLE dbo.AuditLogs (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    ActionType NVARCHAR(100) NOT NULL,
    Details NVARCHAR(MAX) NOT NULL,
    ActorRole NVARCHAR(50) NOT NULL,
    ActorId UNIQUEIDENTIFIER NULL,
    IpAddress NVARCHAR(50) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_AuditLogs PRIMARY KEY CLUSTERED (Id)
);
GO

-- TẠO CHỈ MỤC (INDEXES) TỐI ƯU HIỆU NĂNG
CREATE INDEX IX_Appointments_StudentId ON dbo.Appointments(StudentId);
CREATE INDEX IX_Appointments_ExpertId ON dbo.Appointments(ExpertId);
CREATE INDEX IX_Appointments_TimeSlotId ON dbo.Appointments(TimeSlotId);
CREATE INDEX IX_TimeSlots_ExpertId_Date ON dbo.TimeSlots(ExpertId, SlotDate);
CREATE INDEX IX_CommunityPosts_CreatedAt ON dbo.CommunityPosts(CreatedAt DESC);
CREATE INDEX IX_CommunityPosts_ModerationStatus ON dbo.CommunityPosts(ModerationStatus);
CREATE INDEX IX_CommunityComments_PostId ON dbo.CommunityComments(PostId);
CREATE INDEX IX_MoodJournals_StudentId_CreatedAt ON dbo.MoodJournals(StudentId, CreatedAt DESC);
CREATE INDEX IX_NlpRiskAlerts_Status ON dbo.NlpRiskAlerts(Status);
GO
