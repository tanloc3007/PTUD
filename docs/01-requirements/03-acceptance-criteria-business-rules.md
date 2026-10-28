# 03. ACCEPTANCE CRITERIA & BUSINESS RULES
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — Mẫu 03 & Bước 05**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Acceptance Criteria (Tiêu chí chấp nhận kiểm chứng được — Given/When/Then)

### AC-001: Đăng ký tài khoản sinh viên với khóa học tự do (US-001)
- **AC-001-01 (Happy path):**
  - **Given:** Người dùng ở trang `/register`, nhập Họ tên hợp lệ, Email hợp lệ chưa tồn tại trong hệ thống, Mật khẩu $\ge 6$ ký tự, chọn Khoa và nhập tự do Khóa học (VD: `"K2022"`).
  - **When:** Bấm nút *"Tạo tài khoản"*.
  - **Then:** Hệ thống tạo tài khoản mới với vai trò `Student`, băm mật khẩu an toàn, tự sinh bí danh ẩn danh (VD: `"Cú Mèo Say Ngủ #402"`), tự động đăng nhập và chuyển hướng vào `/student/home` kèm thông báo chào mừng.
- **AC-001-02 (Trùng email):**
  - **Given:** Người dùng nhập email đã tồn tại trong CSDL.
  - **When:** Bấm nút *"Tạo tài khoản"*.
  - **Then:** Hệ thống từ chối, trả về mã lỗi `400 BAD REQUEST` với thông điệp: *"Email này đã được sử dụng"*, không tạo tài khoản mới.
- **AC-001-03 (Dữ liệu không hợp lệ):**
  - **Given:** Người dùng bỏ trống họ tên hoặc nhập mật khẩu dưới 6 ký tự.
  - **When:** Bấm nút *"Tạo tài khoản"*.
  - **Then:** Hệ thống chặn ngay tại form với thông báo lỗi đỏ tương ứng dưới từng trường nhập liệu.

### AC-003: Viết nhật ký cảm xúc & Phân tích AI (US-003)
- **AC-003-01 (Lưu nhật ký và nhận phản hồi AI):**
  - **Given:** Sinh viên đã đăng nhập, chọn tâm trạng `"Stressed"`, chọn mức năng lượng `3/10`, nhập nội dung nhật ký: *"Hôm nay mình rất lo vì bài tập lớn đồ án dồn dập, mình cảm thấy quá tải"*.
  - **When:** Bấm nút *"Lưu nhật ký"*.
  - **Then:** Hệ thống gọi AI Sentiment phân tích nội dung, lưu bản ghi vào `MoodJournals`, trả về điểm số cảm xúc (ví dụ: `SentimentScore = -0.65`, `SentimentLabel = Negative`), hiển thị lời khuyên thấu cảm và bài tập thở 4-7-8 giúp sinh viên bình tâm.
- **AC-003-02 (Bảo mật quyền riêng tư):**
  - **Given:** Sinh viên A đã tạo 5 bài nhật ký.
  - **When:** Sinh viên B hoặc Chuyên viên tâm lý gửi request `GET /api/mood-journals` với token của mình.
  - **Then:** Hệ thống chỉ trả về danh sách nhật ký của người đang đăng nhập; sinh viên B và Chuyên viên hoàn toàn KHÔNG THỂ xem nhật ký của sinh viên A (`403 Forbidden` hoặc danh sách rỗng).

### AC-005: Làm bài test tâm lý DASS-21, PHQ-9, GAD-7 (US-005)
- **AC-005-01 (Chấm điểm chuẩn DASS-21 x2 Lovibond):**
  - **Given:** Sinh viên hoàn thành 21 câu hỏi của bài test DASS-21 (7 câu Trầm cảm, 7 câu Lo âu, 7 câu Căng thẳng).
  - **When:** Bấm nút *"Nộp bài & Xem kết quả"*.
  - **Then:** Hệ thống tính tổng điểm thô từng nhóm và nhân đôi ($x2$) đưa về thang chuẩn $0 - 42$, phân loại chính xác mức độ: Bình thường / Nhẹ / Vừa / Nặng / Cực kỳ nghiêm trọng.
- **AC-005-02 (Cảnh báo vượt ngưỡng an toàn):**
  - **Given:** Kết quả DASS-21 có điểm Trầm cảm hoặc Lo âu rơi vào mức *"Nặng"* hoặc *"Cực kỳ nghiêm trọng"*.
  - **When:** Hệ thống trả kết quả về giao diện.
  - **Then:** Tự động kích hoạt thẻ cảnh báo màu cam/đỏ nổi bật: *"Điểm số của bạn cho thấy bạn đang chịu áp lực lớn. Chúng tôi khuyến nghị bạn nên đặt lịch hẹn trao đổi với chuyên viên tâm lý"* kèm nút tắt chuyển thẳng đến trang `/student/booking`.

