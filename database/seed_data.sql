-- ============================================================================
-- UNIMIND SEED DATA (SQL SERVER)
-- Dữ liệu mẫu chuẩn hóa bám sát 100% tài liệu và hình ảnh giao diện UniMind
-- ============================================================================

USE UniMindDb;
GO

-- XÓA DỮ LIỆU CŨ NẾU CẦN
DELETE FROM dbo.NlpRiskAlerts;
DELETE FROM dbo.CommunityComments;
DELETE FROM dbo.CommunityPosts;
DELETE FROM dbo.SensitiveKeywords;
DELETE FROM dbo.TestResults;
DELETE FROM dbo.TestOptions;
DELETE FROM dbo.TestQuestions;
DELETE FROM dbo.PsychologicalTests;
DELETE FROM dbo.MoodJournals;
DELETE FROM dbo.Appointments;
DELETE FROM dbo.TimeSlots;
DELETE FROM dbo.Experts;
DELETE FROM dbo.Users;
GO

-- 1. TẠO TÀI KHOẢN NGƯỜI DÙNG
DECLARE @AdminId UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111111111';
DECLARE @StudentDemoId UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222221';
DECLARE @StudentId UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222222';
DECLARE @StudentLocId UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222223';
DECLARE @StudentLuanId UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222224';

DECLARE @ExpertDemoId UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333330';
DECLARE @ExpertHaId UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333331';
DECLARE @ExpertLanId UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333332';
DECLARE @ExpertBaoId UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333333';
DECLARE @ExpertTamId UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333334';
DECLARE @ExpertDucId UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333335';
DECLARE @ExpertLinhId UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333336';

-- Mật khẩu mặc định: 123456 (Hash SHA256 Salt chuẩn & tương thích các mật khẩu demo Student@123, Expert@123, Admin@123)
DECLARE @DefaultPasswordHash NVARCHAR(255) = 'mtXmfX8NeNIfSafuOiEigr4/UOy+8QQ5+puvhkDW3Ho=';

