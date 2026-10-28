# 02. USER STORY BACKLOG
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — Mẫu 03 & Bước 04**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Danh mục User Stories — Phân hệ Sinh viên (ACT-STU)

### US-001: Đăng ký tài khoản với khóa học nhập tự do
- **Mức ưu tiên:** Must Have
- **Actor:** Sinh viên (ACT-STU)
- **Mô tả:** Là một sinh viên, tôi muốn đăng ký tài khoản bằng email sinh viên và tự do gõ mã khóa học của mình (VD: K2021, K2022, K2023...), để tôi có thể tạo tài khoản chính xác theo khóa của trường mà không bị giới hạn bởi danh sách cứng.
- **Ràng buộc:** Email phải là duy nhất trong hệ thống; hệ thống tự động sinh một bí danh ẩn danh ngẫu nhiên (VD: `"Cú Mèo Say Ngủ #402"`).

### US-002: Đăng nhập an toàn & lưu phiên làm việc
- **Mức ưu tiên:** Must Have
- **Actor:** Sinh viên (ACT-STU)
- **Mô tả:** Là một sinh viên, tôi muốn đăng nhập bằng email và mật khẩu để truy cập vào không gian riêng tư của mình và duy trì phiên đăng nhập bằng JWT Token.
- **Ràng buộc:** Mật khẩu được mã hóa an toàn bằng BCrypt/Argon2; trả về thông tin người dùng kèm bí danh bảo mật.

### US-003: Ghi chép nhật ký cảm xúc & nhận phân tích AI
- **Mức ưu tiên:** Must Have
- **Actor:** Sinh viên (ACT-STU)
- **Mô tả:** Là một sinh viên, tôi muốn chọn tâm trạng hàng ngày (Great, Peaceful, Stressed, Exhausted, Sad), kéo thang điểm năng lượng (1-10) và viết cảm xúc của mình, để AI phân tích cảm xúc và phản hồi cho tôi lời khuyên thấu cảm cùng bài tập thở giúp tôi thư giãn.
- **Ràng buộc:** Nội dung nhật ký là hoàn toàn riêng tư (`IsPrivate = true`), chỉ duy nhất sinh viên đó đọc được.

### US-004: Trực quan hóa diễn biến cảm xúc bằng biểu đồ
- **Mức ưu tiên:** Must Have
- **Actor:** Sinh viên (ACT-STU)
- **Mô tả:** Là một sinh viên, tôi muốn xem biểu đồ đường và cột thể hiện mức năng lượng và tần suất cảm xúc trong 7 ngày gần nhất, để tôi nhận diện xu hướng sức khỏe tinh thần của bản thân.

### US-005: Thực hiện trắc nghiệm tâm lý chuẩn DASS-21, PHQ-9, GAD-7
- **Mức ưu tiên:** Must Have
- **Actor:** Sinh viên (ACT-STU)
- **Mô tả:** Là một sinh viên, tôi muốn chọn làm các bài test tâm lý chuẩn quốc tế (DASS-21, PHQ-9, GAD-7) thông qua hệ thống tab trực quan, trả lời các câu hỏi và nhận ngay kết quả phân tầng mức độ (Bình thường, Nhẹ, Vừa, Nặng, Rất nặng) cùng khuyến nghị can thiệp.
- **Ràng buộc:** DASS-21 tuân thủ chuẩn lâm sàng Lovibond (1995) với thang điểm nhân đôi $x2$ từ 0 đến 42 điểm; nếu điểm rơi vào ngưỡng nguy cơ thì hệ thống tự động khuyến nghị đặt lịch với chuyên gia.

### US-006: Đăng bài chia sẻ 2 cột với Live Preview trực quan
- **Mức ưu tiên:** Must Have
- **Actor:** Sinh viên (ACT-STU)
- **Mô tả:** Là một sinh viên, tôi muốn soạn thảo bài viết ẩn danh ở cột bên trái và xem trước chính xác bài viết trông như thế nào ở cột bên phải trước khi bấm đăng, để tôi an tâm về hình ảnh và nội dung chia sẻ của mình.
- **Ràng buộc:** Được chọn 1 trong 5 danh mục thân thiện (*Góc học tập, Gia đình & Bạn bè, Chuyện thường ngày, Góc tâm sự, Định hướng & Tương lai*); tên tác giả luôn hiển thị dạng bí danh ẩn danh.

