# 02. SCREEN SPECIFICATIONS (ĐẶC TẢ CHI TIẾT MÀN HÌNH & 5 TRẠNG THÁI)
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — Mẫu 06 & Bước 09**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Mẫu Đặc tả Màn hình Chuẩn
Mỗi màn hình trong hệ thống bắt buộc phải được đặc tả đầy đủ các khối thông tin, thành phần UI, ràng buộc dữ liệu, quy tắc responsive và **5 trạng thái giao diện chuẩn**:
1. **Loading State:** Trạng thái đang tải dữ liệu (Skeleton loader hoặc spinner mượt mà).
2. **Empty State:** Trạng thái chưa có dữ liệu (Hình minh họa ấm áp, thông điệp hướng dẫn nhẹ nhàng).
3. **Error State:** Trạng thái lỗi mạng hoặc máy chủ (Thông báo lỗi thân thiện, nút thử lại).
4. **Success State:** Trạng thái hoạt động bình thường, hiển thị đầy đủ dữ liệu.
5. **Denied State:** Trạng thái từ chối quyền truy cập (Zero-Trust `403 Forbidden`).

---

## 2. Đặc tả Chi tiết Các Màn hình Trọng yếu

### SCR-007: Đặt lịch tư vấn tâm lý (Consultation Booking Page)
- **Route:** `/student/booking`
- **Actor:** Sinh viên (ACT-STU) | **Story liên kết:** US-008 | **Use Case liên kết:** UC-005
- **Thành phần UI chính:**
  - Danh sách thẻ Chuyên gia (Avatar, Học hàm, Chuyên môn, Số năm kinh nghiệm, Đánh giá sao, Nút chọn).
  - Lịch chọn ngày (Calendar view trực quan với đánh dấu ngày có ca trực).
  - Lưới các khung giờ rảnh (TimeSlot Grid) phân biệt hình thức Trực tiếp (P.302) và Trực tuyến (SafeCall).
  - Khung nhập lý do tư vấn, ghi chú tâm sự và chọn bí danh ẩn danh.
  - Nút bấm chính: `[ Xác nhận đặt lịch hẹn ]`.
- **5 Trạng thái Giao diện:**
  - *Loading:* Hiển thị khung xương xám (Skeleton) tại danh sách chuyên gia và bảng lịch.
  - *Empty:* Ngày đã chọn không có khung giờ rảnh nào -> Hiện thông báo: *"Chuyên gia không có lịch trực vào ngày này. Bạn hãy chọn ngày khác nhé!"*.
  - *Error:* Lỗi kết nối CSDL -> Hiện banner đỏ: *"Không thể tải lịch hẹn. Vui lòng kiểm tra kết nối mạng và thử lại"*.
  - *Success:* Hiển thị đầy đủ danh sách ca rảnh, khi đặt thành công hiển thị modal xác nhận kèm mã `ST-xxxx`.
  - *Denied:* Nếu người dùng chưa đăng nhập, tự động chuyển hướng sang `/login?redirect=/student/booking`.
- **Responsive & Accessibility:** 
  - Mobile (<768px): Thẻ chuyên gia xếp chồng 1 cột, lưới giờ tự co dãn 2 cột.
  - Hỗ trợ chọn giờ hoàn toàn bằng phím mũi tên và phím `Space/Enter`.

---

### SCR-009: Phòng tư vấn trực tuyến SafeCall (Student Meeting Room)
- **Route:** `/student/meeting-room?appointmentId={guid}`
- **Actor:** Sinh viên sở hữu ca hẹn (ACT-STU) | **Story liên kết:** US-009 | **Use Case liên kết:** UC-006
- **Thành phần UI chính:**
  - Khung hình video trực tuyến P2P (Camera Chuyên gia kích thước lớn, Camera Sinh viên thu nhỏ góc phải).
  - Thanh công cụ điều khiển cuộc gọi dưới đáy: Nút Bật/Tắt Micro 🎙️, Nút Bật/Tắt Camera 📹, Nút Chia sẻ Màn hình 🖥️, Nút Kết thúc Cuộc gọi 🔴.
  - Khung chat văn bản nhanh hỗ trợ gửi tin nhắn trực tiếp trong cuộc gọi.
  - Huy hiệu bảo mật: *"Phiên gọi WebRTC mã hóa đầu cuối P2P — An toàn & Ẩn danh tuyệt đối"*.
