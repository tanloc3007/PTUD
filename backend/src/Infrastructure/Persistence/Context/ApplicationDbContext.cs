using UniMind.Application.Common.Interfaces;
using UniMind.Domain.Entities;
using UniMind.Domain.Enums;

namespace UniMind.Infrastructure.Persistence.Context;

public class ApplicationDbContext : IApplicationDbContext
{
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

    public ApplicationDbContext()
    {
        SeedInitialData();
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(1);
    }

    private void SeedInitialData()
    {
        // 1. NGƯỜI DÙNG DEMO
        var adminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var studentId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var expHaId = Guid.Parse("33333333-3333-3333-3333-333333333331");
        var expLanId = Guid.Parse("33333333-3333-3333-3333-333333333332");
        var expBaoId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var expTamId = Guid.Parse("33333333-3333-3333-3333-333333333334");

        Users.AddRange(new[]
        {
            new User { Id = adminId, MSSV = "AD001", FullName = "Quản trị viên Nguyễn Văn An", Email = "admin@unimind.edu.vn", Role = UserRole.Admin, Faculty = "Phòng Công tác Sinh viên", AnonymousCode = "Quản trị viên #382", PasswordHash = "123456" },
            new User { Id = studentId, MSSV = "120000212", FullName = "Sinh viên Nguyễn Hoàng An", Email = "sv_an@unimind.edu.vn", Role = UserRole.Student, Faculty = "Khoa Công nghệ Thông tin", AnonymousCode = "Bạn Ẩn Yên #382", PasswordHash = "123456" },
            new User { Id = expHaId, MSSV = "EXP001", FullName = "ThS. Tâm lý Nguyễn Thanh Hà", Email = "ha.nguyen@unimind.edu.vn", Role = UserRole.Expert, Faculty = "Tâm lý Học đường", AnonymousCode = "Chuyên viên Thanh Hà", PasswordHash = "123456" },
            new User { Id = expLanId, MSSV = "EXP002", FullName = "TS. Tâm lý Trần Mai Lan", Email = "lan.tran@unimind.edu.vn", Role = UserRole.Expert, Faculty = "Trị liệu Nhận thức Hành vi", AnonymousCode = "Chuyên viên Mai Lan", PasswordHash = "123456" },
            new User { Id = expBaoId, MSSV = "EXP003", FullName = "ThS. Lê Quốc Bảo", Email = "bao.le@unimind.edu.vn", Role = UserRole.Expert, Faculty = "Định hướng Nghề nghiệp", AnonymousCode = "Chuyên viên Quốc Bảo", PasswordHash = "123456" },
            new User { Id = expTamId, MSSV = "EXP004", FullName = "ThS. Lê Thanh Tâm", Email = "tam.le@unimind.edu.vn", Role = UserRole.Expert, Faculty = "Cấp cứu Khủng hoảng SafeRoom", AnonymousCode = "Chuyên viên Thanh Tâm", PasswordHash = "123456" }
        });

        // 2. CHUYÊN VIÊN
        var expHaTableId = Guid.Parse("44444444-4444-4444-4444-444444444441");
        var expLanTableId = Guid.Parse("44444444-4444-4444-4444-444444444442");
        var expBaoTableId = Guid.Parse("44444444-4444-4444-4444-444444444443");
        var expTamTableId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        Experts.AddRange(new[]
        {
            new Expert { Id = expHaTableId, UserId = expHaId, Title = "ThS. Tâm lý", AcademicDegree = "Thạc sĩ Tâm lý học Lâm sàng ĐHQG • Chứng chỉ Tâm Lý Trị liệu", Specialization = "Áp lực học tập & Đồ án, Trầm cảm", ExperienceYears = 8, RoomLocation = "P.302 (Tầng 3)", Rating = 4.98, TotalConsultations = 1420 },
            new Expert { Id = expLanTableId, UserId = expLanId, Title = "TS. Tâm lý", AcademicDegree = "Tiến sĩ Trị liệu Nhận thức Hành vi (CBT) • Chuyên gia can thiệp", Specialization = "Trầm cảm, Lo âu & Khủng hoảng", ExperienceYears = 11, RoomLocation = "P.302 (Tầng 3)", Rating = 5.0, TotalConsultations = 2100 },
            new Expert { Id = expBaoTableId, UserId = expBaoId, Title = "ThS.", AcademicDegree = "Thạc sĩ Tâm lý Phát triển & Nghề nghiệp", Specialization = "Định hướng tương lai & Nghề nghiệp", ExperienceYears = 6, RoomLocation = "P.302 (Tầng 3)", Rating = 4.95, TotalConsultations = 980 },
            new Expert { Id = expTamTableId, UserId = expTamId, Title = "ThS.", AcademicDegree = "Thạc sĩ Tâm lý Lâm sàng • Cố vấn SafeRoom SOS", Specialization = "Khủng hoảng tâm lý cấp tính, Rối loạn âu lo", ExperienceYears = 9, RoomLocation = "P.305 (Khu B)", Rating = 4.97, TotalConsultations = 1850 }
        });

        // 3. KHUNG GIỜ LỊCH TRỐNG
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var slot1 = Guid.NewGuid();
        var slot2 = Guid.NewGuid();
        var slot3 = Guid.NewGuid();
        var slot4 = Guid.NewGuid();
        var slot5 = Guid.NewGuid();

        TimeSlots.AddRange(new[]
        {
            new TimeSlot { Id = slot1, ExpertId = expHaTableId, SlotDate = today, StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(9, 50), LocationType = LocationType.Physical, RoomName = "P.302 (Tầng 3)", IsBooked = false },
            new TimeSlot { Id = slot2, ExpertId = expHaTableId, SlotDate = today, StartTime = new TimeOnly(14, 0), EndTime = new TimeOnly(14, 50), LocationType = LocationType.Online, RoomName = "SafeRoom E2EE #01", IsBooked = false },
            new TimeSlot { Id = slot3, ExpertId = expLanTableId, SlotDate = today, StartTime = new TimeOnly(14, 0), EndTime = new TimeOnly(14, 50), LocationType = LocationType.Physical, RoomName = "P.302 (Tầng 3)", IsBooked = false },
            new TimeSlot { Id = slot4, ExpertId = expLanTableId, SlotDate = today, StartTime = new TimeOnly(15, 30), EndTime = new TimeOnly(16, 20), LocationType = LocationType.Online, RoomName = "SafeRoom E2EE #02", IsBooked = false },
            new TimeSlot { Id = slot5, ExpertId = expTamTableId, SlotDate = today, StartTime = new TimeOnly(14, 0), EndTime = new TimeOnly(14, 50), LocationType = LocationType.Online, RoomName = "SafeRoom E2EE #04", IsBooked = true }
        });

        // 4. LỊCH HẸN
        Appointments.Add(new Appointment
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            ExpertId = expTamTableId,
            TimeSlotId = slot5,
            BookingCode = "ST-9012",
            AnonymousPseudonym = "Bạn Ẩn Yên #382",
            ConsultationType = LocationType.Online,
            Status = AppointmentStatus.Confirmed,
            ReasonNotes = "Mất ngủ kéo dài 4 đêm, tim đập nhanh mỗi lần mở laptop làm đồ án tốt nghiệp.",
            Dass21Summary = "DASS-21: Trầm cảm (Vừa 16/42) • Lo âu (Nặng 19/42) • Căng thẳng (Ổn 12/42)",
            RiskScore = 88
        });