INSERT INTO dbo.Users (Id, MSSV, FullName, Email, PasswordHash, Role, Faculty, AvatarUrl, AnonymousCode, IsActive) VALUES
(@AdminId, 'AD001', N'Quản trị viên Nguyễn Văn An', 'admin@unimind.edu.vn', @DefaultPasswordHash, 'Admin', N'Phòng Công tác Sinh viên', '/assets/avatars/admin.png', N'Quản trị viên #382', 1),
(@StudentDemoId, '120000001', N'Sinh viên Thử Nghiệm', 'student@unimind.edu.vn', @DefaultPasswordHash, 'Student', N'Công nghệ Thông tin', '/assets/avatars/student1.png', N'Bạn Ẩn Yên #101', 1),
(@StudentId, '120000212', N'Sinh viên Nguyễn Hoàng An', 'sv_an@unimind.edu.vn', @DefaultPasswordHash, 'Student', N'Công nghệ Thông tin', '/assets/avatars/student1.png', N'Bạn Ẩn Yên #382', 1),
(@StudentLocId, '120000212', N'Ngô Tấn Lộc', 'loc.ngo@lhu.edu.vn', @DefaultPasswordHash, 'Student', N'Công nghệ Thông tin', '/assets/avatars/student1.png', N'Cú Mèo Say Ngủ #402', 1),
(@StudentLuanId, '120000352', N'Lê Minh Luân', 'luan.le@lhu.edu.vn', @DefaultPasswordHash, 'Student', N'Công nghệ Thông tin', '/assets/avatars/student2.png', N'Sóc Nâu Cần Mẫn #501', 1),
(@ExpertDemoId, 'EXP000', N'Chuyên viên Tư Vấn Mẫu', 'expert@unimind.edu.vn', @DefaultPasswordHash, 'Expert', N'Tâm lý Học đường', '/assets/avatars/expert_ha.png', N'Chuyên viên Tư Vấn', 1),
(@ExpertHaId, 'EXP001', N'ThS. Tâm lý Nguyễn Thanh Hà', 'ha.nguyen@unimind.edu.vn', @DefaultPasswordHash, 'Expert', N'Tâm lý Học đường', '/assets/avatars/expert_ha.png', N'Chuyên viên Tâm Hà', 1),
(@ExpertLanId, 'EXP002', N'TS. Tâm lý Trần Mai Lan', 'lan.tran@unimind.edu.vn', @DefaultPasswordHash, 'Expert', N'Trị liệu Nhận thức', '/assets/avatars/expert_lan.png', N'Chuyên viên Mai Lan', 1),
(@ExpertBaoId, 'EXP003', N'ThS. Lê Quốc Bảo', 'bao.le@unimind.edu.vn', @DefaultPasswordHash, 'Expert', N'Định hướng Nghề nghiệp', '/assets/avatars/expert_bao.png', N'Chuyên viên Quốc Bảo', 1),
(@ExpertTamId, 'EXP004', N'ThS. Lê Thanh Tâm', 'tam.le@unimind.edu.vn', @DefaultPasswordHash, 'Expert', N'Tâm lý Học đường & Cấp cứu SOS', '/assets/avatars/expert_tam.png', N'Chuyên viên Thanh Tâm', 1),
(@ExpertDucId, 'EXP005', N'TS. Trần Minh Đức', 'duc.tran@unimind.edu.vn', @DefaultPasswordHash, 'Expert', N'Tham vấn Gia đình & Khủng hoảng', '/assets/avatars/expert_duc.png', N'Chuyên viên Minh Đức', 1),
(@ExpertLinhId, 'EXP006', N'ThS. Vũ Phương Linh', 'linh.vu@unimind.edu.vn', @DefaultPasswordHash, 'Expert', N'Trị liệu Nhận thức Hành vi (CBT)', '/assets/avatars/expert_linh.png', N'Chuyên viên Phương Linh', 1);

-- 2. TẠO THÔNG TIN CHUYÊN VIÊN
DECLARE @ExpTableDemo UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444440';
DECLARE @ExpTableHa UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444441';
DECLARE @ExpTableLan UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444442';
DECLARE @ExpTableBao UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444443';
DECLARE @ExpTableTam UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444444';
DECLARE @ExpTableDuc UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444445';
DECLARE @ExpTableLinh UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444446';