### US-007: Đăng bình luận kèm ảnh phong cách Facebook
- **Mức ưu tiên:** Must Have
- **Actor:** Sinh viên (ACT-STU)
- **Mô tả:** Là một sinh viên, tôi muốn viết bình luận và có thể tải kèm ảnh trực tiếp lên bài viết để động viên bạn bè, với giao diện bong bóng bình luận bo tròn mềm mại và nút tương tác Thích, Đồng cảm, Bình luận nằm gọn bên trái.
- **Ràng buộc:** Ảnh được upload an toàn lên Cloudinary; bình luận tự động qua bộ lọc từ khóa nhạy cảm.

### US-008: Đặt lịch hẹn tư vấn và bảo vệ chống trùng ca
- **Mức ưu tiên:** Must Have
- **Actor:** Sinh viên (ACT-STU)
- **Mô tả:** Là một sinh viên, tôi muốn xem danh sách chuyên viên tâm lý, chọn ngày và khung giờ rảnh khả dụng của chuyên viên, nhập lý do tư vấn và gửi yêu cầu đặt lịch hẹn.
- **Ràng buộc:** Hệ thống đảm bảo không bao giờ xảy ra tình trạng 2 sinh viên cùng đặt một khung giờ (Anti-double-booking); sinh viên nhận được mã tra cứu ẩn danh (VD: `ST-8890`).

### US-009: Nhận thông báo banner nổi và vào phòng họp trực tuyến tức thì
- **Mức ưu tiên:** Must Have
- **Actor:** Sinh viên (ACT-STU)
- **Mô tả:** Khi chuyên viên mở phòng tư vấn trực tuyến, tôi muốn hệ thống hiển thị banner nổi màu xanh lá thông báo *"Chuyên viên đang đợi bạn! Cuộc họp đang mở"* kèm nút *"🎥 Tham gia ngay"*, để tôi vào thẳng phòng họp WebRTC P2P mà không cần phải nhập mã mời rườm rà.
- **Ràng buộc:** Chỉ sinh viên sở hữu ca hẹn mới được phép vào; nếu sinh viên khác cố tình vào thì bị chặn ngay bởi trang `403 Forbidden`.

---

## 2. Danh mục User Stories — Phân hệ Chuyên viên (ACT-EXP)

### US-010: Cấu hình khung giờ trực và lịch làm việc
- **Mức ưu tiên:** Must Have
- **Actor:** Chuyên viên tâm lý (ACT-EXP)
- **Mô tả:** Là một chuyên viên, tôi muốn thiết lập các khung giờ rảnh trong tuần (SlotDate, StartTime, EndTime, phòng trực tiếp hay trực tuyến) để sinh viên có thể đăng ký đặt lịch hẹn.

### US-011: Tiếp nhận và phê duyệt / từ chối lịch hẹn
- **Mức ưu tiên:** Must Have
- **Actor:** Chuyên viên tâm lý (ACT-EXP)
- **Mô tả:** Là một chuyên viên, tôi muốn xem danh sách các yêu cầu đặt lịch của sinh viên, xem bí danh ẩn danh, lý do tư vấn và kết quả tóm tắt DASS-21, từ đó quyết định phê duyệt hoặc từ chối ca hẹn kèm lý do.

### US-012: Bắt đầu cuộc họp trực tuyến tức thì không cần mã
- **Mức ưu tiên:** Must Have
- **Actor:** Chuyên viên tâm lý (ACT-EXP)
- **Mô tả:** Khi đến giờ tư vấn, tôi muốn bấm nút *"🌐 Bắt đầu cuộc họp trực tuyến"* để hệ thống tự động kích hoạt phòng họp, phát tín hiệu mời đến sinh viên mà không cần copy paste link/mã mời.