        // 5. TỪ KHÓA NHẠY CẢM
        SensitiveKeywords.AddRange(new[]
        {
            new SensitiveKeyword { Id = Guid.NewGuid(), Keyword = "tự tử", Category = "SelfHarm", RiskWeight = 99, AddedByRole = "Admin" },
            new SensitiveKeyword { Id = Guid.NewGuid(), Keyword = "nhảy lầu", Category = "SelfHarm", RiskWeight = 99, AddedByRole = "Admin" },
            new SensitiveKeyword { Id = Guid.NewGuid(), Keyword = "rạch tay", Category = "SelfHarm", RiskWeight = 95, AddedByRole = "Expert" },
            new SensitiveKeyword { Id = Guid.NewGuid(), Keyword = "không muốn sống", Category = "SelfHarm", RiskWeight = 90, AddedByRole = "Expert" },
            new SensitiveKeyword { Id = Guid.NewGuid(), Keyword = "uống thuốc ngủ", Category = "SelfHarm", RiskWeight = 92, AddedByRole = "Expert" },
            new SensitiveKeyword { Id = Guid.NewGuid(), Keyword = "mua bán điểm", Category = "AcademicFraud", RiskWeight = 80, AddedByRole = "Admin" },
            new SensitiveKeyword { Id = Guid.NewGuid(), Keyword = "lừa đảo", Category = "Harassment", RiskWeight = 75, AddedByRole = "Admin" },
            new SensitiveKeyword { Id = Guid.NewGuid(), Keyword = "bế tắc cùng cực", Category = "SelfHarm", RiskWeight = 85, AddedByRole = "Expert" }
        });

