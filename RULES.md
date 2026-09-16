# RULES.md - BỘ QUY CHUẨN MÃ NGUỒN & NGUYÊN TẮC THIẾT KẾ
# Dự án: Xây dựng hệ thống nhật ký cảm xúc & tư vấn tâm lý ẩn danh dành cho sinh viên
# Học phần: Phát triển ứng dụng (PTUD) - ĐH Lạc Hồng

## 1. Quy ước đặt tên (Naming Conventions)

### Backend (C# / .NET)
- **Class, Interface, Method, Property**: Dùng PascalCase (`CreateMoodJournalCommand`, `CalculateTestScore`).
- **Interface**: Bắt đầu bằng tiền tố `I` (`IApplicationDbContext`, `IAISentimentService`).
- **Biến cục bộ, tham số hàm**: Dùng camelCase (`appointmentId`, `studentInfo`).
- **Trường private**: Dùng tiền tố `_` kết hợp camelCase (`_context`, `_aiService`).
- **Controller**: Kết thúc bằng hậu tố `Controller` (`MoodJournalsController`).
- **DTO**: Kết thúc bằng hậu tố `Dto` (`MoodJournalDto`, `AppointmentDetailDto`).

### Frontend (TypeScript / React)
- **Thư mục feature & components**: Dùng kebab-case (`mood-journal`, `consultation-booking`).
- **React Component**: Dùng PascalCase (`MoodTrendChart.tsx`, `TimeSlotPicker.tsx`).
- **Custom Hook**: Bắt đầu bằng `use` và dùng camelCase (`useMoodJournal.ts`, `useAuth.ts`).
- **API Service Function**: Bắt đầu bằng động từ (`getMoodStats()`, `bookAppointment()`).

### Cơ sở dữ liệu (SQL Server)
- **Tên bảng**: Dùng danh từ số nhiều, PascalCase (`Users`, `MoodJournals`, `Appointments`).
- **Khóa chính**: Luôn đặt là `Id` kiểu `uniqueidentifier` (GUID) hoặc `bigint`.
- **Khóa ngoại**: Đặt theo mẫu `[TênThựcThể]Id` (`UserId`, `ExpertId`, `TestId`).

---

## 2. Quy tắc Xử lý Lỗi & Kết quả (Error Handling)
- **Không nuốt lỗi**: Không sử dụng khối `catch` rỗng để giấu lỗi.
- **Middleware toàn cục**: Ngoại lệ không được xử lý phải để `ExceptionHandlingMiddleware` bắt tự động và trả về HTTP JSON chuẩn:
  ```json
  {
    "success": false,
    "errorCode": "DOUBLE_BOOKING_DETECTED",
    "message": "Khung giờ chuyên gia đã được sinh viên khác đăng ký.",
    "timestamp": "2026-09-11T00:15:00Z"
  }
  ```
- **Result Pattern**: Khuyến khích sử dụng `Result<T>` ở tầng Application để tránh lạm dụng Exception cho các lỗi luồng logic thông thường.

---

## 3. Quy chuẩn Bảo mật & Dữ liệu Ẩn danh (Privacy Standard)
- **Mật khẩu**: Tuyệt đối không lưu plain text. Bắt buộc băm mật khẩu bằng BCrypt hoặc Argon2.
- **JWT Token**: Access Token có thời hạn ngắn (15-60 phút), sử dụng Refresh Token để gia hạn.
- **Ẩn danh cộng đồng**:
  - Khi lưu bài viết `AnonymousPost`, liên kết danh tính người dùng qua bảng ánh xạ bí mật hoặc mã băm.
  - Khi API trả danh sách bài viết về Client, trường tác giả **CHỈ ĐƯỢC CHỨA** `AnonymousName` (Ví dụ: "Sinh viên ẩn danh #842"), tuyệt đối không trả về MSSV, Email hay Họ tên thật.

---

## 4. Quy chuẩn Bất đồng bộ (Async/Await)
- Tất cả các thao tác I/O (truy vấn CSDL SQL Server, gọi API AI ngoài, gửi Email) bắt buộc phải dùng `async/await` và truyền `CancellationToken`.
