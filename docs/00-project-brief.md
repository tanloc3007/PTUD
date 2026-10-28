# PROJECT BRIEF — HỆ THỐNG UNIMIND
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — Mẫu 01**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — Trường Đại học Lạc Hồng (LHU)  
**Giảng viên hướng dẫn:** ThS. Lê Minh Nhật  
**Nhóm sinh viên thực hiện:**  
- Ngô Tấn Lộc (MSSV: 120000212) — Trưởng nhóm
- Lê Minh Luân (MSSV: 120000352) — Thành viên  
**Phiên bản:** v1.0 | **Ngày ban hành:** 22/10/2026 | **Trạng thái:** Đã phê duyệt (Gate G1)

---

## 1. Bài toán thực tế & Bối cảnh
- **Bối cảnh:** Sinh viên đại học thường xuyên đối mặt với nhiều áp lực lớn (áp lực học tập, thi cử, đồ án tốt nghiệp, mối quan hệ bạn bè, gia đình, định hướng nghề nghiệp và tài chính).
- **Vấn đề tồn tại:** 
  - Khó khăn trong việc nhận diện, theo dõi và giải tỏa cảm xúc tiêu cực hàng ngày, dẫn đến stress, lo âu, trầm cảm kéo dài nếu không được phát hiện kịp thời.
  - E ngại kỳ thị xã hội (*stigma*) khi tìm kiếm sự hỗ trợ tâm lý, lo sợ bị lộ danh tính, thông tin cá nhân hoặc điểm số/hồ sơ sinh viên.
  - Quy trình đăng ký tư vấn tâm lý học đường truyền thống còn thủ công, rườm rà, thiếu kênh trực tuyến bảo mật, tức thì và riêng tư.
- **Đối tượng bị ảnh hưởng:** Toàn thể sinh viên trường Đại học Lạc Hồng, đội ngũ chuyên viên tư vấn tâm lý học đường, và ban cố vấn/quản trị viên nhà trường.

## 2. Tầm nhìn & Mục tiêu giải pháp
UniMind được định vị là **không gian an toàn số (Digital Safe Space)**, kết hợp giữa tự chăm sóc sức khỏe tinh thần cá nhân (*Self-Care*), sự đồng hành của cộng đồng đồng trang lứa ẩn danh (*Peer Support*) và sự can thiệp chuyên môn kịp thời từ chuyên gia tâm lý học (*Professional Care*).

### Chỉ số đo lường mục tiêu (Success Metrics):
1. **Mức độ an toàn danh tính (Privacy Rate):** 100% dữ liệu trên diễn đàn cộng đồng được ẩn danh hóa (Pseudonymized); không có bất kỳ rò rỉ mã số sinh viên hay họ tên thật nào ra bên ngoài.
2. **Tốc độ kết nối tư vấn (Time-to-Consultation):** Giảm thời gian đặt và phê duyệt ca hẹn từ vài ngày xuống dưới **15 phút**.
3. **Độ chính xác sàng lọc & phân luồng (Triage Accuracy):** 100% bài viết chứa nguy cơ khủng hoảng/tự hại nghiêm trọng được AI NLP gắn cờ tự động, đưa vào hàng đợi cảnh báo khẩn cấp (*Urgent Triage Queue*) của Chuyên viên trong vòng **dưới 1 giây**.
4. **Trực quan hóa cảm xúc:** Cung cấp biểu đồ biến thiên năng lượng và trạng thái cảm xúc theo tuần/tháng với tỷ lệ phản hồi tức thì dưới **500ms**.
5. **Độ tin cậy vận hành:** Không xảy ra hiện tượng trùng lịch tư vấn (**Zero Double-Booking**) nhờ cơ chế khóa đồng thời và ràng buộc dữ liệu nghiêm ngặt.

---

## 3. Ranh giới phạm vi (Scope Boundary)

