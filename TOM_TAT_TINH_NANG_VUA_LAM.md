# TÓM TẮT CÁC TÍNH NĂNG VÀ CÁCH THỰC HIỆN VỪA LÀM
> **Dự án**: Hệ thống Nhật ký cảm xúc & Tư vấn tâm lý sinh viên (UniMind)  
> **Nhánh**: `LMLuan` | **Tác giả**: Lê Minh Luân (MSSV: 120000352)

---

## 1. Công nghệ Cuộc họp Tư vấn Mới (Không Cần Mã Mời)

* **Vấn đề cũ**: Chuyên viên mở phòng phải copy mã mời gửi cho sinh viên, sinh viên phải nhập tay mã mới vào được (bất tiện và dễ nhầm lẫn).
* **Cách làm mới**:
  * Khi Chuyên viên bấm **"🌐 Bắt đầu cuộc họp trực tuyến"** tại `/expert/consultation`, hệ thống lưu trạng thái `IsMeetingActive = true` và `ActiveMeetingRoomUrl`.
  * Giao diện Sinh viên (`StudentLayout.jsx`) liên tục kiểm tra nếu có ca hẹn của mình đang mở thì hiển thị ngay **Banner nổi màu xanh lá**: *"Chuyên viên đang đợi bạn! Cuộc họp đang mở"* kèm nút **"🎥 Tham gia ngay"**.
  * Sinh viên bấm nút là vào thẳng phòng họp trực tuyến (WebRTC P2P thuần túy 100% tự tổ chức, không phụ thuộc bên thứ 3).
  * **Bảo mật Zero-Trust (403 Forbidden)**: Tại trang `StudentMeetingRoomPage.jsx`, hệ thống kiểm tra nếu sinh viên đăng nhập không phải là người đặt lịch ca hẹn này thì lập tức chặn lại và hiện màn hình đỏ từ chối truy cập.
* **Tệp chỉnh sửa/tạo mới**:
  * `frontend/src/features/student/pages/StudentMeetingRoomPage.jsx` *(Mới)*
  * `frontend/src/app/layouts/StudentLayout.jsx`
  * `frontend/src/features/expert/pages/ConsultationRoomPage.jsx`

---

## 2. Chuẩn hóa Bài Test Tâm lý DASS-21, PHQ-9 & GAD-7

* **Vấn đề cũ**: Cần kiểm tra xem bài test DASS-21 có đúng chuẩn thực tế y khoa không và bổ sung thang đo chuẩn.
* **Cách làm**:
  * Chuẩn hóa bài test **DASS-21** theo chuẩn lâm sàng Lovibond (1995): gồm đúng **21 câu hỏi** chia đều 3 nhóm (7 Trầm cảm, 7 Lo âu, 7 Căng thẳng).
  * Điểm thô được nhân đôi ($x2$) đưa về thang chuẩn $0 - 42$. Tự động đánh giá phân tầng (Bình thường / Nhẹ / Vừa / Nặng / Cực kỳ nghiêm trọng).
  * Thêm 2 bài test chuẩn quốc tế khác bằng hệ thống Tab:
    * **PHQ-9**: Đánh giá trầm cảm 9 câu hỏi chuẩn.
    * **GAD-7**: Đánh giá lo âu tổng quát 7 câu hỏi chuẩn.
  * Tự động cảnh báo và gợi ý đặt lịch tư vấn khi phát hiện điểm số vượt ngưỡng an toàn.
* **Tệp chỉnh sửa**:
  * `frontend/src/features/student/pages/TestPage.jsx`

---

## 3. Đăng ký Khóa học Cho Nhập Tay Tự Do

* **Vấn đề cũ**: Ô chọn khóa học dạng dropdown bắt buộc chọn danh sách có sẵn, sinh viên khó nhập đúng khóa thực tế.
* **Cách làm**: Chuyển ô chọn sang ô nhập chữ tự do (`<input type="text" placeholder="VD: K2021, K2022, K2023..." />`), hỗ trợ validate đầy đủ.
* **Tệp chỉnh sửa**:
  * `frontend/src/features/auth/pages/RegisterPage.jsx`

---

## 4. Giao diện Đăng bài Facebook-Style 2 Cột (Có Xem Trước)