INSERT INTO dbo.Experts (Id, UserId, Title, AcademicDegree, Specialization, ExperienceYears, RoomLocation, Bio, Rating, TotalConsultations, IsAvailable) VALUES
(@ExpTableDemo, @ExpertDemoId, N'ThS. Tâm lý', N'Thạc sĩ Tâm lý học Lâm sàng ĐHQG', N'Tâm lý Học đường & Định hướng nghề nghiệp', 5, N'P.302 (Tầng 3)', N'Tư vấn và đồng hành cùng sinh viên trong mọi khó khăn học tập và cuộc sống.', 5.00, 100, 1),
(@ExpTableHa, @ExpertHaId, N'ThS. Tâm lý', N'Thạc sĩ Tâm lý học Lâm sàng ĐHQG • Chứng chỉ Tâm Lý Trị liệu', N'Áp lực học tập & Đồ án, Trầm cảm, Lo âu', 8, N'P.302 (Tầng 3)', N'Hơn 8 năm kinh nghiệm hỗ trợ sức khỏe tinh thần thanh thiếu niên và sinh viên đại học.', 4.98, 1420, 1),
(@ExpTableLan, @ExpertLanId, N'TS. Tâm lý', N'Tiến sĩ Trị liệu Nhận thức Hành vi (CBT) • Chuyên gia can thiệp', N'Trầm cảm, Lo âu & Khủng hoảng, Mối quan hệ', 11, N'P.302 (Tầng 3)', N'Chuyên gia cố vấn cấp cao với hơn 11 năm trị liệu nhận thức chuyên sâu.', 5.00, 2100, 1),
(@ExpTableBao, @ExpertBaoId, N'ThS.', N'Thạc sĩ Tâm lý Phát triển & Nghề nghiệp • Cố vấn khủng hoảng', N'Định hướng tương lai & Nghề nghiệp, Áp lực đồng trang lứa', 6, N'P.302 (Tầng 3)', N'Hỗ trợ sinh viên định hướng lộ trình nghề nghiệp và giải quyết bế tắc tâm lý.', 4.95, 980, 1),
(@ExpTableTam, @ExpertTamId, N'ThS.', N'Thạc sĩ Tâm lý Lâm sàng • Cố vấn SafeRoom SOS', N'Khủng hoảng tâm lý cấp tính, Rối loạn lo âu, Mất ngủ', 9, N'P.305 (Khu B)', N'Trực ban cấp cứu tâm lý và điều phối các phiên tư vấn mã hóa 1-1 SafeRoom.', 4.97, 1850, 1),
(@ExpTableDuc, @ExpertDucId, N'TS.', N'Tiến sĩ Tâm lý Học đường', N'Mâu thuẫn gia đình, Áp lực thi cử, Sang chấn tâm lý', 12, N'P.308 (Tầng 3)', N'Kinh nghiệm lâm sàng phong phú trong hòa giải và can thiệp khủng hoảng gia đình.', 4.92, 2300, 1),
(@ExpTableLinh, @ExpertLinhId, N'ThS.', N'Thạc sĩ Trị liệu CBT & Hành vi', N'Rối loạn âu lo, Giấc ngủ & Thiền định', 7, N'P.202 (Khu A)', N'Chuyên gia huấn luyện các kỹ thuật thở 4-7-8 và giảm xung nhịp căng thẳng.', 4.94, 1150, 1);

-- 3. TẠO KHUNG GIỜ LỊCH TRỐNG (TIME SLOTS)
DECLARE @Slot1 UNIQUEIDENTIFIER = NEWID();
DECLARE @Slot2 UNIQUEIDENTIFIER = NEWID();
DECLARE @Slot3 UNIQUEIDENTIFIER = NEWID();
DECLARE @Slot4 UNIQUEIDENTIFIER = NEWID();
DECLARE @Slot5 UNIQUEIDENTIFIER = NEWID();
DECLARE @Slot6 UNIQUEIDENTIFIER = NEWID();
DECLARE @Slot7 UNIQUEIDENTIFIER = NEWID();
DECLARE @Slot8 UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.TimeSlots (Id, ExpertId, SlotDate, StartTime, EndTime, LocationType, RoomName, IsBooked) VALUES
(@Slot1, @ExpTableHa, CAST(GETDATE() AS DATE), '09:00:00', '09:50:00', 'Physical', 'P.302 (Tầng 3)', 0),
(@Slot2, @ExpTableHa, CAST(GETDATE() AS DATE), '14:00:00', '14:50:00', 'Online', 'SafeRoom E2EE #01', 0),
(@Slot3, @ExpTableHa, CAST(DATEADD(DAY, 1, GETDATE()) AS DATE), '10:30:00', '11:20:00', 'Physical', 'P.302 (Tầng 3)', 0),
(@Slot4, @ExpTableHa, CAST(DATEADD(DAY, 2, GETDATE()) AS DATE), '16:00:00', '16:50:00', 'Online', 'SafeRoom E2EE #01', 0),
(@Slot5, @ExpTableLan, CAST(GETDATE() AS DATE), '14:00:00', '14:50:00', 'Physical', 'P.302 (Tầng 3)', 0),
(@Slot6, @ExpTableLan, CAST(GETDATE() AS DATE), '15:30:00', '16:20:00', 'Online', 'SafeRoom E2EE #02', 0),
(@Slot7, @ExpTableBao, CAST(GETDATE() AS DATE), '16:30:00', '17:20:00', 'Physical', 'P.302 (Tầng 3)', 0),
(@Slot8, @ExpTableTam, CAST(GETDATE() AS DATE), '14:00:00', '14:50:00', 'Online', 'SafeRoom E2EE #04', 1);

