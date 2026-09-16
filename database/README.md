# HƯỚNG DẪN CƠ SỞ DỮ LIỆU UNIMIND (SQL SERVER)

Hệ thống Quản lý Nhật ký cảm xúc và Hỗ trợ tư vấn tâm lý ẩn danh sinh viên (**UniMind**) được thiết kế chuyên biệt cho hệ quản trị CSDL Microsoft SQL Server, tuân thủ nghiêm ngặt các quy định tại `AGENTS.md` và `RULES.md`.

---

## 1. Cấu trúc Các Bảng Dữ Liệu Chính

| STT | Tên Bảng | Mô tả chức năng | Ghi chú bảo mật & Nghiệp vụ |
|:---:|---|---|---|
| 1 | `Users` | Lưu trữ tài khoản sinh viên, chuyên viên và quản trị viên | Mật khẩu băm BCrypt, chứa `AnonymousCode` |
| 2 | `Experts` | Hồ sơ chuyên viên tâm lý (học vị, kinh nghiệm, phòng trực) | Liên kết 1-1 với `Users` |
| 3 | `TimeSlots` | Khung giờ trực rảnh của chuyên viên | Phân loại phòng trực tiếp P.302 & SafeRoom Online |
| 4 | `Appointments` | Đơn đăng ký lịch hẹn tư vấn tâm lý | Có ràng buộc `UNIQUE (TimeSlotId)` chống trùng lịch |
| 5 | `MoodJournals` | Nhật ký cảm xúc & năng lượng hàng ngày | Tích hợp điểm AI Sentiment & lời khuyên thấu cảm |
| 6 | `PsychologicalTests` | Ngân hàng bài test tâm lý chuẩn hóa | DASS-21, PHQ-9, GAD-7, MBI-SS |
| 7 | `TestQuestions` | 21 câu hỏi DASS-21 và các thang đo tâm lý | Phân loại: Depression, Anxiety, Stress |
| 8 | `TestOptions` | Thang điểm lựa chọn (0, 1, 2, 3 điểm) | Chuẩn quốc tế y khoa học đường |
| 9 | `TestResults` | Kết quả làm bài và hồ sơ tâm lý gần nhất | Điểm từng chỉ số, tỷ lệ phục hồi và nhận định AI |
| 10 | `SensitiveKeywords` | Danh sách từ khóa nhạy cảm / nguy cơ | Chuyên viên và Admin trực tiếp quản lý và gán trọng số |
| 11 | `CommunityPosts` | Bảng tin chia sẻ ẩn danh | AI Sentiment chấm điểm, gắn thẻ Báo động Đỏ |
| 12 | `CommunityComments` | Bình luận thấu cảm trong cộng đồng | Bình luận nhạy cảm bị ẩn với SV, gửi tới Expert/Admin |
| 13 | `NlpRiskAlerts` | Hàng đợi can thiệp khẩn cấp (NLP Triage) | Dành cho Chuyên viên và Admin giải quyết ngay |
| 14 | `AuditLogs` | Nhật ký bảo mật và thao tác hệ thống | Ghi lại mọi hành vi can thiệp hoặc thay đổi phân quyền |

---

## 2. Quy tắc Nghiệp vụ Đặc biệt

### 2.1. Chống Trùng Lịch Ca Tư Vấn (Anti-Double Booking)
- Tại tầng CSDL: Khung giờ `TimeSlotId` trong bảng `Appointments` được gán ràng buộc `UNIQUE`.
- Cột `IsBooked` trong bảng `TimeSlots` được cập nhật đồng thời trong Transaction khi phát sinh giao dịch đặt hẹn.

### 2.2. Bảo Mật Danh Tính Ẩn Danh
- Bài viết và bình luận cộng đồng KHÔNG BAO GIỜ liên kết lộ thông tin MSSV, Email hay Họ tên thật ra phía giao diện người dùng.
- Mọi tương tác đều thông qua bí danh ngẫu nhiên (Ví dụ: `Cú Mèo Say Ngủ #402`, `Bạn Ẩn Yên #382`).

### 2.3. Lọc Từ Khóa Nhạy Cảm & Can Thiệp Khẩn Cấp Báo Động Đỏ
- Khi sinh viên đăng bài hoặc bình luận chứa các từ khóa trong bảng `SensitiveKeywords` (như `tự tử`, `nhảy lầu`, `rạch tay`, `bế tắc`):
  - Bài viết/bình luận được tự động đánh dấu `IsSensitiveHiddenFromStudents = 1` để ẩn khỏi tầm nhìn của các sinh viên khác, tránh gây kích động tập thể.
  - Đồng thời, một bản ghi cảnh báo với `RiskScore >= 75` được tạo tự động trong bảng `NlpRiskAlerts`, gán nhãn `TriageLevel = 'Urgent'`.
  - Admin và Chuyên viên sẽ nhìn thấy **Thẻ Báo Động Đỏ** nổi bật để thực hiện can thiệp tức thời.

---

## 3. Cách Thức Khởi Tạo Trên SQL Server

1. Mở **SQL Server Management Studio (SSMS)** hoặc **Azure Data Studio**.
2. Kết nối tới SQL Server Database Engine.
3. Mở file `schema.sql` và nhấn **Execute (F5)** để tạo Database `UniMindDb` cùng toàn bộ bảng và chỉ mục.
4. Mở file `seed_data.sql` và nhấn **Execute (F5)** để nạp toàn bộ dữ liệu mẫu ban đầu.
