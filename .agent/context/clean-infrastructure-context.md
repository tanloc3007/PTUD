# Clean Infrastructure Context - Bối Cảnh Kiến Trúc Tầng Hạ Tầng

Tài liệu này lưu trữ ngữ cảnh kiến trúc và các quyết định kỹ thuật của tầng **Infrastructure** trong hệ thống tư vấn tâm lý học đường UniMind.

---

## 1. Thông Số Công Nghệ & Hạ Tầng
- **Framework nền tảng**: .NET 8 Web API (C# 12)
- **Database**: Microsoft SQL Server
- **ORM Chính**: Entity Framework Core 8
- **ORM Bổ trợ (cho truy vấn thống kê nặng/Analytics)**: Dapper (tùy chọn cho các báo cáo aggregation lớn)
- **Bảo mật & Chứng thực**: JWT (JSON Web Token), BCrypt Password Hashing
- **External AI Integration**: Google Gemini API / HuggingFace Transformers API phân tích tâm lý & sắc thái văn bản
- **Mail Gateway**: SMTP / SendGrid API gửi email xác nhận đặt lịch hẹn

---

## 2. Các Ranh Giới Trách Nhiệm (Architectural Boundaries)
1. **Application Interface Contract**:
   - `IApplicationDbContext`: Cung cấp `DbSet<T>` và phương thức `SaveChangesAsync` cho tầng Application.
   - `IAISentimentService`: Cung cấp hàm `AnalyzeMoodAsync(string text, CancellationToken ct)`.
   - `IJwtTokenGenerator`: Cung cấp hàm `GenerateToken(User user)`.
   - `IPasswordHasher`: Cung cấp hàm `HashPassword(string password)` và `Verify(string password, string hash)`.
   - `IEmailService`: Cung cấp hàm `SendAppointmentConfirmationAsync(...)`.

2. **Dữ Liệu Nhạy Cảm & Bảo Mật Ẩn Danh**:
   - Tầng Infrastructure cấu hình các bảng `AnonymousPosts` và `AnonymousComments` liên kết với `Users` qua khóa ngoại nhưng **KHÔNG BAO GIỜ** được join trả về thông tin định danh người dùng (MSSV, Họ tên, Email) lên các DTO của cộng đồng.
   - Dữ liệu nhật ký cảm xúc cá nhân (`MoodJournals`) được cô lập nghiêm ngặt theo `UserId`.

3. **Chiến Lược Đánh Chỉ Mục (Indexing Strategy)**:
   - `Appointments`: Index kép `(ExpertId, AppointmentDate, TimeSlot)` duy nhất (Unique Filtered Index) để loại trừ triệt để tình trạng Double Booking ở mức Database Engine.
   - `MoodJournals`: Composite Index `(UserId, CreatedAt DESC)` hỗ trợ vẽ biểu đồ cảm xúc nhanh chóng.
   - `AnonymousPosts`: Index `(CreatedAt DESC)` và `(RiskScore DESC)` để tối ưu feed cộng đồng và danh sách duyệt triage của chuyên gia.
