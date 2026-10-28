# 03. TEST PLAN & DEFINITION OF DONE (DoD)
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — Mẫu 08 & Bước 14**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Kế hoạch Kiểm thử Đa tầng (Multi-Layer Test Plan)

```
                            ┌───────────────────────────────────┐
                            │    UAT (User Acceptance Test)     │
                            │   Sinh viên & Chuyên gia đánh giá │
                            └─────────────────┬─────────────────┘
                                              ▼
                            ┌───────────────────────────────────┐
                            │      E2E / UI Tests (Cypress)     │
                            │   Luồng người dùng qua giao diện  │
                            └─────────────────┬─────────────────┘
                                              ▼
                            ┌───────────────────────────────────┐
                            │     Integration & Security Tests  │
                            │   API, DB Concurrency, Zero-Trust │
                            └─────────────────┬─────────────────┘
                                              ▼
                            ┌───────────────────────────────────┐
                            │        Unit Tests (xUnit)         │
                            │   Logic nghiệp vụ, DASS-21, Rules │
                            └───────────────────────────────────┘
```

---

## 2. Danh mục Ca Kiểm thử Trọng yếu (Test Cases Mẫu)

| TC-ID | Story / AC Liên kết | Bối cảnh & Dữ liệu đầu vào | Thao tác thực hiện | Kết quả mong đợi | Bằng chứng kiểm thử (Evidence) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-001** | US-001 / AC-001-01 | Chưa đăng nhập; nhập email mới `k22@lhu.edu.vn`, gõ khóa `K2022`. | Điền form đăng ký tại `/register` và bấm *"Tạo tài khoản"*. | Tạo tài khoản vai trò Student thành công; tự sinh bí danh; đăng nhập và vào `/student/home`. | **Pass** (`200 OK`, AuthResponse) |
| **TC-005** | US-005 / AC-005-01 | Sinh viên làm bài DASS-21: Trầm cảm = 8, Lo âu = 7, Căng thẳng = 6. | Trả lời 21 câu hỏi và bấm *"Nộp bài"*. | Hệ thống nhân đôi điểm: Trầm cảm = 16 (Vừa), Lo âu = 14 (Vừa), Căng thẳng = 12 (Nhẹ); gợi ý chăm sóc. | **Pass** (Khớp bảng Lovibond 1995) |
| **TC-008** | US-008 / AC-008-02 | Hai sinh viên cùng chọn 1 khung giờ `TimeSlotId = slot-01` của chuyên viên. | Cùng bấm nút đặt lịch tại cùng một giây. | 1 người nhận `200 OK`; người còn lại nhận ngay mã `409 CONFLICT` với thông báo khung giờ đã có người đặt. | **Pass** (Bắt `UQ_Appointments_TimeSlot`) |
| **TC-009** | US-009 / AC-009-02 | Sinh viên B (`UserId = uid-B`) cố tình truy cập vào URL phòng họp của sinh viên A (`uid-A`). | Truy cập trực tiếp: `/student/meeting-room?appointmentId=app-01`. | Hệ thống kiểm tra Zero-Trust, phát hiện sai tài khoản -> Chặn ngay lập tức với màn hình đỏ `403 Forbidden`. | **Pass** (Màn hình `ForbiddenPage.jsx`) |
| **TC-012** | US-012 / AC-009-01 | Ca hẹn trạng thái `Confirmed`; Chuyên viên bấm *"🌐 Bắt đầu cuộc họp trực tuyến"*. | Chuyên viên bấm nút mở họp tại `/expert/consultation`. | Lưu `IsMeetingActive = true`; giao diện sinh viên nổi ngay banner xanh lá: *"Chuyên viên đang đợi bạn! Cuộc họp đang mở"*. | **Pass** (Banner hiển thị sau <1s) |
| **TC-013** | US-014 / BR-004 | Sinh viên bình luận có chứa từ khóa nhạy cảm tự hại. | Nhập bình luận và bấm gửi. | Bình luận tự gán `Flagged`, ẩn khỏi sinh viên khác (`IsSensitiveHiddenFromStudents = true`), đẩy vào `NlpRiskAlerts`. | **Pass** (Xuất hiện tại tab duyệt Admin) |
| **TC-014** | US-015 / BR-005 | Admin bấm nút khóa tài khoản sinh viên vi phạm. | Admin chọn user và chuyển trạng thái sang `InActive`. | CSDL cập nhật `IsActive = 0`; tự động sinh một bản ghi mới trong `AuditLogs` với đầy đủ IP, thời gian, lý do. | **Pass** (Bản ghi trong bảng `AuditLogs`) |

---

## 3. Bảng Kiểm Định nghĩa Hoàn thành (Definition of Done — DoD Checklist)

Trước khi chuyển tính năng từ giai đoạn Development (Gate G3) sang Nghiệm thu (Gate G4) và Phát hành (Gate G5), toàn bộ các tiêu chí sau phải được đánh dấu hoàn tất:

- [x] **Yêu cầu & Nghiệp vụ:** User Story, Acceptance Criteria (AC) và Business Rules (BR) đã được kiểm chứng đầy đủ.
- [x] **Kiến trúc Clean Architecture:** Mã nguồn tuân thủ nghiêm ngặt 4 tầng (Domain $\leftarrow$ Application $\leftarrow$ Infrastructure $\leftarrow$ Presentation), không rò rỉ thực thể (No Entity Leaking).
- [x] **Hợp đồng API & Dữ liệu:** Đồng bộ với đặc tả `openapi-contract.yaml`; CSDL SQL Server có đầy đủ migration và ràng buộc toàn vẹn.
- [x] **Giao diện & 5 Trạng thái UI:** Giao diện hiển thị chuẩn xác cả 5 trạng thái (Loading, Empty, Error, Success, Denied 403) trên cả Mobile và Desktop.
- [x] **An toàn & Quyền riêng tư:** Kiểm tra bảo mật Zero-Trust, cơ chế ẩn danh (Pseudonymization), băm mật khẩu, không chứa mã bí mật (secrets) trong mã nguồn Git.
- [x] **Kiểm thử tự động & Build:** Lệnh `dotnet build` và `npm run build` thực thi thành công với **0 Error**.
- [x] **Truy vết Traceability:** Ma trận truy vết từ Actor đến Test Case đã được cập nhật hoàn chỉnh.
- [x] **Biên bản Kiểm toán & Nghiệm thu:** Có sự xác nhận và phê duyệt của Human Owner (Nhóm sinh viên & Giảng viên hướng dẫn).
