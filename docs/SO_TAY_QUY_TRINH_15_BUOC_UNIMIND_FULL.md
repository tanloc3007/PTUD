# SỔ TAY QUY TRÌNH 15 BƯỚC PHÁT TRIỂN HỆ THỐNG BẰNG AI AGENT (ÁP DỤNG THỰC TẾ CHO DỰ ÁN UNIMIND)

> **Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
> **Môn học:** Phát triển Ứng dụng (PTUD) — Trường Đại học Lạc Hồng (LHU)  
> **Giảng viên hướng dẫn:** ThS. Lê Minh Nhật  
> **Nhóm sinh viên thực hiện:**  
> - **Thành viên 1:** Ngô Tấn Lộc (MSSV: 120000212) — Trưởng nhóm  
> - **Thành viên 2:** Lê Minh Luân (MSSV: 120000352) — Thành viên  
> **Chuẩn phương pháp:** Dựa trên *Sổ tay quy trình chuẩn phát triển Web/App bằng AI Agent (15 bước, 4 giai đoạn, 5 Quality Gates)*.

---

## MỤC LỤC TỔNG QUAN

- [00 | BẢN ĐỒ PHƯƠNG PHÁP & 5 QUALITY GATES](#00--bản-đồ-phương-pháp--5-quality-gates)
- [GIAI ĐOẠN A | PHÂN TÍCH NGHIỆP VỤ (BƯỚC 01 - 06)](#giai-đoạn-a--phân-tích-nghiệp-vụ-bước-01---06)
  - [Bước 01: Idea & Project Brief (Mẫu 01)](#bước-01-idea--project-brief-mẫu-01)
  - [Bước 02: Actor Identification (Mẫu 02)](#bước-02-actor-identification-mẫu-02)
  - [Bước 03: Actor Function Matrix](#bước-03-actor-function-matrix)
  - [Bước 04: User Story Backlog](#bước-04-user-story-backlog)
  - [Bước 05: Acceptance Criteria & Business Rules (Mẫu 03)](#bước-05-acceptance-criteria--business-rules-mẫu-03)
  - [Bước 06: Use Case & User Flows (Mẫu 04)](#bước-06-use-case--user-flows-mẫu-04)
- [GIAI ĐOẠN B | ĐẶC TẢ SẢN PHẨM & HỆ THỐNG (BƯỚC 07 - 10)](#giai-đoạn-b--đặc-tả-sản-phẩm--hệ-thống-bước-07---10)
  - [Bước 07: Module Decomposition & Permission Matrix (Mẫu 05)](#bước-07-module-decomposition--permission-matrix-mẫu-05)
  - [Bước 08: Non-Functional Requirements (NFR)](#bước-08-non-functional-requirements-nfr)
  - [Bước 09: UI/UX Screen Specs & 5 Trạng thái (Mẫu 06)](#bước-09-uiux-screen-specs--5-trạng-thái-mẫu-06)
  - [Bước 10: System Design — Clean Architecture, ERD & API Contract](#bước-10-system-design--clean-architecture-erd--api-contract)
- [GIAI ĐOẠN C | TỔ CHỨC & ĐIỀU PHỐI AI AGENT (BƯỚC 11 - 12)](#giai-đoạn-c--tổ-chức--điều-phối-ai-agent-bước-11---12)
  - [Bước 11: Agent Rules & Cấu trúc Thư mục Tài liệu](#bước-11-agent-rules--cấu-trúc-thư-mục-tài-liệu)
  - [Bước 12: Implementation Plan & Task Packets (Mẫu 07)](#bước-12-implementation-plan--task-packets-mẫu-07)
- [GIAI ĐOẠN D | THỰC THI, KIỂM THỬ & VẬN HÀNH (BƯỚC 13 - 15)](#giai-đoạn-d--thực-thi-kiểm-thử--vận-hành-bước-13---15)
  - [Bước 13: Phát triển theo Lát cắt Dọc (Vertical Slice)](#bước-13-phát-triển-theo-lát-cắt-dọc-vertical-slice)
  - [Bước 14: Kế hoạch Kiểm thử & Definition of Done (Mẫu 08)](#bước-14-kế-hoạch-kiểm-thử--definition-of-done-mẫu-08)
  - [Bước 15: Triển khai, Vận hành & Kế hoạch Khắc phục Sự cố (Mẫu 09 & 10)](#bước-15-triển-khai-vận-hành--kế-hoạch-khắc-phục-sự-cố-mẫu-09--10)
- [MA TRẬN TRUY VẾT YÊU CẦU ĐẾN TEST (TRACEABILITY MATRIX)](#ma-trận-truy-vết-yêu-cầu-đến-test-traceability-matrix)
- [TỔNG KẾT CÁC CÔNG NGHỆ CHUẨN ĐƯỢC TÍCH HỢP VÀO CLEAN ARCHITECTURE](#tổng-kết-các-công-nghệ-chuẩn-được-tích-hợp-vào-clean-architecture)

---

## 00 | BẢN ĐỒ PHƯƠNG PHÁP & 5 QUALITY GATES

Hệ thống UniMind được phát triển theo mô hình kỹ thuật có kiểm soát, áp dụng **Quy trình chuẩn 15 bước** chia làm **4 giai đoạn** và kiểm duyệt qua **5 điểm phê duyệt chất lượng (Quality Gates)**:

```
[ Giai đoạn A: Nghiệp vụ (01-06) ] ──► [ Gate G1: Nghiệp vụ duyệt ]
               │
               ▼
[ Giai đoạn B: Đặc tả (07-10) ]   ──► [ Gate G2: Thiết kế duyệt ]
               │
               ▼
[ Giai đoạn C: AI Agent (11-12) ] ──► [ Gate G3: Code & Review đạt ]
               │
               ▼
[ Giai đoạn D: Bàn giao (13-15) ] ──► [ Gate G4: Nghiệm thu ] ──► [ Gate G5: Phát hành ]
```

### Tiêu chuẩn Phê duyệt 5 Quality Gates
- **Gate G1 — Nghiệp vụ:** Actor Register, User Story, Acceptance Criteria, Business Rules và Use Case được thống nhất đầy đủ, không mơ hồ.
- **Gate G2 — Thiết kế:** Bản đồ Module, Ma trận phân quyền, Wireframe/Screen Specs, CSDL ERD và Hợp đồng API Contract (OpenAPI 3.1.1) được duyệt đồng bộ.
- **Gate G3 — Code:** Code sạch, tuân thủ 100% Clean Architecture, không rò rỉ thực thể (No Entity Leaking), biên dịch thành công 0 lỗi.
- **Gate G4 — Nghiệm thu:** Đầy đủ bằng chứng đạt tất cả AC, vượt qua kiểm thử luồng chính + ngoại lệ + kiểm tra bảo mật Zero-Trust.
- **Gate G5 — Phát hành:** Sẵn sàng kế hoạch triển khai, cấu hình môi trường, sao lưu/phục hồi CSDL và quy trình xử lý sự cố.

---

## GIAI ĐOẠN A | PHÂN TÍCH NGHIỆP VỤ (BƯỚC 01 - 06)

### Bước 01: Idea & Project Brief (Mẫu 01)
- **Tên dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên.
- **Chủ sở hữu & Giảng viên duyệt:** ThS. Lê Minh Nhật.
- **Nhóm người dùng:** Sinh viên toàn trường, Chuyên viên tâm lý học đường, Quản trị viên nhà trường.
- **Bài toán thực tế:** Khủng hoảng tâm lý sinh viên (áp lực thi cử, định hướng tương lai, mất ngủ, stress); e ngại kỳ thị khi tìm đến chuyên gia; quy trình đăng ký tư vấn truyền thống còn thủ công, thiếu tính tức thời và bảo mật.
- **Chỉ số đo lường (KPI):**
  - Tỷ lệ bảo vệ danh tính: 100% người dùng trên diễn đàn được ẩn danh hóa (Pseudonymized).
  - Tỷ lệ trùng lịch tư vấn: **0% (Zero Double-Booking)** nhờ ràng buộc cơ sở dữ liệu và khóa ứng dụng.
  - Tốc độ sàng lọc nguy cơ: 100% bài viết/bình luận chứa từ khóa tự hại được phát hiện và đẩy vào hàng đợi khẩn cấp trong <1 giây.
- **Phạm vi MVP:** Quản lý tài khoản (nhập khóa học tự do), Nhật ký cảm xúc AI, Trắc nghiệm DASS-21 chuẩn lâm sàng, Góc chia sẻ 2 cột Live Preview, Bình luận ảnh chuẩn Facebook, Đặt lịch hẹn chống trùng và Phòng tư vấn SafeCall WebRTC không cần mã.

---

### Bước 02: Actor Identification (Mẫu 02)

| Actor ID | Tác nhân | Vai trò thực tế | Mục tiêu chính | Quyền hạn & Bảo mật |
| :--- | :--- | :--- | :--- | :--- |
| **ACT-STU** | Sinh viên | Người dùng chính | Ghi chép nhật ký, tự đánh giá tâm lý, chia sẻ ẩn danh, đặt lịch và họp tư vấn trực tuyến. | Chỉ xem dữ liệu của mình; ẩn danh hoàn toàn trên cộng đồng; kiểm soát Zero-Trust tại phòng họp. |
| **ACT-EXP** | Chuyên viên tâm lý | Người tham vấn chuyên môn | Cấu hình lịch trực, duyệt lịch hẹn, mở phòng họp tức thì không cần mã, ghi sổ tay lâm sàng. | Phân quyền động qua `Permissions`; xem lý do tư vấn và kết quả DASS-21 của sinh viên hẹn. |
| **ACT-ADM** | Quản trị viên | Vận hành hệ thống | Quản lý người dùng, phân quyền chuyên viên, cấu hình bộ từ khóa AI, tra cứu Audit Log bất biến. | Toàn quyền quản trị; mọi thao tác nhạy cảm đều bị ghi vết nghiêm ngặt vào bảng `AuditLogs`. |
| **EXT-AI** | Bộ máy AI & NLP | Hệ thống ngoài | Phân tích điểm cảm xúc (-1.0 đến +1.0), phản hồi thấu cảm, phát hiện nguy cơ tự hại ($RiskScore$). | Tự động phân luồng bài viết và bình luận; đẩy cảnh báo vào `NlpRiskAlerts`. |
| **EXT-CDN** | Cloudinary CDN | Hệ thống lưu trữ media | Tối ưu hóa, nén ảnh tự động (WebP) và lưu trữ ảnh an toàn cho avatar, bài viết và bình luận. | Giao thức HTTPS an toàn; tự động gắn cờ ảnh vi phạm. |
| **EXT-RTC** | WebRTC Direct P2P | Giao thức truyền thông | Thiết lập luồng âm thanh/hình ảnh thời gian thực 1-1 trực tiếp giữa Sinh viên và Chuyên gia. | Mã hóa đầu cuối ngang hàng (P2P); máy chủ không lưu video cuộc họp; Zero-Trust token. |

---

### Bước 03: Actor Function Matrix
- **ACT-STU:** AF-01 (Đăng ký tự do khóa học), AF-02 (Đăng nhập JWT), AF-03 (Viết nhật ký cảm xúc), AF-04 (Xem biểu đồ 7 ngày), AF-05 (Làm test DASS-21/PHQ-9/GAD-7), AF-06 (Đăng bài 2 cột Live Preview), AF-07 (Bình luận kèm ảnh FB), AF-08 (Thả tim/đồng cảm), AF-09 (Đặt lịch tư vấn chống trùng), AF-10 (Nhận banner nổi và vào phòng họp trực tuyến).
- **ACT-EXP:** AF-11 (Cấu hình ca rảnh), AF-12 (Duyệt/từ chối lịch hẹn), AF-13 (Bắt đầu họp trực tuyến không mã), AF-14 (Ghi sổ tay lâm sàng), AF-15 (Kiểm duyệt bài viết/bình luận gắn cờ), AF-16 (Xem báo cáo phân tích).
- **ACT-ADM:** AF-17 (Quản lý & khóa user), AF-18 (Ma trận phân quyền chuyên gia), AF-19 (Quản lý từ khóa nhạy cảm), AF-20 (Kiểm duyệt nội dung toàn sàn), AF-21 (Xử lý Báo động đỏ), AF-22 (Tra cứu Audit Log bất biến), AF-23 (Xem báo cáo thống kê).

---

### Bước 04: User Story Backlog
*(Chi tiết đã được định nghĩa chuẩn xác theo mẫu "Là [Actor], tôi muốn [hành động], để [giá trị]" trong tài liệu `docs/01-requirements/02-user-stories.md` bao gồm 20 User Stories từ US-001 đến US-020).*

---

### Bước 05: Acceptance Criteria & Business Rules (Mẫu 03)

#### Acceptance Criteria Trọng yếu (Given / When / Then)
- **AC-008-01 (Đặt lịch thành công):** Given sinh viên đã đăng nhập và chọn khung giờ rảnh; When bấm xác nhận đặt lịch; Then tạo bản ghi `Appointments` trạng thái `Pending`, sinh mã tra cứu `ST-xxxx` và đánh dấu `IsBooked = 1`.
- **AC-008-02 (Chống trùng lịch đồng thời):** Given hai sinh viên cùng bấm đặt vào 1 khung giờ tại cùng 1 giây; When gửi đồng thời lên server; Then chỉ 1 sinh viên thành công, sinh viên còn lại nhận ngay mã `409 Conflict` kèm thông báo khung giờ đã có người đặt.
- **AC-009-01 (Họp trực tuyến không cần mã):** Given chuyên viên bấm mở họp; When sinh viên đang ở cổng sinh viên; Then hiển thị ngay banner nổi màu xanh lá *"Chuyên viên đang đợi bạn! Cuộc họp đang mở"* kèm nút *"🎥 Tham gia ngay"*.
- **AC-009-02 (Zero-Trust 403 Forbidden):** Given người lạ hoặc sinh viên khác tìm cách truy cập URL cuộc họp; When vào trang; Then hệ thống kiểm tra `CurrentUserId != Appointment.StudentId` và lập tức chặn lại bằng màn hình đỏ `403 Forbidden`.
- **AC-005-01 (Chuẩn DASS-21 x2 Lovibond):** Given sinh viên trả lời 21 câu hỏi; When nộp bài; Then tính điểm thô 3 nhóm và nhân đôi ($x2$) đưa về thang chuẩn $0 - 42$ để phân loại mức độ chính xác.

#### Business Rules Cốt lõi (BR-001 đến BR-008)
- **BR-001 (Ẩn danh cộng đồng):** Không bao giờ lộ MSSV, họ tên thật ra API diễn đàn; chỉ dùng bí danh ẩn danh ngẫu nhiên (Pseudonym).
- **BR-002 (Chống trùng ca hẹn):** Khung giờ chuyên viên là duy nhất tại một thời điểm (`CONSTRAINT UQ_Appointments_TimeSlot UNIQUE`).
- **BR-003 (Zero-Trust Cuộc họp):** Chỉ duy nhất 2 người (chuyên gia được phân công và sinh viên sở hữu ca hẹn) mới được cấp quyền vào phòng họp WebRTC.
- **BR-004 (Báo động đỏ NLP):** Khi có từ khóa tự hại hoặc $RiskScore \ge 75$, tự động gắn nhãn `Flagged`, ẩn khỏi sinh viên thông thường và đẩy cảnh báo khẩn vào `NlpRiskAlerts`.
- **BR-005 (Bất biến Audit Log):** Bảng `AuditLogs` chỉ được phép `INSERT` và `SELECT`, cấm sửa hoặc xóa.
- **BR-006 (Quy đổi Thang điểm Y khoa):** DASS-21 bắt buộc nhân đôi ($x2$) điểm số thô theo chuẩn lâm sàng Lovibond (1995).

---

### Bước 06: Use Case & User Flows (Mẫu 04)
Đặc tả chi tiết các Use Case chính: UC-001 (Đăng ký/Đăng nhập), UC-002 (Nhật ký cảm xúc & AI), UC-003 (Trắc nghiệm tâm lý), UC-004 (Cộng đồng 2 cột & Comment ảnh), UC-005 (Đặt lịch chống trùng), UC-006 (Phòng họp SafeCall không mã), UC-007 (Kiểm duyệt & Báo động đỏ), UC-008 (Quản trị & Phân quyền). Sơ đồ User Flow đã được vẽ trực quan chi tiết trong `docs/01-requirements/04-use-cases-user-flows.md`.

---

## GIAI ĐOẠN B | ĐẶC TẢ SẢN PHẨM & HỆ THỐNG (BƯỚC 07 - 10)

### Bước 07: Module Decomposition & Permission Matrix (Mẫu 05)
Phân rã hệ thống thành 8 Module độc lập với ranh giới dữ liệu chuẩn mực:
1. `MOD-AUTH`: Xác thực, cấp phát JWT, sinh bí danh ẩn danh, quản lý tài khoản.
2. `MOD-JOURNAL`: Nhật ký cảm xúc, đo năng lượng, AI phản hồi và biểu đồ 7 ngày.
3. `MOD-TEST`: Bộ trắc nghiệm chuẩn DASS-21, PHQ-9, GAD-7 và gợi ý can thiệp.
4. `MOD-COMMUNITY`: Bảng tin 2 cột Live Preview, 5 chủ đề thân thiện, bình luận ảnh FB Cloudinary.
5. `MOD-APPOINTMENT`: Đặt lịch hẹn, chống trùng lịch, phòng họp trực tuyến SafeCall không cần mã.
6. `MOD-WORKSPACE`: Bàn làm việc ca trực chuyên gia, duyệt lịch, xem DASS-21 và ghi chép lâm sàng.
7. `MOD-MODERATION`: Kiểm duyệt kép AI & từ điển từ khóa nhạy cảm, hàng đợi Báo động đỏ.
8. `MOD-ADMIN`: Quản lý người dùng, ma trận phân quyền chuyên gia, từ khóa, tra cứu Audit Log.

---

### Bước 08: Non-Functional Requirements (NFR)
- **Security:** 100% mật khẩu được băm BCrypt; 0% rò rỉ PII sinh viên ra API cộng đồng; 100% chặn truy cập trái phép bằng Zero-Trust 403 Forbidden.
- **Performance:** $p95$ API đọc dữ liệu $\le 450ms$; $p95$ API phân tích AI $\le 1.2s$; điểm Lighthouse $\ge 85/100$.
- **Availability:** Uptime $\ge 99.5\%$; khả năng tự phục hồi kết nối SQL Server $\le 5s$.
- **Accessibility:** Tuân thủ WCAG 2.2 AA; độ tương phản màu chữ/nền $\ge 4.5:1$; điều hướng phím bấm đầy đủ.
- **Maintainability:** Tuân thủ Clean Architecture 4 tầng; độ bao phủ kiểm thử logic lõi $\ge 80\%$.

---

### Bước 09: UI/UX Screen Specs & 5 Trạng thái (Mẫu 06)
Mọi màn hình (SCR-001 đến SCR-024) đều được triển khai đủ **5 trạng thái giao diện**:
- *Loading State:* Skeleton loader mờ nhấp nháy.
- *Empty State:* Hình minh họa thấu cảm, lời động viên ấm áp.
- *Error State:* Thông báo lỗi rõ ràng, nút thử lại.
- *Success State:* Hiển thị dữ liệu hoàn chỉnh, hiệu ứng vi cử động mượt mà.
- *Denied State:* Trang `ForbiddenPage.jsx` (403 Forbidden) ngăn chặn hành vi vượt quyền.
- **Design System:** Tông màu chủ đạo Calm Cyan (`#0d9488`), Soft Indigo (`#6366f1`), phong cách Glassmorphism và vòng tròn thở nhịp điệu (Breathing Circle).

---

### Bước 10: System Design — Clean Architecture, ERD & API Contract
- **Kiến trúc Clean Architecture:** Domain (Entities, Enums) $\leftarrow$ Application (Services, DTOs, Result Pattern) $\leftarrow$ Infrastructure (SQL Server, Cloudinary, Gemini AI) $\leftarrow$ Presentation (WebAPI Controllers, React Vite).
- **Cơ sở dữ liệu:** 14 bảng quan hệ chuẩn hóa với khóa chính GUID, khóa ngoại, chỉ mục tối ưu và ràng buộc duy nhất chống trùng lịch.
- **Hợp đồng API:** Toàn bộ hệ thống tuân thủ chuẩn **OpenAPI Specification 3.1.1** (đã xuất tại `docs/04-architecture/03-openapi-contract.yaml`).

---

## GIAI ĐOẠN C | TỔ CHỨC & ĐIỀU PHỐI AI AGENT (BƯỚC 11 - 12)

### Bước 11: Agent Rules & Cấu trúc Thư mục Tài liệu
Cấu trúc tài liệu chuẩn được thiết lập ngay tại thư mục dự án:
```
project/
├── AGENTS.md
└── docs/
    ├── 00-project-brief.md
    ├── 01-requirements/       (actors, user-stories, ac-br, use-cases)
    ├── 02-modules/            (module-map, permission-matrix, nfr)
    ├── 03-ui-ux/              (sitemap, screen-specs, design-system)
    ├── 04-architecture/       (clean-architecture, erd, openapi.yaml, security)
    ├── 05-delivery/           (task-packets, traceability, test-plan-dod)
    └── 06-operations/         (deployment-runbook, incident-rollback)
```

### Bước 12: Implementation Plan & Task Packets (Mẫu 07)
Phân vai rõ ràng giữa Orchestrator, Backend Agent, Frontend Agent và Reviewer; lập Task Packets chi tiết với phạm vi file rõ ràng, lệnh kiểm chứng độc lập và tiêu chuẩn nghiệm thu nghiêm ngặt.

---

## GIAI ĐOẠN D | THỰC THI, KIỂM THỬ & VẬN HÀNH (BƯỚC 13 - 15)

### Bước 13: Phát triển theo Lát cắt Dọc (Vertical Slice)
Triển khai trọn vẹn từng lát cắt tính năng hoàn chỉnh: Giao diện UI + Endpoint API + Logic Application + Dữ liệu SQL Server + Kiểm thử xác thực, loại bỏ tình trạng làm rời rạc frontend và backend.

### Bước 14: Kế hoạch Kiểm thử & Definition of Done (Mẫu 08)
Áp dụng kim tự tháp kiểm thử đa tầng: Unit Test logic chấm điểm DASS-21, Integration Test kiểm tra giao dịch đặt lịch và khóa trùng lặp, Security Test kiểm tra Zero-Trust 403 Forbidden và băm mật khẩu, E2E Test luồng người dùng từ lúc đăng ký đến khi vào phòng họp. Đánh dấu hoàn tất 100% bảng kiểm Definition of Done (DoD).

### Bước 15: Triển khai, Vận hành & Kế hoạch Khắc phục Sự cố (Mẫu 09 & 10)
- Tích hợp script khởi động một chạm `start-system.ps1` và `start-system.bat`.
- Quản lý secrets an toàn qua cấu hình môi trường; hỗ trợ chuyển đổi Fallback linh hoạt khi mất kết nối AI hoặc Cloudinary.
- Cơ chế sao lưu Full/Differential hàng ngày và kịch bản khôi phục CSDL khi có sự cố nghiêm trọng.

---

## MA TRẬN TRUY VẾT YÊU CẦU ĐẾN TEST (TRACEABILITY MATRIX)

```
ACT-STU -> AF-09 -> US-008 -> AC-008-02 + BR-002 -> UC-005 -> MOD-APPOINTMENT -> SCR-007 -> POST /api/appointments/book -> TC-008 (Chống trùng ca tư vấn 409)
ACT-STU -> AF-10 -> US-009 -> AC-009-01 + BR-003 -> UC-006 -> MOD-APPOINTMENT -> SCR-009 -> POST /api/expert/.../toggle -> TC-009 (Zero-Trust 403 Forbidden)
ACT-STU -> AF-07 -> US-007 -> AC-007-01 + BR-001 -> UC-004 -> MOD-COMMUNITY   -> SCR-006 -> POST /api/community/.../comments -> TC-007 (Comment kèm ảnh Cloudinary FB)
ACT-STU -> AF-05 -> US-005 -> AC-005-01 + BR-006 -> UC-003 -> MOD-TEST        -> SCR-005 -> POST /api/tests/.../submit -> TC-005 (Chấm DASS-21 x2 Lovibond)
ACT-ADM -> AF-17 -> US-015 -> BR-005 + NFR-Sec   -> UC-008 -> MOD-ADMIN       -> SCR-017 -> PUT /api/admin/users/.../status -> TC-014 (Khóa user & ghi Audit Log)
```
*(Bảng ma trận truy vết đầy đủ 18 ca kiểm thử chi tiết được trình bày tại `docs/05-delivery/02-traceability-matrix.md`).*

---

## TỔNG KẾT CÁC CÔNG NGHỆ CHUẨN ĐƯỢC TÍCH HỢP VÀO CLEAN ARCHITECTURE

1. **Hợp đồng OpenAPI Specification 3.1.1 (Swagger UI):** Chuẩn hóa toàn bộ schema yêu cầu/phản hồi và tài liệu hóa tương tác tại `/swagger`.
2. **Tiêu chuẩn An toàn Web OWASP ASVS v4.0:** Bảo vệ dữ liệu nhạy cảm, phòng chống IDOR bằng cơ chế phân quyền theo tài nguyên, băm mật khẩu bảo mật.
3. **Mô hình Bảo mật Zero-Trust:** Xác minh danh tính tức thời tại cả Backend và Frontend Component; ngăn chặn sinh viên lạ xâm nhập cuộc họp riêng tư (`403 Forbidden`).
4. **Chuẩn Định dạng Phản hồi RFC 7807 (ProblemDetails & Result Pattern):** Thống nhất mọi kết quả thành công và lỗi qua đối tượng `Result<T>` (`success`, `errorCode`, `message`, `timestamp`, `data`).
5. **Cơ chế Khóa Đồng thời & Chống Trùng Lịch (Anti-Double-Booking Concurrency Guard):** Kết hợp giao dịch tầng Application và ràng buộc duy nhất CSDL `UQ_Appointments_TimeSlot`.
6. **Kiểm duyệt Kép AI & Bộ Từ khóa Nhạy cảm (Dual-Check NLP & Risk Triage):** Kết hợp tốc độ của từ điển nội bộ và chiều sâu của Google Gemini AI; tự động kích hoạt Báo động đỏ khi phát hiện nguy cơ tự hại ($RiskScore \ge 75$).
7. **Đa phương tiện Cloudinary CDN:** Nén ảnh tự động chuẩn WebP, tối ưu dung lượng và lưu trữ ảnh an toàn.
8. **WebRTC P2P Trực tiếp Không Cần Mã Mời:** Tự động phát hiện phiên họp đang mở qua Banner nổi xanh lá; kết nối ngang hàng bảo mật cao, không lưu trữ video trên máy chủ.
9. **Chuẩn hóa Thang đo Tâm lý Y khoa:** DASS-21 (nhân đôi $x2$ điểm số theo Lovibond 1995), PHQ-9 (trầm cảm), GAD-7 (lo âu).
10. **Nhật ký Kiểm toán Bất biến (Audit Log):** Ghi vết toàn bộ hành vi quản trị viên và chuyên viên phục vụ công tác thanh tra và kiểm soát tuân thủ.