-- 4. TẠO CÁC CA LỊCH HẸN MẪU
INSERT INTO dbo.Appointments (Id, StudentId, ExpertId, TimeSlotId, BookingCode, AnonymousPseudonym, ConsultationType, Status, ReasonNotes, Dass21Summary, RiskScore) VALUES
(NEWID(), @StudentId, @ExpTableTam, @Slot8, 'ST-9012', N'Bạn Ẩn Yên #382', 'Online', 'Confirmed', N'Mất ngủ kéo dài 4 đêm, tim đập nhanh mỗi lần mở laptop làm đồ án tốt nghiệp.', N'DASS-21: Trầm cảm (Vừa 16/42) • Lo âu (Nặng 19/42) • Căng thẳng (Ổn 12/42)', 88);

-- 5. TỪ KHÓA NHẠY CẢM ĐỂ TỰ ĐỘNG LỌC BÀI VIẾT & BÌNH LUẬN
INSERT INTO dbo.SensitiveKeywords (Keyword, Category, RiskWeight, AddedByRole) VALUES
(N'tự tử', 'SelfHarm', 99, 'Admin'),
(N'nhảy lầu', 'SelfHarm', 99, 'Admin'),
(N'rạch tay', 'SelfHarm', 95, 'Expert'),
(N'không muốn sống', 'SelfHarm', 90, 'Expert'),
(N'uống thuốc ngủ', 'SelfHarm', 92, 'Expert'),
(N'muốn chết', 'SelfHarm', 95, 'Admin'),
(N'bế tắc cùng cực', 'SelfHarm', 85, 'Expert'),
(N'mua bán điểm', 'AcademicFraud', 80, 'Admin'),
(N'lừa đảo', 'Harassment', 75, 'Admin'),
(N'chửi bới', 'Harassment', 65, 'Admin'),
(N'tiêu cực tột cùng', 'SelfHarm', 88, 'Expert');

-- 6. TẠO CÁC BÀI TEST TÂM LÝ CHUẨN Y KHOA
DECLARE @Dass21Id UNIQUEIDENTIFIER = '55555555-5555-5555-5555-555555555551';
DECLARE @Phq9Id UNIQUEIDENTIFIER = '55555555-5555-5555-5555-555555555552';
DECLARE @Gad7Id UNIQUEIDENTIFIER = '55555555-5555-5555-5555-555555555553';
DECLARE @MbiSsId UNIQUEIDENTIFIER = '55555555-5555-5555-5555-555555555554';

INSERT INTO dbo.PsychologicalTests (Id, Code, Title, Description, EstimatedMinutes, QuestionCount) VALUES
(@Dass21Id, 'DASS21', N'Thang Đo DASS-21 Toàn Diện', N'Đo lường đa tầng 3 chỉ số then chốt: Trầm cảm (Depression), Lo âu (Anxiety) và Stress học đường trong cùng 1 phiên test.', 5, 21),
(@Phq9Id, 'PHQ9', N'Thang Đo Trầm Cảm PHQ-9', N'Patient Health Questionnaire: Tầm soát chuyên biệt mức độ buồn bã, mất hứng thú và giấc ngủ.', 3, 9),
(@Gad7Id, 'GAD7', N'Thang Đo Lo Âu GAD-7', N'Generalized Anxiety Disorder: Nhận diện bất an, hồi hộp, áp lực trước kỳ thi hoặc định hướng việc làm.', 3, 7),
(@MbiSsId, 'MBISS', N'Kiệt Sức Đồ Án MBI-SS', N'Đo lường suy kiệt cảm xúc, mất cảm giác thành tựu và thờ ơ với môn học hoặc khóa luận tốt nghiệp.', 4, 15);