### AC-006: Đăng bài viết chia sẻ 2 cột & Live Preview (US-006)
- **AC-006-01 (Live Preview tức thì):**
  - **Given:** Sinh viên mở modal hoặc trang đăng bài tại `/student/community`.
  - **When:** Nhập nội dung, chọn màu nền gradient, chọn ảnh mẫu hoặc dán link ảnh ở cột trái.
  - **Then:** Cột phải hiển thị ngay tức thì bản xem trước bài viết thực tế với đúng bí danh ẩn danh, màu nền và ảnh đính kèm.
- **AC-006-02 (Bộ danh mục thân thiện & Alias):**
  - **Given:** Sinh viên bấm lọc theo danh mục `"Góc học tập"`.
  - **When:** Hệ thống truy vấn CSDL.
  - **Then:** Hệ thống trả về cả bài viết mang nhãn mới `"Góc học tập"` và bài viết mang nhãn cũ `"Áp lực học tập"`, đảm bảo tính tương thích ngược 100%.

### AC-007: Đăng bình luận kèm ảnh chuẩn Facebook (US-007)
- **AC-007-01 (Bình luận có ảnh):**
  - **Given:** Sinh viên chọn 1 ảnh JPG/PNG từ máy tính tại khung nhập bình luận của bài viết.
  - **When:** Khung preview ảnh hiển thị kèm nút `✕` xóa ảnh; sinh viên nhập nội dung và bấm gửi.
  - **Then:** Ảnh được tải lên Cloudinary, tạo bình luận mới với `ImageUrl`, hiển thị bong bóng bình luận chuẩn Facebook với ảnh thu nhỏ có thể nhấp để phóng to toàn màn hình.
- **AC-007-02 (Cụm nút tương tác bên trái):**
  - **Given:** Sinh viên xem bất kỳ bài viết nào trên bảng tin.
  - **When:** Quan sát thanh tương tác dưới bài viết.
  - **Then:** Cả 3 nút `[ Thích (x) ]`, `[ Đồng cảm (y) ]`, `[ Bình luận (z) ]` được gom chung thành một hàng thẳng tắp bên góc trái của bài đăng.

### AC-008: Đặt lịch hẹn & Chống trùng ca tư vấn (Anti-double-booking) (US-008)
- **AC-008-01 (Đặt lịch thành công):**
  - **Given:** Sinh viên chọn 1 khung giờ rảnh của Chuyên viên chưa có ai đặt (`IsBooked = 0`).
  - **When:** Nhập lý do tư vấn và bấm *"Xác nhận đặt lịch"*.
  - **Then:** Hệ thống ghi nhận bản ghi `Appointments` với trạng thái `Pending`, sinh mã tra cứu `ST-xxxx`, đánh dấu khung giờ `IsBooked = 1`, hiển thị thông báo thành công.
- **AC-008-02 (Xử lý đồng thời 2 người cùng đặt 1 ca):**
  - **Given:** Hai sinh viên cùng mở trang và cùng bấm nút đặt vào cùng một khung giờ tại cùng một giây.
  - **When:** Hai request đồng thời gửi lên server.
  - **Then:** Chỉ có 1 người đặt thành công; người thứ hai lập tức nhận mã lỗi `409 CONFLICT` với thông điệp: *"Khung giờ này vừa có người đăng ký. Vui lòng chọn khung giờ khác!"*.

### AC-009: Phòng họp trực tuyến không cần mã & Zero-Trust (US-009)
- **AC-009-01 (Tự động mở phòng cho đúng sinh viên):**
  - **Given:** Chuyên viên bấm *"🌐 Bắt đầu cuộc họp trực tuyến"* tại ca hẹn của sinh viên Nguyễn Văn A (`UserId = uid-A`).
  - **When:** Sinh viên A đang mở bất kỳ trang nào trên cổng sinh viên (`StudentLayout.jsx`).
  - **Then:** Xuất hiện ngay banner nổi màu xanh lá: *"Chuyên viên đang đợi bạn! Cuộc họp đang mở"* kèm nút *"🎥 Tham gia ngay"*; bấm vào là vào thẳng phòng họp WebRTC P2P không cần nhập mã.
- **AC-009-02 (Zero-Trust chặn sinh viên khác):**
  - **Given:** Sinh viên B (`UserId = uid-B`) tìm được URL phòng họp trực tuyến của sinh viên A (`/student/meeting-room?appointmentId=...`).
  - **When:** Sinh viên B cố tình truy cập vào URL này.
  - **Then:** Hệ thống kiểm tra quyền sở hữu tại `StudentMeetingRoomPage.jsx` và backend; phát hiện `CurrentUserId != Appointment.StudentId`; ngay lập tức hiển thị màn hình cảnh báo đỏ `403 Forbidden — Bạn không có quyền tham gia cuộc họp này!`, hoàn toàn ngắt kết nối WebRTC.

---

## 2. Business Rules (Quy tắc nghiệp vụ hệ thống bắt buộc tuân thủ)

