# 📘 HƯỚNG DẪN GIAO DIỆN & TÍNH NĂNG — PHÂN HỆ SINH VIÊN (STUDENT PORTAL)
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Trường Đại học Lạc Hồng** — Môn: Phát triển Ứng dụng (PTUD)

---

## 1. Tổng quan phân hệ Sinh viên
Phân hệ Sinh viên là không gian an toàn, riêng tư và bảo mật được thiết kế dành riêng cho sinh viên để theo dõi sức khỏe tâm thần, giải tỏa cảm xúc và kết nối với các chuyên gia tâm lý học đường.

### Bộ nhận diện & Trải nghiệm người dùng:
- **Phong cách:** Hiện đại, nhẹ nhàng, ấm áp, tạo cảm giác an tâm và tin cậy (Màu chủ đạo: Indigo / Teal / Rose).
- **Chế độ hiển thị:** Hỗ trợ đầy đủ **Sáng / Tối (Light / Dark mode)** với nút chuyển đổi nhanh trực quan hình Mặt trời ☀️ và Mặt trăng 🌙.
- **Tính năng bảo mật cốt lõi:** Bảo đảm ẩn danh 100% khi tương tác cộng đồng. Danh tính thật (MSSV, họ tên, email) được mã hóa và tách biệt khỏi các bài đăng công khai.

---

## 2. Chi tiết các Màn hình & Chức năng

### 2.1. Trang chủ Sinh viên (`/`)
- **Giao diện Hero Banner:**
  - Lời chào cá nhân hóa theo thời gian trong ngày (Sáng/Chiều/Tối).
  - Quick action: "Ghi nhật ký ngay", "Làm bài test DASS-21", "Đặt lịch chuyên gia", "Vào Phòng An Yên".
- **Thống kê cảm xúc tuần qua:**
  - Widget tóm tắt trạng thái tâm lý gần nhất với biểu tượng cảm xúc (Vui vẻ, Bình yên, Căng thẳng, Lo âu, Buồn bã).
- **Lối tắt nhanh:**
  - Xem danh sách cuộc hẹn sắp diễn ra với Chuyên viên tâm lý.
  - Xem các bài viết cộng đồng thịnh hành trong ngày.

---

### 2.2. Nhật ký Cảm xúc & Phân tích AI Sentiment (`/journal`)
- **Chức năng chính:**
  - **Ghi nhật ký hàng ngày:** Nhập tiêu đề, nội dung tâm tư, chọn thang điểm cảm xúc (1 - 10) và gắn nhãn cảm xúc chính (`Happy`, `Calm`, `Stressed`, `Anxious`, `Sad`, `Angry`).
  - **Tích hợp AI Sentiment Analysis:** Khi lưu nhật ký, hệ thống tự động phân tích ngữ nghĩa nội dung để chấm điểm cảm xúc (Sentiment Score), cảnh báo mức độ rủi ro tâm lý tiềm ẩn.
  - **Timeline lịch sử nhật ký:** Xem lại toàn bộ các bài viết theo dòng thời gian trực quan, hỗ trợ tìm kiếm và lọc theo nhãn cảm xúc hoặc khoảng thời gian.
  - **Bảo mật nhật ký:** Dữ liệu nhật ký là riêng tư tuyệt đối (Private), chỉ chính sinh viên mới có quyền đọc và chỉnh sửa.

---

### 2.3. Góc chia sẻ Cộng đồng Ẩn danh (`/community`)
- **Chức năng chính:**
  - **Đăng bài ẩn danh:** Sinh viên có thể chia sẻ tâm sự, khó khăn trong học tập, tình cảm hoặc áp lực thi cử mà không sợ bị lộ danh tính (Hệ thống tự gán biệt danh ngẫu nhiên như `Thỏ Trắng Ẩn Danh`, `Cáo Nhút Nhát #82`).
  - **Tự động lọc từ khóa nhạy cảm:** Mọi bài viết trước khi hiển thị đều qua bộ lọc kiểm duyệt từ khóa độc hại, ngôn từ tiêu cực hoặc dấu hiệu khủng hoảng.
  - **Tương tác cộng đồng:** Thả tim ❤️, tương tác biểu cảm, gửi bình luận động viên ẩn danh giữa các bạn sinh viên.
  - **Báo cáo vi phạm (Report):** Cho phép người dùng báo cáo bài viết hoặc bình luận có nội dung không phù hợp để Chuyên viên/Admin kiểm duyệt.