-- BỔ SUNG 21 CÂU HỎI CHUẨN CỦA DASS-21
INSERT INTO dbo.TestQuestions (Id, TestId, QuestionNumber, Content, SubscaleCategory) VALUES
(NEWID(), @Dass21Id, 1, N'Tôi thấy khó mà dứt ra khỏi tình trạng căng thẳng', 'Stress'),
(NEWID(), @Dass21Id, 2, N'Tôi thấy khô môi hoặc khô miệng khi hồi hộp', 'Anxiety'),
(NEWID(), @Dass21Id, 3, N'Tôi không thấy có bất kỳ cảm xúc tích cực nào', 'Depression'),
(NEWID(), @Dass21Id, 4, N'Tôi bị khó thở (ví dụ: thở gấp, hụt hơi dù không gắng sức)', 'Anxiety'),
(NEWID(), @Dass21Id, 5, N'Tôi thấy khó bắt tay vào làm việc gì đó', 'Depression'),
(NEWID(), @Dass21Id, 6, N'Tôi có xu hướng phản ứng thái quá với các tình huống', 'Stress'),
(NEWID(), @Dass21Id, 7, N'Trong suốt 1 tuần qua, bạn cảm thấy khó thư giãn hoặc bồn chồn đứng ngồi không yên đến mức nào?', 'Stress'),
(NEWID(), @Dass21Id, 8, N'Tôi cảm thấy lo lắng nhiều và dễ hoảng sợ', 'Anxiety'),
(NEWID(), @Dass21Id, 9, N'Tôi cảm thấy không có gì để hào hứng mong đợi ở tương lai', 'Depression'),
(NEWID(), @Dass21Id, 10, N'Tôi thấy mình bực bội, khó chịu khi bị ngắt quãng công việc', 'Stress'),
(NEWID(), @Dass21Id, 11, N'Tôi thấy mình dễ bị xúc động hoặc rơi nước mắt', 'Depression'),
(NEWID(), @Dass21Id, 12, N'Tôi cảm thấy mình hao tổn rất nhiều năng lượng tinh thần', 'Stress'),
(NEWID(), @Dass21Id, 13, N'Tôi cảm thấy buồn nản và u sầu', 'Depression'),
(NEWID(), @Dass21Id, 14, N'Tôi thấy sốt ruột khi việc gì đó bị chậm trễ', 'Stress'),
(NEWID(), @Dass21Id, 15, N'Tôi cảm thấy gần như hoảng loạn hoặc tim đập thình thịch', 'Anxiety'),
(NEWID(), @Dass21Id, 16, N'Tôi không thể cảm thấy nhiệt tình với bất cứ việc gì', 'Depression'),
(NEWID(), @Dass21Id, 17, N'Tôi cảm thấy mình không có giá trị với tư cách là một con người', 'Depression'),
(NEWID(), @Dass21Id, 18, N'Tôi cảm thấy mình khá dễ nổi cáu', 'Stress'),
(NEWID(), @Dass21Id, 19, N'Tôi nhận thấy tim mình đập nhanh hoặc loạn nhịp dù không tập thể dục', 'Anxiety'),
(NEWID(), @Dass21Id, 20, N'Tôi cảm thấy sợ hãi vô cớ mà không hiểu nguyên do', 'Anxiety'),
(NEWID(), @Dass21Id, 21, N'Tôi cảm thấy cuộc sống dường như vô nghĩa', 'Depression');

