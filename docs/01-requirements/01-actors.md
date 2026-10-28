# 01. ACTOR IDENTIFICATION & ACTOR FUNCTION MATRIX
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — Mẫu 02**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Actor Register (Bảng đăng ký tác nhân tương tác)

| ID | Actor (Vai trò) | Loại | Mục tiêu chính | Quyền hạn & Giới hạn bảo mật |
| :--- | :--- | :--- | :--- | :--- |
| **ACT-STU** | **Sinh viên (Student)** | Người dùng nội bộ | - Ghi chép nhật ký cảm xúc & theo dõi năng lượng<br>- Tự đánh giá tâm lý qua DASS-21, PHQ-9, GAD-7<br>- Chia sẻ tâm sự và động viên bạn bè ẩn danh<br>- Đặt lịch hẹn và tham gia họp trực tuyến với Chuyên viên | - Chỉ truy cập dữ liệu cá nhân của chính mình (nhật ký, kết quả test, ca hẹn).<br>- Tương tác trên diễn đàn dưới bí danh ẩn danh, không lộ MSSV/họ tên.<br>- Được tự do đăng bài, bình luận kèm ảnh sau khi qua kiểm duyệt AI. |
| **ACT-EXP** | **Chuyên viên tâm lý (Expert)** | Người dùng chuyên môn | - Cấu hình lịch làm việc và các khung giờ rảnh<br>- Tiếp nhận, phê duyệt hoặc từ chối lịch hẹn của sinh viên<br>- Mở phòng tham vấn trực tuyến SafeCall 1-1 không cần mã<br>- Xem tóm tắt DASS-21 và ghi chép sổ tay chuyên môn sau ca tư vấn<br>- Kiểm duyệt các bài viết/bình luận có cảnh báo từ AI | - Được cấu hình danh mục quyền hạn động (`Permissions`).<br>- Xem bí danh và lý do tư vấn của sinh viên đặt lịch.<br>- Mở phòng họp và ghi chép chẩn đoán lâm sàng.<br>- Xử lý cảnh báo rủi ro cao từ sinh viên gửi lên. |
| **ACT-ADM** | **Quản trị viên (Admin)** | Quản trị hệ thống | - Giám sát vận hành toàn bộ hệ thống<br>- Quản lý người dùng, khóa tài khoản vi phạm tiêu chuẩn<br>- Cấu hình phân quyền động cho từng chuyên viên<br>- Quản lý ngân hàng câu hỏi bài test tâm lý<br>- Quản lý danh mục từ khóa nhạy cảm và xử lý Báo động đỏ<br>- Tra cứu Audit Log và xem báo cáo thống kê | - Toàn quyền truy cập bảng quản trị `/admin/*`.<br>- Mọi thao tác nhạy cảm (khóa tài khoản, xóa bài, thêm từ khóa) đều bị ghi vết nghiêm ngặt vào `AuditLogs`.<br>- Không có quyền đọc trộm nội dung nhật ký cảm xúc riêng tư của sinh viên (đảm bảo quyền riêng tư). |
| **EXT-AI** | **Hệ thống AI NLP (Gemini & Rule Engine)** | Hệ thống ngoài (External) | - Phân tích cảm xúc văn bản (-1.0 đến +1.0)<br>- Phản hồi lời khuyên thấu cảm và bài tập thở<br>- Phát hiện từ khóa nhạy cảm & tự hại<br>- Chấm điểm RiskScore (0-100) và phân tầng TriageLevel | - Tự động kích hoạt khi có bài nhật ký, bài viết diễn đàn hoặc bình luận mới.<br>- Đẩy dữ liệu vào bảng `NlpRiskAlerts` khi vượt ngưỡng nguy hiểm ($RiskScore \ge 75$). |
| **EXT-CDN** | **Dịch vụ Cloudinary CDN** | Hệ thống ngoài (External) | - Tiếp nhận, tối ưu hóa (WebP, Auto-crop) và lưu trữ ảnh an toàn cho avatar, bài đăng và bình luận | - Tương tác qua API HTTPS bảo mật; giới hạn kích thước tối đa và tự động xóa ảnh vi phạm khi bị từ chối. |
| **EXT-RTC** | **Dịch vụ WebRTC Direct P2P** | Giao thức truyền thông | - Thiết lập kết nối âm thanh & hình ảnh thời gian thực 1-1 giữa Chuyên viên và Sinh viên | - Kết nối ngang hàng mã hóa đầu cuối; không lưu trữ video/âm thanh tại máy chủ; kiểm soát Zero-Trust qua token phiên. |

