# AGENTS.md - HƯỚNG DẪN DÀNH CHO AI CODING ASSISTANT
# Dự án: Xây dựng hệ thống nhật ký cảm xúc & tư vấn tâm lý ẩn danh dành cho sinh viên (UniMind)
# Môn học: Phát triển ứng dụng (PTUD) - GVHD: ThS. Lê Minh Nhật - ĐH Lạc Hồng
# Tiêu chuẩn: Quy trình chuẩn 15 bước phát triển Web/App bằng AI Agent (Playbook v1.0)

---

## 1. Bối cảnh dự án & Phân công nhóm
Hệ thống là nền tảng web bảo mật và ẩn danh dành cho sinh viên ghi chép nhật ký cảm xúc, thực hiện trắc nghiệm tâm lý, tương tác cộng đồng ẩn danh và đặt lịch hẹn tư vấn với chuyên gia.
- **Thành viên 1**: Ngô Tấn Lộc (MSSV: 120000212) — Trưởng nhóm -> Phụ trách: Auth, Nhật ký cảm xúc, AI Sentiment, Quản lý bài test.
- **Thành viên 2**: Lê Minh Luân (MSSV: 120000352) — Thành viên -> Phụ trách: Đặt lịch tư vấn, Chống trùng lịch, Góc chia sẻ ẩn danh, Báo cáo Admin.

---

## 2. Nguồn tài liệu chuẩn & Cấu trúc thư mục tài liệu
Tất cả các quyết định nghiệp vụ, hợp đồng API và kiểm thử bắt buộc tra cứu theo cấu trúc tài liệu phân tầng tại `docs/`:
```
project/
├── AGENTS.md                               <- Quy tắc tác nghiệp chung
└── docs/
    ├── 00-project-brief.md                 <- Mẫu 01: Project Brief & Phạm vi MVP
    ├── 01-requirements/                    <- Giai đoạn A: Phân tích nghiệp vụ
    │   ├── 01-actors.md                    <- Mẫu 02: Actor Register & Function Matrix
    │   ├── 02-user-stories.md              <- User Story Backlog (Must/Should/Could)
    │   ├── 03-acceptance-criteria-business-rules.md <- Mẫu 03: AC Given/When/Then & BR
    │   └── 04-use-cases-user-flows.md      <- Mẫu 04: Use Case & User Flows chi tiết
    ├── 02-modules/                         <- Giai đoạn B: Đặc tả phân hệ & NFR
    │   ├── 01-module-map.md                <- Mẫu 05: Bản đồ Module & Boundaries
    │   ├── 02-permission-matrix.md         <- Ma trận phân quyền RBAC & Dynamic Perms
    │   └── 03-non-functional-requirements.md <- Yêu cầu phi chức năng có số đo
    ├── 03-ui-ux/                           <- Giai đoạn B: Thiết kế giao diện
    │   ├── 01-sitemap.md                   <- Sơ đồ điều hướng toàn hệ thống
    │   ├── 02-screen-specifications.md     <- Mẫu 06: Screen Specs & 5 trạng thái UI
    │   └── 03-design-system.md             <- Design System, bảng màu cảm xúc & WCAG
    ├── 04-architecture/                    <- Giai đoạn B: Kiến trúc & Dữ liệu
    │   ├── 01-clean-architecture-adr.md    <- Kiến trúc 4 tầng & Architecture Decision Records
    │   ├── 02-database-erd.md              <- Sơ đồ ERD, Từ điển dữ liệu & Chỉ mục
    │   ├── 03-openapi-contract.yaml        <- Hợp đồng OpenAPI 3.1.1 Specification
    │   └── 04-security-model.md            <- Mô hình bảo mật OWASP ASVS & Zero-Trust
    ├── 05-delivery/                        <- Giai đoạn C & D: Bàn giao & Nghiệm thu
    │   ├── 01-backlog-task-packets.md      <- Mẫu 07: Task Packets giao việc cho AI
    │   ├── 02-traceability-matrix.md       <- Ma trận truy vết ACT -> AF -> US -> TC
    │   └── 03-test-plan-dod.md             <- Mẫu 08: Test Plan & Definition of Done
    ├── 06-operations/                      <- Giai đoạn D: Vận hành & Phát hành
    │   ├── 01-deployment-runbook.md        <- Mẫu 10: Runbook khởi chạy hệ thống
    │   └── 02-incident-and-rollback-plan.md<- Mẫu 09 & 10: Decision Log & Rollback
    └── SO_TAY_QUY_TRINH_15_BUOC_UNIMIND_FULL.md <- Sổ tay tổng hợp 15 bước báo cáo
```