* **Vấn đề cũ**: Form đăng bài đơn điệu, không xem trước được nội dung và ảnh hiển thị.
* **Cách làm**:
  * Thiết kế lại giao diện đăng bài dạng **2 cột song song**:
    * **Cột trái (Soạn thảo)**: Chọn ẩn danh / công khai, chọn tâm trạng, chọn màu nền gradient, dán link ảnh hoặc chọn ảnh mẫu tĩnh tâm thiên nhiên, chọn nhãn AI Sentiment.
    * **Cột phải (Live Preview)**: Hiển thị ngay tức thì bản xem trước bài viết thực tế trông như thế nào khi đăng lên bảng tin.
* **Tệp chỉnh sửa**:
  * `frontend/src/features/student/pages/CommunityFeedPage.jsx`

---

## 5. Viết lại Bộ Danh mục Góc Chia Sẻ Chung Chung & Tích Cực

* **Vấn đề cũ**: Các danh mục cũ mang sắc thái tiêu cực hoặc quá cụ thể (*Áp lực học tập, Mối quan hệ & Gia đình, Cô đơn & Lạc lõng...*).
* **Cách làm**:
  * Đổi sang bộ tên mới nhẹ nhàng, gần gũi, bao quát:
    1. **Áp lực học tập** $\rightarrow$ **Góc học tập** *(theo đúng yêu cầu)*
    2. **Mối quan hệ & Gia đình** $\rightarrow$ **Gia đình & Bạn bè**
    3. **Chia sẻ tích cực** $\rightarrow$ **Chuyện thường ngày**
    4. **Cô đơn & Lạc lõng** $\rightarrow$ **Góc tâm sự**
    5. **Việc làm & Tài chính** $\rightarrow$ **Định hướng & Tương lai**
  * **Cơ chế Alias ở Backend**: Tại `ServiceImplementations.cs`, khi sinh viên bấm lọc "Góc học tập", hệ thống tìm cả bài mới lẫn bài cũ mang nhãn "Áp lực học tập", đảm bảo không bị mất dữ liệu cũ.
  * Đồng bộ nhãn mới lên cả trang kiểm duyệt của Admin.
* **Tệp chỉnh sửa**:
  * `frontend/src/features/student/pages/CommunityFeedPage.jsx`
  * `frontend/src/features/admin/pages/ModerationPage.jsx`
  * `backend/src/Core/Application/Features/ServiceImplementations.cs`

---

## 6. Chuyển Nút Bình luận Sang Bên Trái

* **Vấn đề cũ**: Nút "Bình luận (0)" nằm tách biệt ở góc phải của bài viết.
* **Cách làm**: Đưa nút "Bình luận" về chung một hàng bên trái với "Thích" và "Đồng cảm", tạo thành một cụm tương tác gọn gàng:  
  👉 **`[ Thích (0) ]` `[ Đồng cảm (0) ]` `[ Bình luận (0) ]`**
* **Tệp chỉnh sửa**:
  * `frontend/src/features/student/pages/CommunityFeedPage.jsx`

---

## 7. Bảng Phân quyền Chuyên viên & Audit Log Quản trị viên

* **Cách làm**:
  * Thêm tính năng **Audit Log**: Ghi vết tự động mọi hành động của Admin (khóa user, duyệt bài, duyệt ảnh, thêm từ khóa nhạy cảm).
  * Thêm **Ma trận phân quyền chuyên viên**: Admin có thể chỉ định chuyên viên 1 chỉ xem Dashboard/Lịch hẹn, chuyên viên 2 chỉ xem Phân tích/Kiểm duyệt bài viết.
* **Tệp chỉnh sửa**:
  * `frontend/src/features/admin/pages/UsersPage.jsx`
  * `frontend/src/features/admin/pages/AuditLogsPage.jsx`
  * `backend/src/Core/Application/Features/ServiceImplementations.cs`

---

## 8. Hướng dẫn Test Nhanh (Dành cho Báo cáo / Thuyết minh)

1. **Test phòng họp không cần mã**:
   * Mở 1 tab ẩn danh đăng nhập Chuyên viên (`expert` / `123456`) $\rightarrow$ Bấm mở họp.
   * Mở 1 tab đăng nhập Sinh viên (`student` / `123456`) $\rightarrow$ Thấy thông báo xanh nổi lên $\rightarrow$ Bấm tham gia ngay.