---

## 2. Actor Function Matrix (Ma trận hành động theo vai trò)

| Actor ID | Tác nhân | AF-ID | Hành động nghiệp vụ | Dữ liệu tác động | Quyền & Phạm vi | Độ ưu tiên |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **ACT-STU** | Sinh viên | **AF-01** | Đăng ký tài khoản (hỗ trợ nhập khóa học tự do) | `Users` | Công khai, tạo mới | **Must** |
| | | **AF-02** | Đăng nhập tài khoản & nhận JWT token | `Users` | Xác thực người dùng | **Must** |
| | | **AF-03** | Viết nhật ký cảm xúc & nhận phân tích AI | `MoodJournals` | Chủ sở hữu (`Owner`) | **Must** |
| | | **AF-04** | Xem biểu đồ biến thiên tâm trạng và năng lượng | `MoodJournals` | Chủ sở hữu (`Owner`) | **Must** |
| | | **AF-05** | Làm bài trắc nghiệm tâm lý (DASS-21, PHQ-9, GAD-7) | `TestResults` | Chủ sở hữu (`Owner`) | **Must** |
| | | **AF-06** | Đăng bài viết chia sẻ 2 cột (có Live Preview) | `CommunityPosts` | Cộng đồng (Ẩn danh) | **Must** |
| | | **AF-07** | Đăng bình luận kèm ảnh chuẩn Facebook | `CommunityComments` | Cộng đồng (Ẩn danh) | **Must** |
| | | **AF-08** | Thả tim / Đồng cảm với bài viết | `CommunityPosts` | Cộng đồng | **Should** |
| | | **AF-09** | Tìm kiếm chuyên viên & đặt lịch hẹn tư vấn | `Appointments`, `TimeSlots` | Chủ sở hữu (`Owner`) | **Must** |
| | | **AF-10** | Nhận banner nổi và vào phòng họp trực tuyến SafeCall | `Appointments` | Đúng sinh viên đặt lịch | **Must** |
| **ACT-EXP** | Chuyên viên | **AF-11** | Cấu hình các khung giờ rảnh theo tuần | `TimeSlots` | Chuyên viên tạo (`Owner`) | **Must** |
| | | **AF-12** | Phê duyệt hoặc từ chối yêu cầu đặt lịch | `Appointments`, `TimeSlots` | Lịch thuộc chuyên viên | **Must** |
| | | **AF-13** | Mở phòng họp trực tuyến tức thì (không cần mã mời) | `Appointments` | Lịch thuộc chuyên viên | **Must** |
| | | **AF-14** | Xem kết quả DASS-21 & ghi chú sổ tay lâm sàng | `Appointments` | Lịch thuộc chuyên viên | **Must** |
| | | **AF-15** | Kiểm duyệt bài viết và bình luận bị gắn cờ AI | `CommunityPosts`, `CommunityComments` | Theo quyền `PERM_MODERATION` | **Must** |
| | | **AF-16** | Xem phân tích xu hướng sức khỏe tinh thần sinh viên | `MoodJournals`, `TestResults` | Theo quyền `PERM_ANALYTICS` | **Should** |
| **ACT-ADM** | Quản trị | **AF-17** | Quản lý danh sách người dùng & khóa tài khoản vi phạm | `Users`, `AuditLogs` | Toàn hệ thống (`Admin`) | **Must** |
| | | **AF-18** | Cấu hình ma trận phân quyền chi tiết cho chuyên viên | `Experts`, `AuditLogs` | Toàn hệ thống (`Admin`) | **Must** |
| | | **AF-19** | Quản lý từ khóa nhạy cảm (thêm/sửa/xóa từ khóa) | `SensitiveKeywords`, `AuditLogs` | Toàn hệ thống (`Admin`) | **Must** |
| | | **AF-20** | Kiểm duyệt nội dung bài viết, bình luận, ảnh đính kèm | `CommunityPosts`, `CommunityComments` | Toàn hệ thống (`Admin`) | **Must** |
| | | **AF-21** | Xử lý hàng đợi cảnh báo nguy cơ NLP (Báo động đỏ) | `NlpRiskAlerts`, `AuditLogs` | Toàn hệ thống (`Admin`) | **Must** |
| | | **AF-22** | Tra cứu nhật ký bảo mật Audit Log toàn hệ thống | `AuditLogs` | Toàn hệ thống (`Admin`) | **Must** |
| | | **AF-23** | Xem dashboard thống kê tổng hợp số liệu CSDL | Toàn bộ các bảng | Toàn hệ thống (`Admin`) | **Must** |
