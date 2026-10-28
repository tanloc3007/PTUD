# 02. INCIDENT RESPONSE, DECISION LOG & ROLLBACK PLAN
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — Mẫu 09 & 10**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Nhật ký Quyết định Thay đổi (Decision Log & Change Request — Mẫu 09)

### DEC-001 / CHG-001: Chuyển đổi Cơ chế Phòng họp sang WebRTC P2P Trực tiếp (Không cần mã mời)
- **Ngày ghi nhận:** 15/10/2026 | **Người đề xuất:** Lê Minh Luân | **Người duyệt:** ThS. Lê Minh Nhật
- **Vấn đề / Lý do:** Sinh viên phản ánh việc copy-paste mã mời phòng họp rất bất tiện, dễ thất lạc hoặc nhập nhầm mã giữa các buổi.
- **Phương án cân nhắc:**
  - *Phương án A:* Giữ mã mời nhưng sinh mã ngắn 4 số.
  - *Phương án B:* Lưu trạng thái `IsMeetingActive = true` trong CSDL, Client sinh viên tự động hiển thị Banner nổi xanh lá *"Tham gia ngay"*, kết hợp Zero-Trust 403 Forbidden.
- **Quyết định:** Chọn **Phương án B**.
- **Tác động:** `Appointments` thêm `IsMeetingActive`, `MeetingStartedAt`; tạo mới `StudentMeetingRoomPage.jsx`; cập nhật `StudentLayout.jsx`.
- **Trạng thái:** Hoàn tất, đã kiểm chứng đạt AC-009-01 và AC-009-02.

### DEC-002 / CHG-002: Đổi tên 5 Danh mục Diễn đàn & Hỗ trợ Cơ chế Alias Dữ liệu Cũ
- **Ngày ghi nhận:** 18/10/2026 | **Người đề xuất:** Lê Minh Luân | **Người duyệt:** Ngô Tấn Lộc
- **Vấn đề / Lý do:** Tên danh mục cũ mang sắc thái tiêu cực (*Áp lực học tập, Cô đơn & Lạc lõng...*), cần đổi sang tên gần gũi, bao quát hơn.
- **Quyết định:** Đổi sang: *Góc học tập, Gia đình & Bạn bè, Chuyện thường ngày, Góc tâm sự, Định hướng & Tương lai*. Tại tầng Backend Application triển khai cơ chế Alias để tìm kiếm cả nhãn cũ lẫn nhãn mới.
- **Trạng thái:** Hoàn tất, không làm mất bất kỳ bài viết cũ nào.

---

## 2. Quy trình Xử lý Sự cố Khẩn cấp (Incident Response Procedure)

```
       [ 1. Phát hiện sự cố ] ──► [ 2. Phân loại mức độ (Triage) ]
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼ (P1 - Nghiêm trọng)                                         ▼ (P2/P3 - Trung bình/Nhẹ)
       [ Kích hoạt Rollback / Hotfix ]                              [ Tạo Ticket & Sửa trong Iteration ]
                 │                                                             │
                 ▼                                                             ▼
       [ Thông báo Ban Điều hành ]                                   [ Triển khai vào Staging Test ]
                 │                                                             │
                 └──────────────────────────────┬──────────────────────────────┘
                                                ▼
                                    [ 3. Họp rút kinh nghiệm (Post-Mortem) ]
```

| Mức độ sự cố | Tiêu chí nhận diện | Thời gian phản hồi tối đa (MTTR) | Biện pháp hành động |
| :--- | :--- | :---: | :--- |
| **P1 - Critical** | Sập CSDL SQL Server; lộ dữ liệu danh tính sinh viên; lỗi trùng ca tư vấn nghiêm trọng. | $\le \mathbf{15\text{ phút}}$ | Kích hoạt kịch bản khôi phục CSDL từ bản backup gần nhất; ngắt tạm thời tính năng đặt lịch. |
| **P2 - Major** | Lỗi kết nối AI Gemini; upload ảnh Cloudinary bị nghẽn; WebRTC mất tín hiệu. | $\le \mathbf{1\text{ giờ}}$ | Hệ thống tự động chuyển sang cơ chế Fallback (từ điển từ khóa nội bộ; ảnh mặc định). |
| **P3 - Minor** | Lỗi hiển thị CSS trên một số dòng điện thoại cũ; chậm phản hồi biểu đồ. | $\le \mathbf{24\text{ giờ}}$ | Ghi nhận vào Backlog và cập nhật trong bản vá tuần kế tiếp. |

---

## 3. Kế hoạch Sao lưu & Phục hồi CSDL (Backup & Restore Plan)
1. **Chiến lược Sao lưu:**
   - Full Backup hàng ngày vào lúc 02:00 AM (giờ máy chủ).
   - Differential Backup mỗi 6 giờ.
   - Transaction Log Backup mỗi 30 phút.
2. **Kịch bản Khôi phục (Rollback / Restore Procedure):**
   ```sql
   -- Khôi phục CSDL UniMindDb về điểm kiểm tra an toàn
   USE master;
   ALTER DATABASE UniMindDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
   RESTORE DATABASE UniMindDb 
   FROM DISK = 'C:\UniMind_Backups\UniMindDb_Latest.bak' 
   WITH REPLACE, RECOVERY;
   ALTER DATABASE UniMindDb SET MULTI_USER;
   ```
3. **Kiểm thử Diễn tập Phục hồi:** Thực hiện định kỳ mỗi tháng một lần trên môi trường Staging để đảm bảo bản sao lưu luôn toàn vẹn và có khả năng phục hồi 100%.