---

### 2.4. Trắc nghiệm Tâm lý DASS-21 (`/tests` & `/tests/:id`)
- **Chức năng chính:**
  - **Bộ câu hỏi tiêu chuẩn DASS-21:** Gồm 21 câu hỏi đánh giá 3 trạng thái: **Trầm cảm (Depression)**, **Lo âu (Anxiety)**, và **Căng thẳng (Stress)**.
  - **Giao diện làm bài trực quan:** Chia câu hỏi theo từng bước rõ ràng, hỗ trợ chọn thang đo tần suất 0 - 3 (Không bao giờ, Thỉnh thoảng, Thường xuyên, Rất thường xuyên).
  - **Biểu đồ radar/kết quả tự động:** Trả về kết quả phân loại mức độ: *Bình thường*, *Nhẹ*, *Vừa*, *Nặng*, *Rất nặng*.
  - **Gợi ý can thiệp tức thì:** Nếu kết quả ở mức *Nặng* hoặc *Rất nặng*, hệ thống tự động đề xuất sinh viên đặt lịch hẹn khẩn với Chuyên gia tâm lý.

---

### 2.5. Đặt lịch Tư vấn với Chuyên gia (`/booking`)
- **Chức năng chính:**
  - **Danh sách Chuyên viên tâm lý:** Hiển thị danh sách các chuyên gia với hình ảnh, học vị, chuyên môn (Tâm lý học đường, Trầm cảm - Lo âu, Hướng nghiệp), và xếp hạng đánh giá.
  - **Chọn ngày & Khung giờ (Time Slot):** Hiển thị lịch rảnh theo thời gian thực của chuyên viên.
  - **Cơ chế Chống trùng lịch (Double Booking Prevention):** Kiểm tra tức thì trên CSDL, khóa khung giờ đã có người đặt hoặc đang chờ duyệt.
  - **Chọn hình thức tư vấn:** Trực tuyến qua **Phòng An Yên SafeRoom Live** hoặc Tư vấn trực tiếp tại Văn phòng Tư vấn Tâm lý ĐH Lạc Hồng.
  - **Ghi chú vấn đề cần hỗ trợ:** Cho phép sinh viên tóm tắt ngắn gọn tâm tư hoặc gửi đính kèm kết quả DASS-21 để chuyên viên nắm trước tình hình.
  - **Trạng thái lịch hẹn:** Theo dõi trạng thái ca tư vấn: `Đang chờ duyệt (Pending)` ⏳, `Đã chấp nhận (Approved)` ✅, `Từ chối (Rejected)` ❌, `Đã hoàn thành (Completed)` 🏁.

---

### 2.6. Phòng An Yên — SafeRoom Live (`/saferoom` & `/saferoom/:sessionId`)
- **Chức năng chính:**
  - **Không gian thư giãn tự thân:**
    - Âm thanh thiên nhiên trị liệu (Tiếng mưa rơi, Tiếng sóng biển, Rừng thông, Tiếng đàn piano lofi).
    - Hướng dẫn bài tập hít thở 4-7-8 điều hòa nhịp tim và giảm căng thẳng tức thì.
  - **Phòng tư vấn trực tuyến 1-1 với Chuyên gia:**
    - Khi lịch hẹn được Chuyên viên duyệt và mở phiên, sinh viên bấm **"Vào phòng tư vấn"**.
    - Tính năng trò chuyện trực tuyến bảo mật thời gian thực, bật/tắt camera/mic, chia sẻ cảm xúc an toàn tuyệt đối.

---

### 2.7. Quản lý Tài khoản & Hồ sơ Cá nhân (`/profile`)
- **Chức năng chính:**
  - Cập nhật thông tin cơ bản, đổi mật khẩu.
  - Xem thống kê tổng quan: Số ngày liên tiếp ghi nhật ký (Streak), Số bài test đã làm, Số buổi tư vấn đã tham gia.
  - Tùy chọn cài đặt quyền riêng tư và thông báo.
