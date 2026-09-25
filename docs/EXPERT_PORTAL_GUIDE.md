# 🩺 HƯỚNG DẪN GIAO DIỆN & TÍNH NĂNG — PHÂN HỆ CHUYÊN VIÊN TÂM LÝ (EXPERT PORTAL)
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Trường Đại học Lạc Hồng** — Môn: Phát triển Ứng dụng (PTUD)

---

## 1. Tổng quan phân hệ Chuyên viên
Phân hệ Chuyên viên (Expert Portal) là không gian làm việc chuyên nghiệp, chuẩn y tế & tham vấn học đường dành cho các chuyên gia tâm lý nhằm theo dõi sức khỏe tâm thần sinh viên, tiếp nhận và phê duyệt ca tư vấn, điều phối phòng tham vấn trực tuyến (SafeRoom Live) và sàng lọc cảnh báo rủi ro.

### Bộ nhận diện & Trải nghiệm:
- **Phong cách:** Màu xanh y tế / bầu trời (Sky Blue / Cyan: `#0369a1` / `#0ea5e9`), mang lại sự điềm tĩnh, khoa học và tin cậy cao.
- **Chế độ giao diện:** Hỗ trợ toàn diện **Chế độ Sáng / Tối (Light / Dark)** qua toggle icon Mặt trời ☀️ và Mặt trăng 🌙.
- **Bố cục:** Thiết kế Full-width, giãn đều 100% không gian màn hình, tối ưu hóa hiển thị biểu đồ và danh sách dữ liệu lớn.

---

## 2. Chi tiết các Màn hình & Chức năng Chuyên sâu

### 2.1. Bàn làm việc Tổng quan (`/expert/workspace`)
- **Khối chỉ số KPI & Hoạt động trong ngày:**
  - Tổng số ca hẹn cần duyệt (Pending Approval).
  - Ca tư vấn chuẩn bị diễn ra hôm nay.
  - Số trường hợp cần can thiệp khẩn cấp (Crisis / High Risk Triage).
  - Điểm hài lòng và đánh giá từ sinh viên.
- **Biểu đồ phân bố ca tư vấn theo tuần & tháng:**
  - Ứng dụng `ModernBarChart` với tính năng tự động co giãn chiều cao theo tỷ lệ phần trăm dữ liệu thực tế (Auto Scale Ratio), hiển thị nhãn số lượng và tooltip chi tiết.
- **Biểu đồ tròn tỷ lệ mức độ tâm lý sinh viên (DASS-21 Donut Chart):**
  - Trực quan hóa tỷ lệ phần trăm các mức độ: *Bình thường*, *Nhẹ*, *Trung bình*, *Nặng*, *Nguy cơ cao/Khủng hoảng*.
- **Hàng đợi ca tư vấn trực tiếp:**
  - Hiển thị ca sắp tới kèm nút **"Phê duyệt"**, **"Từ chối"** hoặc **"Mở phòng tư vấn SafeRoom"**.

---

### 2.2. Quản lý Lịch hẹn & Phê duyệt Ca tư vấn (`/expert/schedule`)
- **Quy trình Phê duyệt Lịch hẹn chặt chẽ (Approval Workflow):**
  1. **Tiếp nhận đăng ký:** Khi sinh viên đặt lịch, lịch hẹn xuất hiện trong tab **"Chờ phê duyệt" (Pending)** của Chuyên viên được chọn.
  2. **Xem chi tiết hồ sơ đặt lịch:** Chuyên viên nắm được thông tin buổi hẹn (Ngày giờ, Hình thức trực tuyến/trực tiếp, ghi chú vấn đề, điểm test DASS-21 nếu có).
  3. **Phê duyệt ca hẹn (Approve):** Nhấn nút duyệt -> Trạng thái chuyển thành `Approved`. Sinh viên nhận được thông báo xác nhận.
  4. **Từ chối / Đổi lịch (Reject):** Nhấn từ chối kèm lý do chuyên môn -> Trạng thái chuyển thành `Rejected`.
  5. **Mở cuộc họp tư vấn:** Đối với ca hẹn đã được duyệt (`Approved`), Chuyên viên bấm nút **"Mở phòng SafeRoom"** để bắt đầu buổi tham vấn.
- **Bộ lọc & Phân loại lịch hẹn:**
  - Lọc theo trạng thái: *Tất cả*, *Chờ duyệt*, *Đã xác nhận*, *Đã hoàn thành*, *Đã hủy*.
  - Lọc theo ngày/tuần làm việc.
- **Cơ chế Chống trùng lịch (Double Booking Guard):**
  - Tự động khóa khung giờ và ngăn chặn mọi thao tác đặt lịch trùng lặp.

---

### 2.3. Phòng Tư vấn Trực tuyến SafeRoom Live (`/expert/consultation`)
- **Giao diện Phòng Tham vấn An toàn:**
  - **Khu vực Video/Audio:** Kết nối phòng họp thời gian thực bảo mật cao.
  - **Bảng ghi chú ca tư vấn (Clinical Notes):** Cho phép chuyên viên vừa tham vấn vừa ghi chú tiến trình điều trị, chẩn đoán sơ bộ và phác đồ hỗ trợ.
  - **Khung Chat an toàn:** Trao đổi tài liệu, bài tập thư giãn và tin nhắn bảo mật với sinh viên.
  - **Bộ nút điều khiển phiên:** Bật/Tắt Mic, Bật/Tắt Cam, Chia sẻ màn hình, Kết thúc phiên & Hoàn tất ca hẹn.

---

### 2.4. Phân tích & Cảnh báo Triage Khẩn cấp (`/expert/analytics`)
- **Hệ thống Sàng lọc Triage tự động:**
  - Thuật toán AI phân tích tâm lý từ bài kiểm tra DASS-21 và nhật ký sinh viên để phân loại 4 cấp độ: `Low Risk`, `Moderate`, `High Risk`, `Crisis Alert` 🚨.
- **Bảng cảnh báo ca nguy cơ:**
  - Đánh dấu nổi bật các sinh viên có dấu hiệu trầm cảm nặng hoặc suy nghĩ tiêu cực cần can thiệp khẩn cấp.
  - Nút **"Liên hệ hỗ trợ khẩn cấp"** hoặc **"Chỉ định chuyên gia can thiệp sâu"**.
- **Biểu đồ xu hướng sức khỏe tâm thần:**
  - Phân tích biến động cảm xúc qua các tuần trong kỳ thi hoặc các sự kiện trường học.

---

### 2.5. Kiểm duyệt Bài viết Cộng đồng (`/expert/moderation`)
- **Chuyên môn hóa duyệt nội dung:**
  - Xem danh sách bài viết sinh viên bị hệ thống cảnh báo từ khóa nhạy cảm.
  - Chuyên gia đánh giá mức độ an toàn: Duyệt hiển thị (`Approve`), Yêu cầu ẩn bài (`Hide`), hoặc Chuyển sang diện theo dõi tâm lý đặc biệt.

---

### 2.6. Hồ sơ & Lịch làm việc Chuyên viên (`/expert/profile`)
- **Quản lý thông tin học vị & chuyên môn:**
  - Cập nhật chứng chỉ hành nghề, học vị, kinh nghiệm tham vấn.
- **Cấu hình ca làm việc (Time Slot Configuration):**
  - Thiết lập các khung giờ rảnh trong tuần để sinh viên đặt lịch.
  - Tạm khóa lịch khi có lịch công tác hoặc hội thảo.
