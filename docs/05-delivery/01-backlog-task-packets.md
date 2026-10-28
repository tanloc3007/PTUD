# 01. BACKLOG & TASK PACKETS (GIAO VIỆC CHO AI AGENT)
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — Mẫu 07 & Bước 12**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Phân vai Điều phối AI Agent

| Vai trò Agent | Nhiệm vụ chính | Giới hạn & Quyền hạn |
| :--- | :--- | :--- |
| **Lead / Orchestrator Agent** | Phân rã backlog thành Task Packets, quản lý dependency, kiểm tra tuân thủ Clean Architecture, tổng hợp báo cáo. | Không tự ý sửa đổi Business Rules hoặc thay đổi API Contract trái phép. |
| **Backend Agent** | Xây dựng Entities, Application Services, Controllers, EF Mapping, thuật toán chống trùng lịch và kiểm tra phân quyền. | Không làm phá vỡ hợp đồng API; không rò rỉ Domain Entities ra ngoài. |
| **Frontend Agent** | Xây dựng giao diện React Vite, bố cục 2 cột, Live Preview, bình luận Facebook, phòng họp SafeCall và xử lý 5 trạng thái UI. | Không tự ý thay đổi response schema của backend; tuân thủ Design System. |
| **Review / Test Agent** | Rà soát diff mã nguồn, viết Unit Test / Integration Test, kiểm tra các tiêu chí chấp nhận (AC) và lỗ hổng OWASP. | Không bỏ qua kiểm thử chỉ để báo cáo hoàn thành. |
| **Human Owner (Nhóm SV & GV)** | Giám sát, phê duyệt các Quality Gates (G1 - G5), nghiệm thu sản phẩm thực tế. | Chịu trách nhiệm cuối cùng về chất lượng đồ án. |

---

## 2. Danh mục Task Packets Mẫu

### TASK-001: Triển khai Phòng tư vấn trực tuyến SafeCall không cần mã (MOD-APPOINTMENT)
- **Module:** `MOD-APPOINTMENT` | **Người thực hiện:** Backend Agent & Frontend Agent | **Reviewer:** Lê Minh Luân
- **Mục tiêu:** Sinh viên và Chuyên gia kết nối cuộc họp trực tuyến P2P tức thì không cần mã mời; áp dụng kiểm soát Zero-Trust `403 Forbidden`.
- **Đầu vào:** US-009, AC-009-01, AC-009-02, BR-003, SCR-009, API `/expert/consultation/room/{id}/toggle`.
- **Phạm vi sửa:**
  - `backend/src/Core/Domain/Entities/DomainEntities.cs` (`IsMeetingActive`, `MeetingStartedAt`)
  - `backend/src/Core/Application/Features/ServiceImplementations.cs`
  - `frontend/src/features/student/pages/StudentMeetingRoomPage.jsx`
  - `frontend/src/app/layouts/StudentLayout.jsx`
  - `frontend/src/features/expert/pages/ConsultationRoomPage.jsx`
- **Lệnh kiểm chứng:** `dotnet build`, `npm run build`
- **Tiêu chuẩn nghiệm thu:** Banner nổi xanh xuất hiện khi chuyên viên mở phòng; sinh viên lạ truy cập bị chặn bởi màn hình đỏ 403 Forbidden.

### TASK-002: Chuẩn hóa Bài test Tâm lý DASS-21, PHQ-9 & GAD-7 (MOD-TEST)
- **Module:** `MOD-TEST` | **Người thực hiện:** Frontend Agent & Backend Agent | **Reviewer:** Ngô Tấn Lộc
- **Mục tiêu:** Cung cấp 3 bài test tâm lý dạng Tab; DASS-21 chuẩn hóa nhân đôi $x2$ điểm số; tự động cảnh báo gợi ý đặt lịch.
- **Đầu vào:** US-005, AC-005-01, AC-005-02, BR-006, SCR-005.
- **Phạm vi sửa:** `frontend/src/features/student/pages/TestPage.jsx`, `backend/src/Core/Application/Features/ServiceImplementations.cs`.
- **Tiêu chuẩn nghiệm thu:** Điểm số hiển thị thang 0-42; chuyển đổi 3 tab mượt mà; cảnh báo đỏ xuất hiện khi điểm rơi vào mức Nặng/Rất nặng.

### TASK-003: Giao diện Đăng bài 2 cột Live Preview & Đổi tên 5 Danh mục Thân thiện (MOD-COMMUNITY)
- **Module:** `MOD-COMMUNITY` | **Người thực hiện:** Frontend Agent & Backend Agent | **Reviewer:** Lê Minh Luân
- **Mục tiêu:** Bố cục đăng bài 2 cột với Live Preview tức thì; 5 danh mục thân thiện kèm cơ chế Alias không mất bài cũ.
- **Đầu vào:** US-006, AC-006-01, AC-006-02, SCR-006.
- **Phạm vi sửa:** `frontend/src/features/student/pages/CommunityFeedPage.jsx`, `backend/src/Core/Application/Features/ServiceImplementations.cs`.
- **Tiêu chuẩn nghiệm thu:** Gõ text cột trái hiện ngay cột phải; lọc "Góc học tập" trả về cả bài cũ mang nhãn "Áp lực học tập".

### TASK-004: Bình luận Đa phương tiện kèm Ảnh Cloudinary & Bong bóng Facebook (MOD-COMMUNITY)
- **Module:** `MOD-COMMUNITY` | **Người thực hiện:** Fullstack Agent | **Reviewer:** Ngô Tấn Lộc
- **Mục tiêu:** Đăng bình luận kèm ảnh; upload Cloudinary; bong bóng bình luận chuẩn Facebook; bộ ba nút Thích, Đồng cảm, Bình luận bên trái.
- **Đầu vào:** US-007, AC-007-01, AC-007-02, SCR-006.
- **Phạm vi sửa:** `frontend/src/features/student/pages/CommunityFeedPage.jsx`, `backend/src/Infrastructure/Persistence/Context/ApplicationDbContext.cs`.
- **Tiêu chuẩn nghiệm thu:** Tải ảnh lên Cloudinary thành công; xem trước ảnh và xóa ảnh trước khi gửi; cụm 3 nút tương tác nằm gọn góc trái.
