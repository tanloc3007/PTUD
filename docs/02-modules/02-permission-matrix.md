# 02. PERMISSION MATRIX (MA TRẬN PHÂN QUYỀN HỆ THỐNG)
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — B | Bước 07**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Nguyên tắc Phân quyền (Security & Authorization Principles)
1. **Phân quyền đa tầng (Multi-tier Enforcement):** Phân quyền bắt buộc phải được kiểm tra và thực thi tại tầng **Backend WebAPI** (thông qua Claims, JWT Token và Database Queries), tuyệt đối không chỉ ẩn/hiện nút ở giao diện Frontend.
2. **Nguyên tắc Quyền tối thiểu (Principle of Least Privilege):** Mỗi người dùng chỉ được cấp quyền vừa đủ để hoàn thành chức năng nghiệp vụ của mình.
3. **Nguyên tắc Không can thiệp riêng tư (Privacy Non-Intervention):** Quản trị viên và Chuyên viên không được cấp quyền đọc trộm dữ liệu cá nhân nhạy cảm (nhật ký cảm xúc riêng tư của sinh viên).

---

## 2. Ma trận Phân quyền Cốt lõi (Core RBAC Matrix)

| Hành động / Tác vụ nghiệp vụ | Sinh viên (Student) | Chuyên viên (Expert) | Quản trị viên (Admin) | Phạm vi kiểm soát dữ liệu |
| :--- | :---: | :---: | :---: | :--- |
| **Đăng ký tài khoản mới** | Có | Không | Có | Tạo tài khoản vai trò tương ứng |
| **Đăng nhập & Nhận JWT** | Có | Có | Có | Xác thực qua email & mật khẩu băm |
| **Viết & Xem nhật ký cảm xúc** | Có (Của mình) | Không | Không | `WHERE StudentId = CurrentUserId` |
| **Làm trắc nghiệm DASS-21 / PHQ-9 / GAD-7** | Có | Có (Thử nghiệm) | Có (Thử nghiệm) | `WHERE StudentId = CurrentUserId` |
| **Xem kết quả trắc nghiệm cá nhân** | Có (Của mình) | Có (Trong ca hẹn) | Không | Sinh viên xem của mình; Chuyên viên chỉ xem khi sinh viên đặt hẹn |
| **Đăng bài viết ẩn danh 2 cột** | Có | Có | Có | Tự động áp dụng bí danh ẩn danh |
| **Đăng bình luận kèm ảnh Cloudinary** | Có | Có (Gắn huy hiệu 🎓) | Có | Đính kèm ảnh chuẩn Facebook |
| **Thả tim / Đồng cảm bài viết** | Có | Có | Có | Cộng dồn số lượt tương tác |
| **Đặt lịch tư vấn tâm lý** | Có | Không | Không | Sinh viên đặt với chuyên viên |
| **Hủy yêu cầu đặt lịch** | Có (Trước khi duyệt) | Không | Có (Khi khẩn cấp) | Giải phóng khung giờ rảnh |
| **Cấu hình khung giờ rảnh làm việc** | Không | Có (Của mình) | Có | `WHERE ExpertId = CurrentExpertId` |
| **Phê duyệt / Từ chối yêu cầu ca hẹn** | Không | Có (Của mình) | Có | Chuyên viên được phân công ca hẹn |
| **Mở phòng họp trực tuyến SafeCall** | Không | Có (Ca của mình) | Không | Chỉ chuyên viên của ca hẹn mới có quyền mở |
| **Tham gia phòng họp trực tuyến SafeCall** | Có (Đúng ca hẹn) | Có (Đúng ca hẹn) | Không | **Zero-Trust**: Đúng 2 người trong ca hẹn mới được vào |
| **Ghi sổ tay chuyên môn sau ca hẹn** | Không | Có (Ca của mình) | Không | Ghi chép lâm sàng bảo mật |
| **Duyệt / Ẩn bài viết và bình luận bị gắn cờ** | Không | Có (Nếu có quyền) | Có | Thao tác 3 nút: Duyệt / Tạm ẩn / Từ chối |
| **Xem báo động đỏ khẩn cấp NLP Alert** | Không | Có (Nếu có quyền) | Có | Can thiệp hỗ trợ tức thì |
| **Quản lý danh sách người dùng** | Không | Không | Có | Toàn hệ thống |
| **Khóa / Mở khóa tài khoản người dùng** | Không | Không | Có | Ghi nhận Audit Log bắt buộc |
| **Phân quyền động cho chuyên viên** | Không | Không | Có | Cấu hình chuỗi `Permissions` |
| **Quản lý bộ từ khóa nhạy cảm** | Không | Có (Đề xuất) | Có | Thêm, sửa, xóa, phân loại nguy cơ |
| **Tra cứu Audit Log bất biến** | Không | Không | Có | Chỉ đọc (`Read-only`), không sửa/xóa |
| **Xem báo cáo & biểu đồ thống kê** | Không | Có (Theo quyền) | Có | Báo cáo phân tích số liệu |

---

## 3. Ma trận Phân quyền Động Chuyên viên (Expert Dynamic Permissions Matrix)
Hệ thống UniMind hỗ trợ Admin cấu hình các mã quyền độc lập trong trường `Experts.Permissions`:

| Mã quyền (Permission Code) | Tên quyền hạn | Ý nghĩa & Phạm vi chức năng được phép truy cập |
| :--- | :--- | :--- |
| `PERM_WORKSPACE` | Không gian làm việc ca trực | Tiếp nhận, phê duyệt/từ chối lịch hẹn, mở phòng họp SafeCall và ghi sổ tay lâm sàng. |
| `PERM_SCHEDULE` | Quản lý lịch rảnh | Thêm, sửa, đóng/mở các khung giờ làm việc theo ngày/tuần. |
| `PERM_ANALYTICS` | Phân tích sức khỏe tinh thần | Xem báo cáo phân tích xu hướng cảm xúc và kết quả trắc nghiệm sinh viên ẩn danh. |
| `PERM_MODERATION` | Kiểm duyệt nội dung | Truy cập tab duyệt bài viết, bình luận bị AI gắn cờ và xử lý cảnh báo nguy cơ NLP. |