2. **Test bài test tâm lý**:
   * Vào `/student/test` $\rightarrow$ Thấy 3 tab DASS-21, PHQ-9, GAD-7.
3. **Test đăng bài & xem danh mục**:
   * Vào `/student/community` $\rightarrow$ Thấy thanh lọc: *Góc học tập, Gia đình & Bạn bè, Chuyện thường ngày, Góc tâm sự, Định hướng & Tương lai*.
   * Nhìn xuống chân bài đăng $\rightarrow$ Thấy 3 nút `Thích`, `Đồng cảm`, `Bình luận` nằm chung bên trái.
   * Bấm vào ô đăng bài $\rightarrow$ Trải nghiệm giao diện 2 cột có Live Preview trực quan.

---

## 9. Đăng Bình luận Kèm Ảnh Chuẩn Facebook & Kiểm duyệt AI Từ khóa Nhạy cảm

* **Bình luận phong cách Facebook**:
  * **Khung nhập bình luận**: Thiết kế bo tròn dạng pill (`#f0f2f5`), hiển thị avatar của sinh viên, có nút icon 📷 để chọn và upload ảnh trực tiếp lên **Cloudinary** (`kh0hrw3c`).
  * **Xem trước ảnh (Preview)**: Sau khi chọn ảnh, hiển thị khung ảnh thu nhỏ kèm nút `✕` để xóa ảnh trước khi bấm gửi. Cho phép gửi bình luận chỉ có chữ, chỉ có ảnh hoặc cả chữ và ảnh.
  * **Bong bóng bình luận (Speech bubble)**: Giao diện bo tròn mềm mại giống Facebook, hiển thị avatar người bình luận, tên biệt danh ẩn danh, nhãn "Chuyên viên Tâm lý 🎓" (nếu là chuyên gia), nội dung chữ, ảnh đính kèm có thể nhấp để phóng to toàn màn hình, thời gian (`1 phút trước`, `Vừa xong`), nút `Thích` và `Phản hồi`.
* **Cơ chế Kiểm duyệt AI & Từ khóa Nhạy cảm**:
  * Khi sinh viên gửi bình luận có chứa từ khóa nhạy cảm (tự tử, chết đi, tiêu cực nặng,...) hoặc AI phát hiện nguy cơ cao ($RiskScore \ge 75$):
    * Bình luận được tự động gán trạng thái `Flagged` và ẩn khỏi sinh viên thông thường (`IsSensitiveHiddenFromStudents = true`).
    * Tự động sinh cảnh báo can thiệp nguy cơ vào bảng `dbo.NlpRiskAlerts`.
    * Sinh viên nhận được thông báo nhẹ nhàng: *"Bình luận đang được kiểm duyệt bởi chuyên gia tâm lý"*.
* **Giao diện Kiểm duyệt dành cho Admin & Chuyên viên**:
  * Bổ sung tab **"Bình luận cần duyệt"** tại trang `/admin/moderation` và `/expert/moderation`.
  * Hiển thị danh sách bình luận bị gắn cờ, kèm ảnh đính kèm và từ khóa phát hiện.
  * Hỗ trợ 3 nút xử lý nhanh: **`✓ Duyệt hiển thị`**, **`👁️ Tạm ẩn`**, **`✕ Từ chối vi phạm`**.
* **Tệp chỉnh sửa/triển khai**:
  * `backend/src/Core/Domain/Entities/DomainEntities.cs`
  * `backend/src/Core/Application/Common/Models/Dtos.cs`
  * `backend/src/Core/Application/Features/Services.cs`
  * `backend/src/Core/Application/Features/ServiceImplementations.cs`
  * `backend/src/Infrastructure/Persistence/Context/ApplicationDbContext.cs`
  * `backend/src/Presentation/WebAPI/Controllers/Controllers.cs`
  * `frontend/src/features/student/pages/CommunityFeedPage.jsx`
  * `frontend/src/features/admin/pages/ModerationPage.jsx`
  * `frontend/src/features/expert/pages/ModerationPage.jsx`
