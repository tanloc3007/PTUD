# 🏗️ KIẾN TRÚC HỆ THỐNG & ĐẶC TẢ KỸ THUẬT (TECHNICAL SPECIFICATIONS)
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Trường Đại học Lạc Hồng** — Môn: Phát triển Ứng dụng (PTUD)  
**Nhóm tác giả:** Ngô Tấn Lộc (120000212) & Lê Minh Luân (120000352)

---

## 1. Kiến trúc Clean Architecture (Backend .NET 8)

Hệ thống được xây dựng theo mô hình **Clean Architecture 4 tầng** nghiêm ngặt:

```
                  ┌─────────────────────────────────────┐
                  │    Presentation (WebAPI + UI)       │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │          Infrastructure             │
                  │  (EF Core, SQL Server, JWT, Log)    │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │             Application             │
                  │  (MediatR CQRS, DTOs, Validators)   │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │               Domain                │
                  │   (Entities, Enums, Exceptions)     │
                  └─────────────────────────────────────┘
```

### Chi tiết các tầng:
1. **Core / Domain:**
   - Hoàn toàn độc lập, không phụ thuộc vào bất kỳ thư viện bên ngoài hay cơ sở dữ liệu.
   - Chứa các Thực thể (Entities): `User`, `Student`, `Expert`, `JournalEntry`, `CommunityPost`, `Comment`, `Appointment`, `PsychologicalTest`, `TestResult`, `SensitiveKeyword`, `AuditLog`.
   - Chứa các Enums: `Role`, `AppointmentStatus`, `MoodType`, `SeverityLevel`, `AuditAction`.

2. **Core / Application:**
   - Chứa logic nghiệp vụ ứng dụng sử dụng mô hình **CQRS (Command Query Responsibility Segregation)** kết hợp thư viện **MediatR**.
   - Chứa các Interface trừu tượng hóa hạ tầng: `IApplicationDbContext`, `IIdentityService`, `ISentimentAnalysisService`, `ICurrentUserService`.
   - Xác thực dữ liệu đầu vào bằng `FluentValidation`.
   - Trả kết quả thống nhất qua `Result<T>` và `PaginatedList<T>`. Tuyệt đối không để lộ thực thể Domain ra ngoài API (Mapping qua DTOs).

3. **Infrastructure:**
   - Hiện thực các Interface từ Application: `ApplicationDbContext` (Entity Framework Core kết nối SQL Server).
   - Dịch vụ xác thực JWT Token, Password Hash (BCrypt/Argon2), dịch vụ ghi nhật ký (Serilog/AuditLogService).

4. **Presentation / WebAPI:**
   - Các API Controllers mỏng (Thin Controllers), chỉ nhận HTTP Request, chuyển sang MediatR Mediator và trả về HTTP Response.
   - Tích hợp Swagger / OpenAPI UI để kiểm thử API tương tác.
   - Global Exception Handling Middleware tự động bắt và định dạng lỗi theo chuẩn RFC 7807 (ProblemDetails).

---

## 2. Mô hình Cơ sở Dữ liệu (Database Schema)

### Các bảng chính:
- **`Users`**: `Id`, `Email`, `PasswordHash`, `FullName`, `Role` (Student/Expert/Admin), `CreatedAt`, `IsActive`.
- **`Students`**: `Id`, `UserId`, `StudentCode`, `Faculty`, `AcademicYear`, `AnonymousAlias`, `EmergencyContact`.
- **`Experts`**: `Id`, `UserId`, `Title`, `Specialization`, `Bio`, `OfficeLocation`, `Rating`, `HourlyRate`.
- **`JournalEntries`**: `Id`, `StudentId`, `Title`, `Content`, `MoodRating` (1-10), `MoodTag`, `SentimentScore`, `IsPrivate`, `CreatedAt`.
- **`CommunityPosts`**: `Id`, `StudentId` (ẩn danh), `AnonymousNickname`, `Content`, `LikeCount`, `Status` (Approved/Pending/Hidden), `CreatedAt`.
- **`Comments`**: `Id`, `PostId`, `AuthorNickname`, `Content`, `CreatedAt`.
- **`Appointments`**: `Id`, `StudentId`, `ExpertId`, `AppointmentDate`, `StartTime`, `EndTime`, `Format` (Online/InPerson), `Status` (Pending/Approved/Rejected/Completed), `Notes`, `MeetingLink`, `ClinicalSummary`.
- **`PsychologicalTests`**: `Id`, `TestCode` (DASS-21), `Title`, `Description`, `TotalQuestions`.
- **`TestResults`**: `Id`, `StudentId`, `TestId`, `DepressionScore`, `AnxietyScore`, `StressScore`, `SeverityLabel`, `CreatedAt`.
- **`SensitiveKeywords`**: `Id`, `Word`, `SeverityLevel`, `ActionType`, `CreatedAt`.
- **`AuditLogs`**: `Id`, `UserId`, `Action`, `TargetEntity`, `EntityId`, `OldValue`, `NewValue`, `IpAddress`, `Status`, `CreatedAt`.