        // 6. BÀI TEST DASS-21
        var dass21Id = Guid.Parse("55555555-5555-5555-5555-555555555551");
        PsychologicalTests.Add(new PsychologicalTest
        {
            Id = dass21Id,
            Code = "DASS21",
            Title = "Thang Đo DASS-21 Toàn Diện",
            Description = "Đo lường đa tầng 3 chỉ số then chốt: Trầm cảm, Lo âu và Căng thẳng học đường trong cùng 1 phiên.",
            EstimatedMinutes = 5,
            QuestionCount = 21,
            IsPublished = true
        });

        PsychologicalTests.Add(new PsychologicalTest
        {
            Id = Guid.NewGuid(),
            Code = "PHQ9",
            Title = "Thang Đo Trầm Cảm PHQ-9",
            Description = "Tầm soát mức độ buồn bã, mất hứng thú và giấc ngủ theo tiêu chuẩn y khoa.",
            EstimatedMinutes = 3,
            QuestionCount = 9,
            IsPublished = true
        });

        PsychologicalTests.Add(new PsychologicalTest
        {
            Id = Guid.NewGuid(),
            Code = "GAD7",
            Title = "Thang Đo Lo Âu GAD-7",
            Description = "Nhận diện bất an, áp lực trước kỳ thi hoặc định hướng việc làm.",
            EstimatedMinutes = 3,
            QuestionCount = 7,
            IsPublished = true
        });

        PsychologicalTests.Add(new PsychologicalTest
        {
            Id = Guid.NewGuid(),
            Code = "MBISS",
            Title = "Kiệt Sức Đồ Án MBI-SS",
            Description = "Đo lường suy kiệt cảm xúc và mất động lực trong đồ án tốt nghiệp.",
            EstimatedMinutes = 4,
            QuestionCount = 15,
            IsPublished = true
        });

        // CÂU HỎI MẪU DASS-21
        var q1 = new TestQuestion { Id = Guid.NewGuid(), TestId = dass21Id, QuestionNumber = 1, Content = "Tôi thấy khó mà dứt ra khỏi tình trạng căng thẳng", SubscaleCategory = "Stress" };
        var q2 = new TestQuestion { Id = Guid.NewGuid(), TestId = dass21Id, QuestionNumber = 2, Content = "Tôi thấy khô môi hoặc khô miệng khi hồi hộp", SubscaleCategory = "Anxiety" };
        var q3 = new TestQuestion { Id = Guid.NewGuid(), TestId = dass21Id, QuestionNumber = 3, Content = "Tôi không thấy có bất kỳ cảm xúc tích cực nào", SubscaleCategory = "Depression" };
        var q7 = new TestQuestion { Id = Guid.NewGuid(), TestId = dass21Id, QuestionNumber = 7, Content = "Trong suốt 1 tuần qua, bạn cảm thấy khó thư giãn hoặc bồn chồn đứng ngồi không yên đến mức nào?", SubscaleCategory = "Stress" };