**Thứ tự ưu tiên khi tài liệu mâu thuẫn:**  
1. `AGENTS.md` (Quy tắc hệ thống)  
2. `docs/04-architecture/` (Kiến trúc, CSDL & OpenAPI Contract)  
3. `docs/01-requirements/` (AC & Business Rules)  
4. Các file hướng dẫn phụ trợ khác.

---

## 3. Ràng buộc Kiến trúc BẮT BUỘC (Clean Architecture Constraints)
Khi Agent sinh mã hoặc tái cấu trúc (refactor), bắt buộc tuân thủ 100% các nguyên tắc sau:
1. **TUÂN THỦ NGUYÊN TẮC PHỤ THUỘC (Dependency Rule)**:
   - Tầng **Domain** KHÔNG ĐƯỢC PHÉP tham chiếu đến bất kỳ project/thư viện hạ tầng nào (Không EntityFramework, không ASP.NET, không UI).
   - Tầng **Application** chỉ tham chiếu Domain. Mọi giao tiếp với CSDL, AI API, Email đều phải thông qua **INTERFACES** định nghĩa tại `Application/Common/Interfaces/`.
   - Tầng **Infrastructure** chỉ hiện thực (implement) các interface từ Application.
   - Tầng **WebAPI (Presentation)** chỉ tiếp nhận HTTP request và chuyển xuống Use Case (MediatR Handler / Service), TUYỆT ĐỐI không viết logic tính toán hay truy vấn CSDL ở Controller.
2. **KHÔNG ĐƯỢC RÒ RỈ THỰC THỂ (No Entity Leaking)**:
   - Tuyệt đối không trả Domain Entity trực tiếp về Client. Mọi kết quả trả về API bắt buộc phải map qua DTO (Data Transfer Object).
3. **ĐẢM BẢO TÍNH BẢO MẬT & ẨN DANH (Pseudonymization & PII Protection)**:
   - Dữ liệu nhật ký và bài viết cộng đồng phải che giấu danh tính sinh viên. Không lưu hoặc trả về MSSV / Tên thật của sinh viên trong module cộng đồng.
4. **XỬ LÝ CHỐNG TRÙNG LỊCH HẸN (Anti-Double-Booking)**:
   - Logic kiểm tra trùng ca tư vấn phải được xử lý chặt chẽ ở tầng Application kết hợp ràng buộc duy nhất `UQ_Appointments_TimeSlot` trong SQL Server.
5. **KIỂM SOÁT TRUY CẬP ZERO-TRUST CHO PHÒNG HỌP TRỰC TUYẾN**:
   - Phòng họp trực tuyến SafeCall không cần mã mời; hệ thống tự động kiểm tra `CurrentUserId == Appointment.StudentId`. Nếu người khác cố tình truy cập, lập tức chặn bằng mã lỗi `403 Forbidden`.

---

## 4. Quy tắc Tác nghiệp dành cho AI Agent
1. **Quy tắc Context (Ngữ cảnh):** Agent trước tiên đọc `AGENTS.md` và Task Packet; tiếp theo đọc đúng User Story / Module / Screen / API / Test có liên quan. Không đọc toàn bộ docs cho mọi tác vụ nhỏ.
2. **Không tự ý thay đổi Business Rules:** Tuyệt đối không tự bịa thêm Business Rule hoặc tự ý sửa đổi API Contract/Database schema khi chưa có sự đồng ý của Human Owner.
3. **Bảo vệ Secrets & PII:** Cấm đưa secrets, API Key bí mật, mật khẩu hoặc thông tin cá nhân (MSSV, Họ tên thật) vào mã nguồn Git, commit message hoặc log.
4. **Hành động bắt buộc phải xin duyệt (Ask Permission):**
   - Xóa dữ liệu cơ sở dữ liệu (`DROP TABLE`, `TRUNCATE`).
   - Sửa đổi cấu trúc phân quyền lõi hoặc tước quyền Admin.
   - Thêm các thư viện ngoài dung lượng lớn hoặc thay đổi phiên bản framework.