### US-013: Ghi chép sổ tay lâm sàng & kết thúc ca tư vấn
- **Mức ưu tiên:** Must Have
- **Actor:** Chuyên viên tâm lý (ACT-EXP)
- **Mô tả:** Sau khi hoàn thành buổi tham vấn tâm lý, tôi muốn nhập ghi chép chuyên môn (Clinical Notes) lưu trữ bảo mật và cập nhật trạng thái ca hẹn sang `"Completed"`.

### US-014: Kiểm duyệt bài viết và bình luận bị gắn cờ nguy cơ
- **Mức ưu tiên:** Must Have
- **Actor:** Chuyên viên tâm lý (ACT-EXP)
- **Mô tả:** Là một chuyên viên, tôi muốn truy cập tab "Bài viết cần duyệt" và "Bình luận cần duyệt" để xem các nội dung bị AI phát hiện từ khóa nhạy cảm hoặc nguy cơ tự hại, và thao tác nhanh Duyệt hiển thị, Tạm ẩn hoặc Từ chối vi phạm.

---

## 3. Danh mục User Stories — Phân hệ Quản trị viên (ACT-ADM)

### US-015: Quản lý người dùng và khóa tài khoản vi phạm
- **Mức ưu tiên:** Must Have
- **Actor:** Quản trị viên (ACT-ADM)
- **Mô tả:** Là một admin, tôi muốn xem danh sách tài khoản (Sinh viên, Chuyên viên, Admin), lọc theo vai trò, khoa, trạng thái và có thể khóa/mở khóa tài khoản khi có hành vi vi phạm chuẩn mực.

### US-016: Ma trận phân quyền chi tiết cho chuyên viên
- **Mức ưu tiên:** Must Have
- **Actor:** Quản trị viên (ACT-ADM)
- **Mô tả:** Là một admin, tôi muốn cấu hình quyền hạn động cho từng chuyên viên (VD: Chuyên viên A chỉ phụ trách Lịch hẹn & Dashboard; Chuyên viên B phụ trách Phân tích & Kiểm duyệt bài viết), để phân định trách nhiệm công việc chuyên môn rõ ràng.

### US-017: Quản lý danh mục từ khóa nhạy cảm (Sensitive Keywords)
- **Mức ưu tiên:** Must Have
- **Actor:** Quản trị viên (ACT-ADM)
- **Mô tả:** Là một admin, tôi muốn thêm từ khóa nhạy cảm mới, phân loại danh mục (SelfHarm, AcademicFraud, Violence, Harassment), gán trọng số rủi ro ($RiskWeight$) và bật/tắt hoạt động của từ khóa để bộ lọc AI tự động cập nhật ngay lập tức.

### US-018: Xử lý hàng đợi cảnh báo nguy cơ NLP (Báo động đỏ)
- **Mức ưu tiên:** Must Have
- **Actor:** Quản trị viên (ACT-ADM)
- **Mô tả:** Là một admin, tôi muốn tiếp nhận danh sách cảnh báo khẩn cấp từ bảng `NlpRiskAlerts`, xem trích đoạn nội dung vi phạm, mức điểm rủi ro ($RiskScore \ge 85$), bí danh sinh viên và ghi nhận hành động can thiệp (VD: "Đã mở SafeRoom", "Đã gửi thông điệp nâng đỡ", "Đã kích hoạt SOS").

### US-019: Tra cứu nhật ký bảo mật Audit Log
- **Mức ưu tiên:** Must Have
- **Actor:** Quản trị viên (ACT-ADM)
- **Mô tả:** Là một admin, tôi muốn tra cứu lịch sử ghi vết của toàn bộ thao tác quản trị (Ai đã làm gì, thời gian nào, địa chỉ IP nào, chi tiết thay đổi là gì) để phục vụ công tác thanh tra và kiểm toán an toàn hệ thống.

### US-020: Báo cáo & Thống kê tổng thể hệ thống
- **Mức ưu tiên:** Must Have
- **Actor:** Quản trị viên (ACT-ADM)
- **Mô tả:** Là một admin, tôi muốn xem biểu đồ phân bố người dùng theo khoa, tần suất sử dụng nhật ký, tỷ lệ ca tư vấn thành công, và xu hướng cảm xúc chung của sinh viên toàn trường để tham mưu cho công tác sinh viên của nhà trường.
