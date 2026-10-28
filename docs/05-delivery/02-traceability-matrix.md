# 02. TRACEABILITY MATRIX (MA TRẬN TRUY VẾT YÊU CẦU ĐẾN TEST)
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — E | Traceability**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Công thức Chuỗi Truy vết (Traceability Chain)
Mỗi yêu cầu nghiệp vụ bắt buộc phải truy vết được từ Tác nhân (Actor) $\rightarrow$ Hành động (AF) $\rightarrow$ Nhu cầu (US) $\rightarrow$ Tiêu chí & Luật (AC/BR) $\rightarrow$ Kịch bản (UC) $\rightarrow$ Module quản lý $\rightarrow$ Màn hình giao diện (SCR) $\rightarrow$ Điểm cuối API $\rightarrow$ Trường hợp kiểm thử (TC):

$$\mathbf{ACT} \longrightarrow \mathbf{AF} \longrightarrow \mathbf{US} \longrightarrow \mathbf{AC + BR} \longrightarrow \mathbf{UC} \longrightarrow \mathbf{MOD} \longrightarrow \mathbf{SCR} \longrightarrow \mathbf{API} \longrightarrow \mathbf{TC}$$

---

## 2. Bảng Ma trận Truy vết Toàn diện Hệ thống

| Yêu cầu (Actor / AF / US) | Luật & Tiêu chí (AC / BR) | Kịch bản (UC) | Module (MOD) | Màn hình (SCR) | API Endpoint | Test Case (TC) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **ACT-STU** / AF-01 / US-001 (Đăng ký tài khoản) | AC-001-01, AC-001-02, BR-008 | UC-001 | `MOD-AUTH` | SCR-002 | `POST /api/auth/register` | **TC-001**: Đăng ký hợp lệ với khóa học K2022 nhập tự do | **Đạt (Pass)** |
| **ACT-STU** / AF-02 / US-002 (Đăng nhập JWT) | AC-001-03, BR-001 | UC-001 | `MOD-AUTH` | SCR-001 | `POST /api/auth/login` | **TC-002**: Đăng nhập trả về JWT và bí danh ẩn danh | **Đạt (Pass)** |
| **ACT-STU** / AF-03 / US-003 (Nhật ký & AI) | AC-003-01, AC-003-02, BR-001 | UC-002 | `MOD-JOURNAL` | SCR-004 | `POST /api/mood-journals` | **TC-003**: Lưu nhật ký, phân tích AI và trả lời khuyên | **Đạt (Pass)** |
| **ACT-STU** / AF-04 / US-004 (Biểu đồ tâm trạng) | NFR-Perf, AC-003-01 | UC-002 | `MOD-JOURNAL` | SCR-004 | `GET /api/mood-journals` | **TC-004**: Trực quan hóa năng lượng 7 ngày gần nhất | **Đạt (Pass)** |
| **ACT-STU** / AF-05 / US-005 (Trắc nghiệm DASS-21) | AC-005-01, AC-005-02, BR-006 | UC-003 | `MOD-TEST` | SCR-005 | `POST /api/tests/{id}/submit` | **TC-005**: Chấm điểm DASS-21 x2 Lovibond & gợi ý ca hẹn | **Đạt (Pass)** |
| **ACT-STU** / AF-06 / US-006 (Đăng bài 2 cột) | AC-006-01, AC-006-02, BR-001 | UC-004 | `MOD-COMMUNITY` | SCR-006 | `POST /api/community/posts` | **TC-006**: Soạn bài có Live Preview & lọc 5 danh mục Alias | **Đạt (Pass)** |
| **ACT-STU** / AF-07 / US-007 (Bình luận ảnh FB) | AC-007-01, AC-007-02, BR-001 | UC-004 | `MOD-COMMUNITY` | SCR-006 | `POST /api/community/posts/{id}/comments` | **TC-007**: Gửi comment đính kèm ảnh Cloudinary chuẩn FB | **Đạt (Pass)** |
| **ACT-STU** / AF-09 / US-008 (Đặt lịch tư vấn) | AC-008-01, AC-008-02, BR-002 | UC-005 | `MOD-APPOINTMENT` | SCR-007 | `POST /api/appointments/book` | **TC-008**: Chống trùng lịch (Anti-double-booking concurrency) | **Đạt (Pass)** |
| **ACT-STU** / AF-10 / US-009 (Vào họp SafeCall) | AC-009-01, AC-009-02, BR-003 | UC-006 | `MOD-APPOINTMENT` | SCR-009 | `GET /student/meeting-room` | **TC-009**: Banner xanh nổi & Zero-Trust 403 Forbidden | **Đạt (Pass)** |
| **ACT-EXP** / AF-11 / US-010 (Cấu hình ca rảnh) | BR-002, BR-007 | UC-005 | `MOD-WORKSPACE` | SCR-011 | `POST /api/expert/slots` | **TC-010**: Chuyên viên thêm khung giờ rảnh theo tuần | **Đạt (Pass)** |
| **ACT-EXP** / AF-12 / US-011 (Duyệt ca hẹn) | AC-008-01, BR-007 | UC-005 | `MOD-WORKSPACE` | SCR-010 | `PUT /api/appointments/{id}/status` | **TC-011**: Phê duyệt hoặc từ chối ca hẹn kèm lý do | **Đạt (Pass)** |
| **ACT-EXP** / AF-13 / US-012 (Mở họp không mã) | AC-009-01, BR-003 | UC-006 | `MOD-WORKSPACE` | SCR-012 | `POST /api/expert/consultation/room/{id}/toggle` | **TC-012**: Mở phòng họp tức thì không cần mã mời | **Đạt (Pass)** |
| **ACT-EXP** / AF-15 / US-014 (Kiểm duyệt AI) | AC-007-01, BR-004 | UC-007 | `MOD-MODERATION` | SCR-013 | `PUT /api/expert/comments/{id}/moderate` | **TC-013**: Duyệt/ẩn bình luận và bài viết bị gắn cờ nguy cơ | **Đạt (Pass)** |
| **ACT-ADM** / AF-17 / US-015 (Khóa tài khoản) | BR-005, NFR-Sec | UC-008 | `MOD-ADMIN` | SCR-017 | `PUT /api/admin/users/{id}/status` | **TC-014**: Khóa user và tự động sinh bản ghi Audit Log | **Đạt (Pass)** |
| **ACT-ADM** / AF-18 / US-016 (Phân quyền động) | BR-007, NFR-Sec | UC-008 | `MOD-ADMIN` | SCR-017 | `PUT /api/admin/experts/{id}/permissions` | **TC-015**: Cấu hình ma trận quyền hạn cho chuyên gia | **Đạt (Pass)** |
| **ACT-ADM** / AF-19 / US-017 (Từ khóa nhạy cảm) | BR-004, BR-005 | UC-007 | `MOD-ADMIN` | SCR-019 | `POST /api/admin/keywords` | **TC-016**: Thêm từ khóa nhạy cảm & cập nhật bộ lọc AI | **Đạt (Pass)** |
| **ACT-ADM** / AF-21 / US-018 (Báo động đỏ NLP) | BR-004, BR-005 | UC-007 | `MOD-ADMIN` | SCR-018 | `PUT /api/admin/risk-alerts/{id}/resolve` | **TC-017**: Xử lý cảnh báo khẩn cấp (Triage Urgent) | **Đạt (Pass)** |
| **ACT-ADM** / AF-22 / US-019 (Tra cứu Audit Log) | BR-005, NFR-Sec | UC-008 | `MOD-ADMIN` | SCR-020 | `GET /api/admin/audit-logs` | **TC-018**: Tra cứu nhật ký bảo mật bất biến | **Đạt (Pass)** |

---

## 3. Đánh giá Phát hiện Thiếu sót qua Traceability
- **100%** User Story đều có ít nhất 1-2 Tiêu chí chấp nhận (AC) kiểm chứng được.
- **100%** Tiêu chí chấp nhận (AC) đều được ánh xạ tương ứng vào Test Case (TC) cụ thể.
- Tất cả các Business Rules (BR-001 đến BR-008) đều được thực thi nghiêm ngặt tại cả Backend API và Database Constraints.
- Không tồn tại màn hình giao diện nào nằm ngoài phạm vi User Story.