5. **Quy trình triển khai tính năng mới:**
   - Bước 1: Khai báo Entity / Enums tại `backend/src/Core/Domain/Entities/` (nếu có dữ liệu mới).
   - Bước 2: Khai báo Interface tại `backend/src/Core/Application/Common/Interfaces/`.
   - Bước 3: Tạo Use Case / Feature Service tại `backend/src/Core/Application/Features/`.
   - Bước 4: Khai báo DbContext mapping / Service implementation tại `backend/src/Infrastructure/`.
   - Bước 5: Tạo Endpoint tại Controller mỏng trong `backend/src/Presentation/WebAPI/Controllers/`.
   - Bước 6: Khai báo API Service, Hook và UI Component tương ứng tại `frontend/src/features/`.

---

## 5. Quy chuẩn Kích hoạt Skills Bắt buộc (Mandatory Skills Activation)
Trước khi phân tích, thiết kế hoặc sinh mã nguồn, Agent **BẮT BUỘC** kích hoạt các Skill chuyên sâu đã cài đặt tại `.agents/skills/` (chi tiết tại [newskill.md](file:///b:/PTUD/PTUD/.agents/skills/newskill.md)):
1. **Khi Thiết kế Giao diện (UI/UX Design):**
   - Bắt buộc kích hoạt: `antigravity-design-expert`, `high-end-visual-design`, `emotional-arc-designer`, `frontend-design`, `react-ui-patterns`.
   - Tiêu chí: Glassmorphism mềm mại, không gian nhịp điệu (spatial rhythm), đủ **5 trạng thái UI** (Loading, Empty, Error, Success, Denied 403), thiết kế xoa dịu cảm xúc cho sinh viên.
2. **Khi Phân tích & Thiết kế Kiến trúc (Architecture & Analysis):**
   - Bắt buộc kích hoạt: `architecture-patterns`, `domain-driven-design`, `dotnet-architect`, `database-design`.
   - Tiêu chí: Tuân thủ Clean Architecture 4 tầng, ranh giới module rõ ràng, khóa chống trùng lịch (Anti-double-booking), không rò rỉ thực thể (No Entity Leaking).
3. **Khi Lập trình Backend (C# & .NET 8 WebAPI):**
   - Bắt buộc kích hoạt: `dotnet-backend`, `dotnet-backend-patterns`, `csharp-pro`, `clean-code`, `clean-code-guard`.
   - Tiêu chí: Thin Controller, Result Pattern `Result<T>`, bắt ngoại lệ RFC 7807 ProblemDetails, bất đồng bộ `async/await` an toàn.
4. **Khi Bảo mật, Cơ sở Dữ liệu & Quyền riêng tư (Security & DB):**
   - Bắt buộc kích hoạt: `privacy-by-design`, `security-audit`, `auth-implementation-patterns`, `audit-logging`, `sql-pro`, `sql-optimization-patterns`.
   - Tiêu chí: Ẩn danh hóa (Pseudonymization), băm mật khẩu, kiểm soát Zero-Trust 403 Forbidden, ghi Audit Log bất biến, tối ưu chỉ mục Index.
5. **Khi Kiểm thử & Nghiệm thu (Testing & QA):**
   - Bắt buộc kích hoạt: `testing-qa`, `clean-code-guard`.
   - Tiêu chí: Kiểm chứng 100% Acceptance Criteria và đạt chuẩn Definition of Done (DoD).

---

## 6. Lệnh Kiểm chứng Tiêu chuẩn (Verification Commands)
Mọi thay đổi mã nguồn bắt buộc phải vượt qua 2 lệnh kiểm chứng sau với **0 Error**:
- **Backend build:**
  ```powershell
  dotnet build backend/src/Presentation/WebAPI/WebAPI.csproj
  ```
- **Frontend build:**
  ```powershell
  npm run build --prefix frontend
  ```

---

## 7. Mẫu Bàn giao Bắt buộc (Delivery Packet Template)
Khi hoàn thành một tác vụ, Agent phải báo cáo theo mẫu:
- **Task ID & Tiêu đề:**
- **Danh sách file thay đổi/tạo mới:**
- **Lệnh kiểm chứng và kết quả thực chạy:** (Build status, lỗi còn lại nếu có).
- **Tiêu chí AC & BR đã được chứng minh:**
- **Vấn đề tồn đọng hoặc câu hỏi mở cần người dùng quyết định:**

