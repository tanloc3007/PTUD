# 🛡️ HƯỚNG DẪN GIAO DIỆN & TÍNH NĂNG — PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN PORTAL)
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Trường Đại học Lạc Hồng** — Môn: Phát triển Ứng dụng (PTUD)

---

## 1. Tổng quan phân hệ Quản trị viên
Phân hệ Admin là trung tâm điều hành toàn diện của UniMind, chịu trách nhiệm quản lý người dùng, cấu hình thang đo tâm lý, kiểm duyệt nội dung cộng đồng, quản trị từ khóa nhạy cảm, giám sát an toàn dữ liệu và theo dõi nhật ký hoạt động hệ thống (Audit Logs).

### Bộ nhận diện & Trải nghiệm:
- **Phong cách:** Màu sắc Indigo / Deep Violet sang trọng, chuyên nghiệp (`#4338ca` / `#818cf8`), lấy cảm hứng từ các hệ thống quản trị khách sạn và doanh nghiệp cao cấp.
- **Chế độ giao diện:** Hỗ trợ toàn diện **Chế độ Sáng / Tối (Light / Dark)** qua toggle icon Mặt trời ☀️ và Mặt trăng 🌙.
- **Bố cục:** Full-width sát mép 100% không gian màn hình, tối ưu hóa các bảng dữ liệu lớn (Data Tables) và các widget thống kê.

---

## 2. Chi tiết các Màn hình & Chức năng

### 2.1. Dashboard Tổng quan (`/admin/dashboard`)
- **Hàng thẻ chỉ số KPI tổng hợp:**
  - Tổng số sinh viên & chuyên viên đăng ký.
  - Tổng số nhật ký cảm xúc đã ghi nhận trong hệ thống.
  - Tổng số bài test tâm lý DASS-21 đã hoàn thành.
  - Tổng số ca tư vấn tâm lý đã thực hiện.
- **Biểu đồ Cột Thống kê Hoạt động (ModernBarChart):**
  - Cơ chế tự động tính toán chiều cao (Dynamic Ratio Scaling) giúp phân bố độ cao các cột trực quan, không bị tràn màn hình và không để trống chân biểu đồ.
  - Hover hiển thị tooltip chi tiết số lượng.
- **Biểu đồ Tròn Phân bố Cảm xúc Sinh viên (ModernDonutPieChart):**
  - Thống kê tỷ lệ phần trăm các sắc thái cảm xúc thực tế từ Database: `Happy` (Xanh lá), `Calm` (Xanh dương), `Stressed` (Cam), `Anxious` (Vàng), `Sad` (Tím nhạt), `Angry` (Đỏ).
  - Có chú giải Legend rõ ràng và hiển thị phần trăm chính xác.
- **Bảng Danh sách Bài viết Cần Kiểm duyệt Gấp:**
  - Đặt ngay tại chân Dashboard, hiển thị tức thì các bài viết bị gắn cờ vi phạm hoặc chứa từ khóa nguy cơ để Admin xử lý trong tích tắc.

---

### 2.2. Quản lý Người dùng (`/admin/users`)
- **Danh sách tài khoản trực quan:**
  - Hiển thị danh sách toàn bộ người dùng trong hệ thống (Sinh viên, Chuyên viên, Quản trị viên).
  - Tìm kiếm theo Tên, Email, MSSV, hoặc lọc theo vai trò (Role) và trạng thái (Active / Inactive).
- **Thao tác quản trị:**
  - Thêm mới tài khoản chuyên viên hoặc quản trị viên.
  - Khóa tài khoản (Deactivate) / Mở khóa (Activate) vi phạm quy tắc an toàn.
  - Đặt lại mật khẩu mặc định (Reset Password).
  - Xem chi tiết hồ sơ người dùng.

---

### 2.3. Báo cáo & Thống kê CSDL (`/admin/reports`)
- **Tổ chức bố cục khoa học:**
  - Tích hợp bộ lọc thời gian: *Hôm nay*, *7 ngày qua*, *30 ngày qua*, *Học kỳ này*, *Cả năm học*.
  - Biểu đồ thống kê số lượng ca tư vấn thành công, tỷ lệ hủy ca, thời gian phản hồi trung bình.
  - Phân tích tương quan giữa tần suất ghi nhật ký và mức độ cải thiện điểm số DASS-21.
  - Nút xuất báo cáo Excel / PDF phục vụ báo cáo khoa học và báo cáo cho Ban Giám hiệu nhà trường.

---

### 2.4. Kiểm duyệt Nội dung Cộng đồng (`/admin/moderation`)
- **Hàng đợi kiểm duyệt đa cấp:**
  - Danh sách bài đăng & bình luận bị người dùng báo cáo (User Reports).
  - Danh sách bài đăng tự động bị khóa do vi phạm bộ lọc từ khóa.
- **Công cụ kiểm duyệt:**
  - Xem nội dung nguyên bản và các cụm từ bị gắn cờ đỏ.
  - Phê duyệt cho phép hiển thị (`Approve`), Ẩn bài viết vĩnh viễn (`Hide/Delete`), hoặc Cảnh cáo tài khoản đăng bài.

---

### 2.5. Bộ lọc Từ khóa Nhạy cảm & Nguy cơ (`/admin/keywords`)
- **Quản lý từ điển từ khóa cấm:**
  - Danh sách các từ khóa nguy cơ tự tử / tự hại (Self-harm), bạo lực học đường, ngôn từ kích động, quấy rối.
  - Thiết lập mức độ nghiêm trọng: `Low`, `Medium`, `High`, `Critical Crisis`.
  - Thiết lập hành động tự động: Tự động gắn cờ (`Flag for Review`), Tự động ẩn (`Auto Hide`), hoặc Kích hoạt cảnh báo Triage khẩn cấp đến Chuyên gia tâm lý.
  - Thêm mới, chỉnh sửa, xóa từ khóa nhanh chóng.

---

### 2.6. Quản lý Thang đo & Bộ trắc nghiệm Tâm lý (`/admin/tests`)
- **Cấu hình bộ câu hỏi DASS-21 & thang đo khác:**
  - Xem danh sách bộ câu hỏi tâm lý học chuẩn hóa.
  - Thiết lập ngưỡng điểm (Cutoff scores) cho từng mức độ: Bình thường, Nhẹ, Vừa, Nặng, Rất nặng.
  - Kích hoạt / Ẩn bài test khỏi giao diện sinh viên.

---

### 2.7. Nhật ký Hệ thống — Audit Logs (`/admin/audit-logs`)
- **Chuẩn giao diện Enterprise Logging (Lấy cảm hứng từ HotelManagement):**
  - **Khối chỉ số hoạt động:** Tổng số sự kiện, Số lượt đăng nhập, Số thay đổi cấu hình, Số cảnh báo bảo mật.
  - **Bảng dữ liệu nhật ký chi tiết:**
    - Thời gian thực (Timestamp chính xác đến giây).
    - Người thực hiện (User ID / Tên / Email / Role).
    - Hành động (Action: `LOGIN`, `UPDATE_USER`, `APPROVE_POST`, `CHANGE_PASSWORD`, `APPOINTMENT_STATUS_CHANGE`).
    - Đối tượng tác động (Target Entity & Entity ID).
    - Địa chỉ IP & Trạng thái kết quả (`SUCCESS` 🟢 / `FAILED` 🔴).
    - Chi tiết payload thay đổi (Old Value vs New Value).
  - **Bộ lọc tìm kiếm đa chiều:** Lọc theo người thực hiện, khoảng thời gian, loại hành động và trạng thái.
