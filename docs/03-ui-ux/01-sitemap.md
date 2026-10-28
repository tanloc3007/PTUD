# 01. SITEMAP & ĐIỀU HƯỚNG TOÀN HỆ THỐNG
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — B | Bước 09**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Cấu trúc Cây Điều hướng (Sitemap Tree)

```
UniMind Root (/)
│
├── Public Routes (Không yêu cầu đăng nhập)
│   ├── /login                     [SCR-001] Đăng nhập hệ thống (Sinh viên, Chuyên viên, Admin)
│   └── /register                  [SCR-002] Đăng ký sinh viên (nhập khóa học tự do K2021, K2022...)
│
├── Student Portal (/student/*) — Yêu cầu vai trò: Student
│   ├── /student/home              [SCR-003] Trang chủ sinh viên (Tổng quan tâm trạng, lối tắt nhanh)
│   ├── /student/journal           [SCR-004] Nhật ký cảm xúc (Ghi tâm trạng, AI phân tích, biểu đồ 7 ngày)
│   ├── /student/test              [SCR-005] Trắc nghiệm tâm lý (Tab DASS-21, PHQ-9, GAD-7, kết quả & gợi ý)
│   ├── /student/community         [SCR-006] Góc chia sẻ ẩn danh (Đăng bài 2 cột Live Preview, bình luận ảnh FB)
│   ├── /student/booking           [SCR-007] Đặt lịch tư vấn (Chọn chuyên gia, chọn khung giờ, chống trùng ca)
│   ├── /student/profile           [SCR-008] Hồ sơ sinh viên (Đổi bí danh, đổi mật khẩu, xem lịch sử)
│   └── /student/meeting-room      [SCR-009] Phòng họp trực tuyến SafeCall (P2P WebRTC, Zero-Trust 403)
│
├── Expert Portal (/expert/*) — Yêu cầu vai trò: Expert
│   ├── /expert/workspace          [SCR-010] Bàn làm việc chuyên gia (Danh sách ca hẹn hôm nay, tóm tắt DASS-21)
│   ├── /expert/schedule           [SCR-011] Quản lý lịch trực (Cấu hình khung giờ rảnh theo tuần)
│   ├── /expert/consultation       [SCR-012] Quản lý phòng tư vấn (Nút mở họp trực tuyến tức thì, ghi sổ tay)
│   ├── /expert/moderation         [SCR-013] Kiểm duyệt chuyên gia (Duyệt bài viết và bình luận bị AI gắn cờ)
│   ├── /expert/analytics          [SCR-014] Phân tích tâm lý học đường (Xu hướng sức khỏe tinh thần sinh viên)
│   └── /expert/profile            [SCR-015] Hồ sơ chuyên môn (Học hàm, chuyên môn, địa điểm phòng)
│
├── Admin Portal (/admin/*) — Yêu cầu vai trò: Admin
│   ├── /admin/dashboard           [SCR-016] Bảng điều khiển quản trị (Tổng quan số liệu, biểu đồ hoạt động)
│   ├── /admin/users               [SCR-017] Quản lý người dùng & Ma trận phân quyền động chuyên gia
│   ├── /admin/moderation          [SCR-018] Trung tâm kiểm duyệt nội dung (Xử lý bài viết, bình luận, ảnh đính kèm)
│   ├── /admin/keywords            [SCR-019] Quản lý từ khóa nhạy cảm (Cấu hình bộ lọc AI & Báo động đỏ)
│   ├── /admin/audit-logs          [SCR-020] Nhật ký kiểm toán an toàn hệ thống (Truy vết bất biến)
│   ├── /admin/reports             [SCR-021] Báo cáo thống kê chuyên sâu toàn trường
│   └── /admin/tests               [SCR-022] Quản lý ngân hàng câu hỏi bài test tâm lý
│
└── Error Pages
    ├── /forbidden                 [SCR-023] Màn hình 403 Forbidden (Bảo mật Zero-Trust từ chối truy cập)
    └── /*                         [SCR-024] Màn hình 404 Not Found (Trang không tìm thấy)
```