---

## 3. Danh mục API Endpoints cốt lõi

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Đăng nhập & cấp phát JWT Access Token + Refresh Token.
- `POST /api/auth/register` — Đăng ký tài khoản sinh viên.
- `GET /api/auth/me` — Lấy thông tin tài khoản hiện tại.
- `POST /api/auth/logout` — Đăng xuất & thu hồi token.

### Nhật ký Cảm xúc (`/api/journal`)
- `GET /api/journal` — Lấy danh sách nhật ký của sinh viên hiện tại.
- `POST /api/journal` — Tạo mới bài nhật ký (kèm phân tích AI Sentiment).
- `GET /api/journal/{id}` — Xem chi tiết bài nhật ký.
- `PUT /api/journal/{id}` — Cập nhật bài nhật ký.
- `DELETE /api/journal/{id}` — Xóa bài nhật ký.

### Góc Cộng đồng Ẩn danh (`/api/community`)
- `GET /api/community/posts` — Lấy danh sách bài viết đã duyệt.
- `POST /api/community/posts` — Đăng bài tâm sự ẩn danh.
- `POST /api/community/posts/{id}/like` — Thả tim / tương tác bài viết.
- `POST /api/community/posts/{id}/comments` — Gửi bình luận động viên ẩn danh.
- `POST /api/community/posts/{id}/report` — Báo cáo bài viết vi phạm.

### Đặt lịch Tư vấn & Tham vấn (`/api/appointments`)
- `GET /api/appointments/student` — Lấy lịch hẹn của sinh viên.
- `GET /api/appointments/expert` — Lấy lịch hẹn gửi đến chuyên viên.
- `POST /api/appointments/book` — Đặt lịch hẹn mới (Có kiểm tra chống trùng ca).
- `PUT /api/appointments/{id}/status` — Chuyên viên duyệt (`Approve`) hoặc từ chối (`Reject`) ca hẹn.
- `POST /api/appointments/{id}/room` — Mở phòng tham vấn trực tuyến SafeRoom.

### Trắc nghiệm Tâm lý (`/api/tests`)
- `GET /api/tests` — Lấy danh sách bài test khả dụng.
- `GET /api/tests/{id}` — Lấy chi tiết bộ câu hỏi DASS-21.
- `POST /api/tests/{id}/submit` — Nộp bài test và nhận kết quả phân tích.

### Quản trị & Giám sát (`/api/admin`)
- `GET /api/admin/users` — Quản lý danh sách người dùng.
- `PUT /api/admin/users/{id}/status` — Khóa / mở khóa tài khoản.
- `GET /api/admin/reports` — Thống kê tổng hợp số liệu CSDL.
- `GET /api/admin/keywords` — Quản lý từ khóa nhạy cảm.
- `GET /api/admin/audit-logs` — Truy vấn nhật ký hệ thống.

---

## 4. Cơ chế Bảo mật & Ẩn danh (Security & Privacy Protocol)
1. **Ẩn danh hóa dữ liệu (Pseudonymization):**
   - Không truyền bất kỳ thông tin nhận diện nào (Họ tên, MSSV, Email) trong các API của Góc chia sẻ cộng đồng.
   - Tên hiển thị được tạo ngẫu nhiên hoặc do sinh viên tự đặt bí danh an toàn.
2. **Kiểm soát phân quyền theo vai trò (Role-Based Access Control - RBAC):**
   - Xác thực qua JWT Bearer Token, kiểm tra Claim `Role` tại từng endpoint (`[Authorize(Roles = "Admin,Expert")]`).
3. **Phòng chống tấn công phổ biến:**
   - Chống SQL Injection bằng Parameterized Queries trong EF Core.
   - Chống XSS bằng việc khử khuẩn mã HTML đầu vào (Sanitize input).
   - Chống CSRF & cấu hình CORS chặt chẽ cho phép giao tiếp giữa Frontend Vite và Backend WebAPI.