### 3.1. Phạm vi MVP (Minimum Viable Product — Đã hoàn thành 100%)
- **Quản lý Định danh & Quyền hạn (MOD-AUTH):** Đăng ký/đăng nhập sinh viên, chuyên viên, admin; cấp phát JWT Token; tự động sinh bí danh ẩn danh bảo mật dạng `"Mây Trắng #841"`, `"Cú Mèo Say Ngủ #402"`.
- **Nhật ký Cảm xúc & Biểu đồ Tâm trạng (MOD-JOURNAL):** Ghi chép tâm trạng hàng ngày (Great, Peaceful, Stressed, Exhausted, Sad), đánh giá mức năng lượng (1-10), tích hợp phân tích AI Sentiment (Google Gemini + Từ điển cảm xúc) phản hồi thấu cảm và gợi ý bài tập hít thở.
- **Trắc nghiệm Tâm lý Chuẩn y khoa (MOD-TEST):** Triển khai 3 thang đo chuẩn quốc tế: **DASS-21** (Lovibond 1995, thang điểm x2 chuẩn 0-42 phân 5 mức độ), **PHQ-9** (sàng lọc trầm cảm), **GAD-7** (sàng lọc lo âu), tự động chấm điểm và khuyến nghị đặt lịch nếu phát hiện nguy cơ cao.
- **Góc Cộng đồng Ẩn danh (MOD-COMMUNITY):** Đăng bài 2 cột có Live Preview; chọn 5 danh mục thân thiện (*Góc học tập, Gia đình & Bạn bè, Chuyện thường ngày, Góc tâm sự, Định hướng & Tương lai*); bình luận kèm ảnh chuẩn Facebook tải lên Cloudinary; cụm tương tác Thích, Đồng cảm, Bình luận gọn gàng bên trái.
- **Kiểm duyệt Tự động & Hàng đợi Báo động đỏ (MOD-MODERATION):** AI & Bộ từ khóa nhạy cảm tự động phát hiện nguy cơ, tự động ẩn nội dung nhạy cảm khỏi sinh viên (`IsSensitiveHiddenFromStudents = true`), tạo cảnh báo vào bảng `NlpRiskAlerts` cho Chuyên gia và Admin xử lý.
- **Đặt lịch & Phòng Tham vấn Trực tuyến SafeCall (MOD-APPOINTMENT):** Chọn chuyên gia, chọn khung giờ rảnh theo lịch, thuật toán chống trùng ca tư vấn (Anti-double-booking); phòng tham vấn trực tuyến WebRTC P2P **không cần mã mời**, tự động hiện banner nổi thông báo cho sinh viên và kiểm soát bảo mật Zero-Trust (403 Forbidden nếu không đúng người đặt).
- **Không gian Làm việc Chuyên gia (MOD-WORKSPACE):** Quản lý ca trực, duyệt/từ chối lịch hẹn, xem tóm tắt DASS-21 của sinh viên trước buổi tư vấn, ghi chép sổ tay chuyên môn sau ca tư vấn, kiểm duyệt bài viết và bình luận gắn cờ.
- **Quản trị & Giám sát Hệ thống (MOD-ADMIN):** Quản lý người dùng, phân quyền chi tiết cho chuyên viên, quản lý từ khóa nhạy cảm, tra cứu Audit Log toàn hệ thống, báo cáo thống kê trực quan.

### 3.2. Ngoài phạm vi MVP (Dành cho giai đoạn nâng cấp tiếp theo)
- Tích hợp cổng thanh toán trực tuyến (hệ thống hiện tại miễn phí hoàn toàn cho sinh viên).
- Ứng dụng di động Native (iOS/Android) — Hiện tại tập trung Responsive Web App đa nền tảng tối ưu tốt trên di động.
- Trò chuyện nhóm đa điểm (hiện tại phòng họp WebRTC P2P tối ưu 1-1 giữa 1 Chuyên viên và 1 Sinh viên nhằm bảo mật tối đa).

---

## 4. Ràng buộc Kỹ thuật, Bảo mật & Dữ liệu
- **Kiến trúc:** Bắt buộc tuân thủ mô hình **Clean Architecture 4 tầng** (.NET 8 Web API + React Vite).
- **Cơ sở dữ liệu:** SQL Server với khóa chính GUID, quan hệ ràng buộc toàn vẹn, chỉ mục tối ưu, và ràng buộc duy nhất (`UNIQUE`) chống trùng lịch.
- **Bảo mật:**
  - Băm mật khẩu bằng BCrypt/Argon2.
  - Chuẩn xác thực JWT Bearer Role-based (Student, Expert, Admin).
  - Áp dụng nguyên tắc **Pseudonymization** (Ẩn danh hóa) và **Zero-Trust** (kiểm tra phân quyền tài nguyên ở Backend, không chỉ ẩn giao diện).
  - Chống XSS bằng việc khử khuẩn dữ liệu đầu vào; chống SQL Injection bằng tham số hóa ORM.
  - Tải ảnh qua giao thức bảo mật HTTPS lên Cloudinary CDN (`kh0hrw3c`).

---

## 5. Giả định & Đánh giá Rủi ro

| Rủi ro tiềm ẩn | Mức độ | Biện pháp giảm thiểu |
| :--- | :---: | :--- |
| Sinh viên đăng nội dung có xu hướng tự hại cấp bách | Cao | AI NLP phát hiện từ khóa nguy cơ -> Tự động gắn nhãn `Urgent` -> Đưa vào bảng cảnh báo `NlpRiskAlerts` của Chuyên gia -> Hiển thị số điện thoại đường dây nóng SOS tức thì. |
| Hai sinh viên cùng chọn một khung giờ của chuyên gia tại cùng một giây | Cao | Ràng buộc duy nhất `UQ_Appointments_TimeSlot` tại CSDL SQL Server kết hợp giao dịch kiểm tra trùng lịch cấp độ Application, trả về mã lỗi `409 CONFLICT`. |
| Sinh viên khác tìm cách truy cập phòng tham vấn trực tuyến của bạn mình | Nghiêm trọng | Xác thực Zero-Trust tại Backend và `StudentMeetingRoomPage.jsx`: Chỉ sinh viên sở hữu lịch hẹn mới được cấp quyền vào phòng; người khác bị từ chối ngay lập tức với trang `403 Forbidden`. |
| Mạng chập chờn khi gọi WebRTC | Trung bình | Tích hợp hệ thống fallback thông báo trạng thái kết nối ICE/STUN, tự động khôi phục kết nối P2P khi đường truyền phục hồi. |

---

## 6. Người phê duyệt & Trạng thái nghiệm thu
- **Người đề xuất:** Nhóm sinh viên Ngô Tấn Lộc & Lê Minh Luân
- **Người phê duyệt:** ThS. Lê Minh Nhật (Giảng viên hướng dẫn)
- **Quality Gate:** **Gate G1 — NGHIỆP VỤ ĐÃ PHÊ DUYỆT ĐẦY ĐỦ**