- **5 Trạng thái Giao diện:**
  - *Loading:* Vòng quay kết nối ICE/STUN kèm thông báo: *"Đang thiết lập kết nối an toàn với chuyên viên..."*.
  - *Empty:* Chuyên viên chưa bật camera -> Hiện hình đại diện avatar chuyên gia với sóng âm thanh nhấp nháy khi nói.
  - *Error:* Mất kết nối WebRTC -> Banner vàng: *"Mạng chập chờn. Đang tự động kết nối lại..."*.
  - *Success:* Hai bên nhìn thấy và nghe thấy nhau mượt mà với độ trễ thấp (<200ms).
  - *Denied (Zero-Trust):* Sinh viên đăng nhập khác với sinh viên đặt lịch -> **Màn hình đỏ cảnh báo**:  
    `⛔ 403 FORBIDDEN — Bạn không có quyền truy cập vào cuộc họp này! Vì tính bảo mật riêng tư, chỉ sinh viên sở hữu ca hẹn mới được phép vào.`
- **Responsive:** Co dãn video toàn màn hình trên điện thoại, tự động xoay ngang video khi xoay màn hình.

---

### SCR-006: Góc chia sẻ ẩn danh (Community Feed & Facebook Comment)
- **Route:** `/student/community`
- **Actor:** Sinh viên (ACT-STU), Chuyên gia (ACT-EXP), Admin (ACT-ADM) | **Story liên kết:** US-006, US-007 | **Use Case liên kết:** UC-004
- **Thành phần UI chính:**
  - Khung soạn thảo bài viết **2 cột song song**: Cột trái chỉnh sửa & chọn danh mục (*Góc học tập, Gia đình & Bạn bè, Chuyện thường ngày, Góc tâm sự, Định hướng & Tương lai*); Cột phải **Live Preview**.
  - Thanh lọc danh mục thân thiện hỗ trợ cơ chế Alias với dữ liệu cũ.
  - Danh sách bài viết dạng thẻ mềm mại, tác giả hiển thị bí danh bảo mật (VD: `"Cú Mèo Say Ngủ #402"`).
  - Cụm nút tương tác bên trái chân bài viết: `[ Thích (x) ]`, `[ Đồng cảm (y) ]`, `[ Bình luận (z) ]`.
  - Khung bình luận bong bóng chuẩn Facebook: Avatar tròn, ô nhập text bo tròn `#f0f2f5`, icon 📷 chọn ảnh upload Cloudinary, xem trước ảnh thu nhỏ kèm nút `✕` xóa, ảnh đính kèm có thể nhấp để phóng to toàn màn hình.
- **5 Trạng thái Giao diện:**
  - *Loading:* Thẻ bài viết Skeleton hiển thị hiệu ứng ánh sáng chạy ngang.
  - *Empty:* Danh mục chưa có bài viết nào -> Hiện tranh vẽ minh họa: *"Chưa có bài viết nào trong chủ đề này. Hãy là người đầu tiên chia sẻ tâm sự nhé!"*.
  - *Error:* Lỗi tải bảng tin -> Nút *"Thử tải lại"*.
  - *Success:* Cuộn trang vô tận hoặc phân trang mượt mà, bài viết mới đăng hiển thị tức thì.
  - *Denied:* Người dùng bị khóa tài khoản cố tình tương tác -> Banner thông báo: *"Tài khoản của bạn đang bị tạm khóa. Vui lòng liên hệ Admin"*.

---

### SCR-004: Nhật ký cảm xúc & Biểu đồ tâm trạng (Mood Journal Page)
- **Route:** `/student/journal`
- **Actor:** Sinh viên (ACT-STU) | **Story liên kết:** US-003, US-004 | **Use Case liên kết:** UC-002
- **Thành phần UI chính:**
  - Bộ 5 icon cảm xúc lớn có hiệu ứng vi mô: Tuyệt vời 🌟, Bình yên 🍃, Căng thẳng ⚡, Mệt mỏi 🌧️, Buồn bã 💧.
  - Thanh trượt mức năng lượng trực quan từ 1 đến 10.
  - Vùng nhập văn bản nhật ký riêng tư kèm nút *"Lưu nhật ký & Phân tích AI"*.
  - Khung phản hồi thấu cảm từ AI và bài tập thở nhịp điệu (Visual Breathing Circle).
  - Biểu đồ biến thiên năng lượng và trạng thái tâm trạng 7 ngày gần nhất.
- **5 Trạng thái Giao diện:**
  - *Loading:* Biểu đồ hiển thị hiệu ứng mờ kèm vòng xoay tải dữ liệu.
  - *Empty:* Sinh viên mới chưa viết nhật ký -> Hiện thông điệp động viên: *"Hôm nay bạn thế nào? Hãy viết một vài dòng để lắng nghe bản thân nhé!"*.
  - *Error:* Lỗi gọi AI phân tích -> Hệ thống vẫn lưu nhật ký an toàn và trả về phản hồi mặc định ấm áp.
  - *Success:* Biểu đồ vẽ các đường cong năng lượng mượt mà, phân tích cảm xúc hiển thị màu tương ứng.
  - *Denied:* Bất kỳ ai không phải chủ sở hữu bài nhật ký truy cập -> Trả về lỗi `403 Forbidden`.