        TestQuestions.AddRange(new[] { q1, q2, q3, q7 });

        foreach (var q in new[] { q1, q2, q3, q7 })
        {
            TestOptions.AddRange(new[]
            {
                new TestOption { Id = Guid.NewGuid(), QuestionId = q.Id, OptionOrder = 1, OptionText = "Không đúng với tôi chút nào (Không có triệu chứng)", ScoreValue = 0 },
                new TestOption { Id = Guid.NewGuid(), QuestionId = q.Id, OptionOrder = 2, OptionText = "Đúng với tôi một phần, hoặc thỉnh thoảng (1-2 ngày)", ScoreValue = 1 },
                new TestOption { Id = Guid.NewGuid(), QuestionId = q.Id, OptionOrder = 3, OptionText = "Đúng với tôi phần nhiều, khá thường xuyên (3-5 ngày)", ScoreValue = 2 },
                new TestOption { Id = Guid.NewGuid(), QuestionId = q.Id, OptionOrder = 4, OptionText = "Rất đúng với tôi, hoặc hầu như luôn luôn (Hầu hết thời gian)", ScoreValue = 3 }
            });
        }

        // KẾT QUẢ GẦN NHẤT
        TestResults.Add(new TestResult
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            TestId = dass21Id,
            TotalScore = 26,
            DepressionScore = 4,
            AnxietyScore = 8,
            StressScore = 14,
            ResilienceRate = 62,
            SeverityLevel = "Moderate",
            AiInterpretation = "Mức độ căng thẳng của bạn đang ở ngưỡng trung bình, chủ yếu xuất phát từ áp lực đồ án cuối kỳ. Hệ thần kinh giao cảm của bạn đang cần được nghỉ ngơi hợp lý."
        });

        // 7. BÀI VIẾT CỘNG ĐỒNG
        var post1Id = Guid.Parse("66666666-6666-6666-6666-666666666661");
        var post2Id = Guid.Parse("66666666-6666-6666-6666-666666666662");
        var post3Id = Guid.Parse("66666666-6666-6666-6666-666666666663");
        var postCrisisId = Guid.Parse("66666666-6666-6666-6666-666666666664");

        CommunityPosts.AddRange(new[]
        {
            new CommunityPost
            {
                Id = post1Id,
                StudentId = studentId,
                AnonymousPseudonym = "Cún Mưa Rào #512",
                StudentRoleTag = "Sinh viên năm 4 • Khoa Khoa học Máy tính",
                Content = "Còn đúng 3 tuần nữa là đến hạn bảo vệ đồ án tốt nghiệp, nhưng code vẫn lỗi và thầy hướng dẫn liên tục yêu cầu viết lại phần kiến trúc hệ thống. Cùng lúc đó mình rớt 2 vòng phỏng vấn thực tập liên tiếp. Cảm giác cả người tê dại, 4 đêm nay gần như thức trắng, tim đập nhanh và không muốn tiếp xúc với bất kỳ ai... Có ai từng vượt qua đoạn đường này cho mình xin một tia hy vọng được không? #DoAnTotNghiep #KietsuMuathi #XinLoiKhuyen",
                CategoryTag = "Áp lực học tập",
                StressLevelTag = "Áp lực cao (Stress Level 4/5)",
                HugCount = 94,
                EmpathyCount = 128,
                SentimentLabel = "Negative",
                SentimentScore = -0.65,
                RiskScore = 55,
                IsExtremeCrisis = false,
                IsSensitiveHiddenFromStudents = false,
                ModerationStatus = PostStatus.Approved
            },
            new CommunityPost
            {
                Id = post2Id,
                StudentId = studentId,
                AnonymousPseudonym = "Bồ Công Anh #119",
                StudentRoleTag = "Tân sinh viên K24 • KTX Khu B",
                Content = "Lần đầu tiên sống cách nhà hơn 800 cây số. Phòng trọ 12m2 giữa thành phố đông đúc mà thấy trống trải vô cùng. Chiều nay mẹ gọi hỏi ăn cơm chưa, vừa cúp máy là nước mắt trào ra. Nhìn bạn bè trong lớp ai cũng năng động, bắt nhóm nhanh thoăn thoắt, mình thấy mình lạc lõng như người vô hình vậy...",
                CategoryTag = "Mối quan hệ & Gia đình",
                StressLevelTag = "Mức độ cô đơn (Level 3/5)",
                HugCount = 206,
                EmpathyCount = 87,
                SentimentLabel = "Negative",
                SentimentScore = -0.45,
                RiskScore = 40,
                IsExtremeCrisis = false,
                IsSensitiveHiddenFromStudents = false,
                ModerationStatus = PostStatus.Approved
            },
            new CommunityPost
            {
                Id = post3Id,
                StudentId = studentId,
                AnonymousPseudonym = "Ánh Nắng Sau Mưa #09",
                StudentRoleTag = "Cựu sinh viên đồng hành • Khoa Kinh tế Quốc tế",
                Content = "Từng có kỳ học GPA của mình tụt xuống 1.4 vì trầm cảm kéo dài, chỉ nằm trong phòng kéo rèm tối đen. Hôm nay mình nhận tin đỗ học bổng Thạc sĩ du học. Mình muốn nhắn với các bạn đang vật lộn: Việc bạn vẫn thức dậy sáng nay đã là một dũng khí to lớn rồi. Hãy xin giúp đỡ từ phòng tâm lý trường, đừng gồng gánh một mình. Bầu trời rồi sẽ lại quang đãng! #VuotQuaTramCam #HyVong",
                CategoryTag = "Chia sẻ tích cực",
                StressLevelTag = "Truyền cảm hứng & Chữa lành",
                HugCount = 342,
                EmpathyCount = 198,
                SentimentLabel = "Positive",
                SentimentScore = 0.85,
                RiskScore = 10,
                IsExtremeCrisis = false,
                IsSensitiveHiddenFromStudents = false,
                ModerationStatus = PostStatus.Approved
            },
            // BÀI MANG XU HƯỚNG QUÁ TIÊU CỰC -> THẺ BÁO ĐỘNG ĐỎ CHO ADMIN & EXPERT
            new CommunityPost
            {
                Id = postCrisisId,
                StudentId = studentId,
                AnonymousPseudonym = "Sinh viên Ẩn danh #902",
                StudentRoleTag = "K26 • Khoa Công nghệ Thông tin",
                Content = "Mất ngủ kéo dài cả tuần nay, mình nhìn đâu cũng thấy vô định. Cảm giác mệt mỏi từ do không có điểm dừng, mình chỉ muốn buông bỏ tất cả bài thi và cuộc sống này, không còn lối thoát nào nữa...",
                CategoryTag = "Áp lực học tập",
                StressLevelTag = "Khẩn cấp (94/100)",
                HasKeywordsAlert = true,
                DetectedKeywords = "mất ngủ kéo dài, vô định, buông bỏ, không còn lối thoát",
                SentimentLabel = "ExtremeNegative",
                SentimentScore = -0.95,
                RiskScore = 94,
                IsExtremeCrisis = true,
                IsSensitiveHiddenFromStudents = true, // ẨN KHỎI SINH VIÊN THƯỜNG
                ModerationStatus = PostStatus.Flagged
            }
        });

        // BÌNH LUẬN
        CommunityComments.AddRange(new[]
        {
            new CommunityComment
            {
                Id = Guid.NewGuid(),
                PostId = post1Id,
                UserId = expHaId,
                AuthorPseudonym = "Chuyên viên Tâm An",
                Content = "Em ơi, bộ não đang báo động đỏ vì thiếu ngủ. Hãy tạm dừng 2 tiếng, hít thở sâu và uống một ly nước ấm. Phòng tâm lý luôn sẵn sàng hỗ trợ em gỡ rối từng phần đồ án!",
                IsExpertComment = true,
                ExpertTitle = "Chuyên viên Tâm lý • Đội ngũ UniMind",
                IsSensitiveHiddenFromStudents = false,
                ModerationStatus = PostStatus.Approved
            },
            new CommunityComment
            {
                Id = Guid.NewGuid(),
                PostId = post2Id,
                UserId = studentId,
                AuthorPseudonym = "Keo Bông Gòn #84",
                Content = "K21 nè em ơi, năm đầu ai cũng khóc hết á! Tối mai phòng anh có trà sữa ở nhà ăn, qua giao lưu nhen!",
                IsExpertComment = false,
                IsSensitiveHiddenFromStudents = false,
                ModerationStatus = PostStatus.Approved
            },
            new CommunityComment
            {
                Id = Guid.NewGuid(),
                PostId = post2Id,
                UserId = studentId,
                AuthorPseudonym = "Mây Trôi #88",
                Content = "Cố lên bạn ơi, qua tuần thứ 3 quen nhịp là sẽ thấy giảng đường rất ấm áp!",
                IsExpertComment = false,
                IsSensitiveHiddenFromStudents = false,
                ModerationStatus = PostStatus.Approved
            }
        });

        // CẢNH BÁO NLP CHO CHUYÊN VIÊN & ADMIN
        NlpRiskAlerts.AddRange(new[]
        {
            new NlpRiskAlert
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
            },
            new NlpRiskAlert
            {
                Id = Guid.NewGuid(),
                StudentAnonymousCode = "Sinh viên Ẩn danh #441",
                Faculty = "Khoa Kinh tế Đối ngoại (K27)",
                SnippetContent = "Áp lực đồ án tốt nghiệp cùng kỳ vọng quá lớn từ bố mẹ làm ngực mình đau thắt mỗi khi thức dậy. Không biết phải nói cùng ai...",
                TriggeredKeywords = "đau thắt ngực, kỳ vọng gia đình, áp lực đồ án",
                RiskScore = 78,
                TriageLevel = TriageLevel.High,
                Status = "InIntervention",
                InterventionAction = "Đã gửi tin nhắn nâng đỡ & Giữ slot ưu tiên SafeRoom"
            }
        });

        // NHẬT KÝ CẢM XÚC
        MoodJournals.AddRange(new[]
        {
            new MoodJournal
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
            },
            new MoodJournal
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                MoodState = MoodType.Stressed,
                EnergyLevel = 4,
                Triggers = "Mất ngủ, Áp lực tương lai",
                JournalContent = "Không ngủ được. Nhìn bạn bè ai cũng có giải thưởng hoặc chuẩn bị đi thực tập doanh nghiệp lớn làm mình thấy bản thân chậm chạp.",
                SentimentScore = -0.60,
                SentimentLabel = "Negative",
                AiAdvice = "Có vẻ như bạn đang so sánh bản thân với hành trình của người khác. Mỗi người đều có múi giờ phát triển riêng. Hãy cùng UniMind thực hiện bài tập thở 4-7-8 để đưa nhịp tim về trạng thái thư thái."
            },
            new MoodJournal
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                MoodState = MoodType.Exhausted,
                EnergyLevel = 3,
                Triggers = "Sức khỏe, Deadline dồn",
                JournalContent = "Cả ngày ngồi máy tính 10 tiếng liên tục. Đau mỏi lưng và nhức mắt. Mình đã tự cho phép bản thân đi ngủ sớm lúc 21h30 để lấy lại sức.",
                SentimentScore = -0.40,
                SentimentLabel = "Negative",
                AiAdvice = "Bạn đã có quyết định rất dũng cảm khi chọn nghỉ ngơi thay vì cố gượng. Nghỉ ngơi cũng là một phần quan trọng của hiệu suất làm việc."
            }
        });
    }
}