-- CÁC LỰA CHỌN TRẢ LỜI CỦA BÀI TEST
-- Áp dụng bảng điểm chuẩn: 0: Không đúng chút nào, 1: Đúng một phần, 2: Đúng phần nhiều, 3: Rất đúng
INSERT INTO dbo.TestOptions (Id, QuestionId, OptionOrder, OptionText, ScoreValue)
SELECT NEWID(), q.Id, 1, N'Không đúng với tôi chút nào (Không trải qua triệu chứng trong 7 ngày)', 0 FROM dbo.TestQuestions q WHERE q.TestId = @Dass21Id
UNION ALL
SELECT NEWID(), q.Id, 2, N'Đúng với tôi một phần, hoặc thỉnh thoảng (Xảy ra từ 1 đến 2 ngày)', 1 FROM dbo.TestQuestions q WHERE q.TestId = @Dass21Id
UNION ALL
SELECT NEWID(), q.Id, 3, N'Đúng với tôi phần nhiều, hoặc khá thường xuyên (Xảy ra khoảng 3 đến 5 ngày)', 2 FROM dbo.TestQuestions q WHERE q.TestId = @Dass21Id
UNION ALL
SELECT NEWID(), q.Id, 4, N'Rất đúng với tôi, hoặc hầu như luôn luôn (Cảm giác chi phối hầu hết thời gian)', 3 FROM dbo.TestQuestions q WHERE q.TestId = @Dass21Id;

-- 7. TẠO KẾT QUẢ TEST GẦN NHẤT CỦA SINH VIÊN
INSERT INTO dbo.TestResults (Id, StudentId, TestId, TotalScore, DepressionScore, AnxietyScore, StressScore, ResilienceRate, SeverityLevel, AiInterpretation) VALUES
(NEWID(), @StudentId, @Dass21Id, 26, 4, 8, 14, 62, 'Moderate', N'Mức độ căng thẳng của bạn đang ở ngưỡng trung bình, chủ yếu xuất phát từ áp lực đồ án cuối kỳ. Hệ thần kinh giao cảm của bạn đang cần được nghỉ ngơi hợp lý để tránh chuyển dịch sang tình trạng lo âu kéo dài.');

-- 8. TẠO BÀI VIẾT CỘNG ĐỒNG ẨN DANH & BÌNH LUẬN
DECLARE @Post1Id UNIQUEIDENTIFIER = '66666666-6666-6666-6666-666666666661';
DECLARE @Post2Id UNIQUEIDENTIFIER = '66666666-6666-6666-6666-666666666662';
DECLARE @Post3Id UNIQUEIDENTIFIER = '66666666-6666-6666-6666-666666666663';
DECLARE @PostCrisisId UNIQUEIDENTIFIER = '66666666-6666-6666-6666-666666666664';
DECLARE @PostSpamId UNIQUEIDENTIFIER = '66666666-6666-6666-6666-666666666665';