| BR-ID | Tên quy tắc nghiệp vụ | Phạm vi áp dụng | Nội dung quy tắc & Ràng buộc bắt buộc | Ngoại lệ |
| :--- | :--- | :--- | :--- | :--- |
| **BR-001** | **Bảo mật Ẩn danh Cộng đồng (Pseudonymization)** | Toàn bộ module Diễn đàn & Bình luận | Không bao giờ lưu trữ hoặc trả về Họ tên thật, MSSV hay Email của sinh viên trong bất kỳ API nào thuộc phân hệ Cộng đồng (`/api/community/*`). Tác giả chỉ được hiển thị bằng bí danh ẩn danh (VD: `"Mây Trắng #841"`). | Khi Chuyên viên xử lý ca hẹn tư vấn, chuyên viên được xem bí danh và lý do do sinh viên tự khai báo. |
| **BR-002** | **Chống trùng lịch tư vấn (Anti-Double-Booking)** | Module Đặt lịch hẹn | Một khung giờ của chuyên viên (`TimeSlotId`) chỉ được gán cho duy nhất 1 lịch hẹn tại một thời điểm. CSDL phải áp dụng ràng buộc duy nhất `CONSTRAINT UQ_Appointments_TimeSlot UNIQUE (TimeSlotId)` kết hợp kiểm tra giao dịch ở tầng Application. | Ca hẹn trước đó đã chuyển trạng thái `Rejected` hoặc `Cancelled` thì khung giờ đó có thể được mở lại. |
| **BR-003** | **Kiểm soát Truy cập Zero-Trust cho Cuộc họp** | Module Cuộc họp trực tuyến | Chỉ duy nhất 2 người: Chuyên viên được phân công ca hẹn và Sinh viên sở hữu ca hẹn mới được phép kết nối vào phòng họp P2P của ca hẹn đó. Mọi nỗ lực truy cập từ người thứ ba đều bị chặn với mã lỗi `403 FORBIDDEN`. | Quản trị viên chỉ có thể xem trạng thái phiên, không được nghe/xem nội dung tư vấn riêng tư. |
| **BR-004** | **Phân luồng Nguy cơ & Báo động đỏ NLP** | AI Sentiment & Kiểm duyệt | Khi bài viết hoặc bình luận chứa từ khóa tự hại nghiêm trọng hoặc AI chấm điểm rủi ro $RiskScore \ge 75$:<br>1. Hệ thống tự động gán trạng thái `Flagged`.<br>2. Ẩn nội dung khỏi sinh viên thông thường (`IsSensitiveHiddenFromStudents = true`).<br>3. Tự động sinh bản ghi cảnh báo vào bảng `NlpRiskAlerts` với mức `Urgent` để chuyên gia can thiệp ngay lập tức. | Không có ngoại lệ đối với từ khóa tự tử/tự hại nghiêm trọng. |
| **BR-005** | **Bất biến của Nhật ký Kiểm toán (Audit Log Immutability)** | Module Quản trị viên & Kiểm toán | Bảng `AuditLogs` chỉ cho phép thao tác `INSERT` và `SELECT`. Tuyệt đối không cho phép bất kỳ ai (kể cả Admin) thực hiện `UPDATE` hoặc `DELETE` trên bảng này. | Chỉ có DBA thao tác sao lưu lưu trữ theo quy định pháp lý hàng năm. |
| **BR-006** | **Chuẩn hóa Thang đo Y khoa DASS-21** | Module Trắc nghiệm tâm lý | Điểm thô của 3 nhóm (Trầm cảm, Lo âu, Căng thẳng) trong bài DASS-21 bắt buộc phải nhân đôi ($x2$) để quy đổi về thang điểm chuẩn quốc tế 0 - 42 theo Lovibond (1995) trước khi so sánh với bảng phân tầng mức độ. | Không áp dụng nhân đôi cho các thang đo khác như PHQ-9 hay GAD-7. |
| **BR-007** | **Phân quyền Động Chuyên viên (Dynamic Permissions)** | Module Quản lý Chuyên gia | Chuyên viên chỉ được truy cập các tính năng tương ứng với chuỗi quyền hạn được Admin cấp trong trường `Permissions` (VD: `PERM_WORKSPACE`, `PERM_SCHEDULE`, `PERM_ANALYTICS`, `PERM_MODERATION`). Khi bị tước quyền, hệ thống phải chặn ngay lập tức. | Quyền truy cập thông tin cá nhân cơ bản của chính chuyên gia luôn được mở. |
| **BR-008** | **Toàn vẹn Dữ liệu Khóa học (Academic Year Flexibility)** | Module Đăng ký & Hồ sơ | Cho phép sinh viên nhập tự do khóa học của mình (VD: `K2021`, `K2022`, `K2023`, `K2024`) thay vì danh sách cố định, đồng thời chuẩn hóa định dạng (loại bỏ ký tự lạ, giới hạn độ dài $\le 20$ ký tự). | Không được để trống trường khóa học khi đăng ký. |