INSERT INTO dbo.CommunityPosts (Id, StudentId, AnonymousPseudonym, StudentRoleTag, Content, CategoryTag, StressLevelTag, HasKeywordsAlert, DetectedKeywords, SentimentLabel, SentimentScore, RiskScore, IsExtremeCrisis, IsSensitiveHiddenFromStudents, ModerationStatus, HugCount, EmpathyCount, CommentCount) VALUES
(@Post1Id, @StudentId, N'Cún Mưa Rào #512', N'Sinh viên năm 4 • Khoa Khoa học Máy tính', N'Còn đúng 3 tuần nữa là đến hạn bảo vệ đồ án tốt nghiệp, nhưng code vẫn lỗi và thầy hướng dẫn liên tục yêu cầu viết lại phần kiến trúc hệ thống. Cùng lúc đó mình rớt 2 vòng phỏng vấn thực tập liên tiếp. Cảm giác cả người tê dại, 4 đêm nay gần như thức trắng, tim đập nhanh và không muốn tiếp xúc với bất kỳ ai... Có ai từng vượt qua đoạn đường này cho mình xin một tia hy vọng được không? #DoAnTotNghiep #KietsuMuathi #XinLoiKhuyen', N'Áp lực học tập', N'Áp lực cao (Stress Level 4/5)', 0, NULL, 'Negative', -0.65, 55, 0, 0, 'Approved', 94, 128, 23),
(@Post2Id, @StudentId, N'Bồ Công Anh #119', N'Tân sinh viên K24 • Ký túc xá Khu B', N'Lần đầu tiên sống cách nhà hơn 800 cây số. Phòng trọ 12m2 giữa thành phố đông đúc mà thấy trống trải vô cùng. Chiều nay mẹ gọi hỏi ăn cơm chưa, vừa cúp máy là nước mắt trào ra. Nhìn bạn bè trong lớp ai cũng năng động, bắt nhóm nhanh thoăn thoắt, mình thấy mình lạc lõng như người vô hình vậy...', N'Mối quan hệ & Gia đình', N'Mức độ cô đơn (Level 3/5)', 0, NULL, 'Negative', -0.45, 40, 0, 0, 'Approved', 206, 87, 41),
(@Post3Id, @StudentId, N'Ánh Nắng Sau Mưa #09', N'Cựu sinh viên đồng hành • Khoa Kinh tế Quốc tế', N'Từng có kỳ học GPA của mình tụt xuống 1.4 vì trầm cảm kéo dài, chỉ nằm trong phòng kéo rèm tối đen. Hôm nay mình nhận tin đỗ học bổng Thạc sĩ du học. Mình muốn nhắn với các bạn đang vật lộn: Việc bạn vẫn thức dậy sáng nay đã là một dũng khí to lớn rồi. Hãy xin giúp đỡ từ phòng tâm lý trường, đừng gồng gánh một mình. Bầu trời rồi sẽ lại quang đãng! #VuotQuaTramCam #HyVong', N'Chia sẻ tích cực', N'Truyền cảm hứng & Chữa lành', 0, NULL, 'Positive', 0.85, 10, 0, 0, 'Approved', 342, 198, 56),
-- BÀI CÓ XU HƯỚNG QUÁ TIÊU CỰC -> CÓ THẺ BÁO ĐỘNG ĐỎ CHO ADMIN & CHUYÊN VIÊN
(@PostCrisisId, @StudentId, N'Sinh viên Ẩn danh #902', N'K26 • Khoa Công nghệ Thông tin', N'Mất ngủ kéo dài cả tuần nay, mình nhìn đâu cũng thấy vô định. Cảm giác mệt mỏi từ do không có điểm dừng, mình chỉ muốn buông bỏ tất cả bài thi và cuộc sống này, không còn lối thoát nào nữa...', N'Áp lực học tập', N'Khẩn cấp (94/100)', 1, N'mất ngủ kéo dài, vô định, buông bỏ, không còn lối thoát', 'ExtremeNegative', -0.95, 94, 1, 1, 'Flagged', 12, 15, 2),
-- BÀI VI PHẠM SPAM / TỪ KHÓA CẤM
(@PostSpamId, @StudentId, N'Sinh viên ẩn danh #1108', N'Khoa Kinh tế Đối ngoại', N'Ai đang hoang mang vì điểm TOEIC không đủ ra trường thì inbox Zalo 0987.xxx.xxx nhận bộ tài liệu VIP bao đỗ 850+ nhé, khóa học mua bán điểm cấp tốc...', N'Việc làm & Tài chính', N'Spam dịch vụ', 1, N'mua bán điểm', 'Negative', -0.50, 70, 0, 1, 'Flagged', 0, 0, 0);

-- BÌNH LUẬN TRONG BÀI VIẾT
INSERT INTO dbo.CommunityComments (Id, PostId, UserId, AuthorPseudonym, Content, IsExpertComment, ExpertTitle, IsSensitiveHiddenFromStudents, ModerationStatus) VALUES
(NEWID(), @Post1Id, @ExpertHaId, N'Chuyên viên Tâm An', N'Em ơi, bộ não đang báo động đỏ vì thiếu ngủ. Hãy tạm dừng 2 tiếng, hít thở sâu và uống một ly nước ấm. Phòng tâm lý luôn sẵn sàng hỗ trợ em gỡ rối từng phần đồ án!', 1, N'Chuyên viên Tâm lý • Đội ngũ UniMind', 0, 'Approved'),
(NEWID(), @Post2Id, @StudentId, N'Keo Bông Gòn #84', N'K21 nè em ơi, năm đầu ai cũng khóc hết á! Tối mai phòng anh có trà sữa ở nhà ăn, qua giao lưu nhen!', 0, NULL, 0, 'Approved'),
(NEWID(), @Post2Id, @StudentId, N'Mây Trôi #88', N'Cố lên bạn ơi, qua tuần thứ 3 quen nhịp là sẽ thấy giảng đường rất ấm áp!', 0, NULL, 0, 'Approved');

-- 9. TẠO HÀNG ĐỢI CẢNH BÁO NGUY CƠ CAO (NLP RISK ALERTS)
-- Cho Chuyên viên và Admin giải quyết ngay
INSERT INTO dbo.NlpRiskAlerts (Id, PostId, StudentAnonymousCode, Faculty, SnippetContent, TriggeredKeywords, RiskScore, TriageLevel, Status, InterventionAction) VALUES
(NEWID(), @PostCrisisId, N'Sinh viên Ẩn danh #902', N'Khoa CNTT (K26)', N'Mất ngủ kéo dài cả tuần nay, mình nhìn đâu cũng thấy vô định... chỉ muốn buông bỏ tất cả bài thi và cuộc sống này...', N'mất ngủ kéo dài, vô định, buông bỏ', 94, 'Urgent', 'PendingAction', NULL),
(NEWID(), NULL, N'Sinh viên Ẩn danh #441', N'Khoa Kinh tế Đối ngoại (K27)', N'Áp lực đồ án tốt nghiệp cùng kỳ vọng quá lớn từ bố mẹ làm ngực mình đau thắt mỗi khi thức dậy. Không biết phải nói cùng ai...', N'đau thắt ngực, kỳ vọng gia đình, áp lực đồ án', 78, 'High', 'InIntervention', N'Đã gửi tin nhắn nâng đỡ & Giữ slot ưu tiên SafeRoom');

-- 10. TẠO NHẬT KÝ CẢM XÚC 7 NGÀY MẪU CHO BẠN ẨN YÊN #382
INSERT INTO dbo.MoodJournals (Id, StudentId, MoodState, EnergyLevel, Triggers, JournalContent, SentimentScore, SentimentLabel, AiAdvice) VALUES
(NEWID(), @StudentId, 'Peaceful', 7, N'Đồ án tốt nghiệp, Bạn bè', N'Hôm nay mình đã nộp xong bản phác thảo chương 2 đồ án. Thầy hướng dẫn góp ý khá tích cực nên cảm giác tảng đá trong lòng được nhấc bớt.', 0.70, 'Positive', N'Rất vui vì bạn đã có một ngày giải tỏa áp lực. Hãy duy trì thói quen ngủ sớm trước 23h đêm nay nhé!'),
(NEWID(), @StudentId, 'Stressed', 4, N'Mất ngủ, Áp lực tương lai', N'Không ngủ được. Nhìn bạn bè ai cũng có giải thưởng hoặc chuẩn bị đi thực tập doanh nghiệp lớn làm mình thấy bản thân chậm chạp.', -0.60, 'Negative', N'Có vẻ như bạn đang so sánh bản thân với hành trình của người khác. Mỗi người đều có múi giờ phát triển riêng. Hãy cùng UniMind thực hiện bài tập thở 4-7-8 để đưa nhịp tim về trạng thái thư thái.'),
(NEWID(), @StudentId, 'Exhausted', 3, N'Sức khỏe, Deadline dồn', N'Cả ngày ngồi máy tính 10 tiếng liên tục. Đau mỏi lưng và nhức mắt. Mình đã tự cho phép bản thân đi ngủ sớm lúc 21h30 để lấy lại sức.', -0.40, 'Negative', N'Bạn đã có quyết định rất dũng cảm khi chọn nghỉ ngơi thay vì cố gượng. Nghỉ ngơi cũng là một phần quan trọng của hiệu suất làm việc.');
GO
