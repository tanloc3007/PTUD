# BẢNG TỔNG HỢP VÀ HƯỚNG DẪN KÍCH HOẠT SKILLS CHUYÊN SÂU (UNIMIND)
**Tài liệu quản lý và điều phối kỹ năng AI Agent — Dự án UniMind (ĐH Lạc Hồng)**  
**Áp dụng bắt buộc cho mọi tác vụ:** Phân tích (Analysis), Thiết kế (Design), Lập trình (Coding), Tối ưu (Optimization) & Kiểm thử (Testing).

---

## 1. Nguyên tắc Kích hoạt Kỹ năng Tự động (Skill Activation Protocol)
Mỗi khi tiếp nhận yêu cầu từ người dùng hoặc triển khai một Task Packet, AI Agent bắt buộc phải tra cứu bảng phân loại dưới đây và **tự động kích hoạt (activate) các Skill tương ứng** trước khi sinh mã nguồn hoặc đề xuất giải pháp kỹ thuật:

```
                  ┌──────────────────────────────────────────────┐
                  │    Yêu cầu Nghiệp vụ / Thiết kế / Mã nguồn    │
                  └──────────────────────┬───────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
[ Phân tích & Kiến trúc ]      [ Giao diện & Trải nghiệm ]      [ Cơ sở dữ liệu & Bảo mật ]
- architecture-patterns        - antigravity-design-expert      - database-design
- domain-driven-design         - high-end-visual-design         - database-security
- dotnet-architect             - emotional-arc-designer         - sql-pro
- clean-code-guard             - frontend-architecture          - privacy-by-design
- auth-implementation          - react-best-practices           - audit-logging
```

---

## 2. Danh mục 26 Skills Chuyên sâu Đã Cài đặt Sẵn trong Hệ thống

### 🏛️ NHÓM 1: KIẾN TRÚC HỆ THỐNG & BACKEND .NET 8 (CLEAN ARCHITECTURE)

| Tên Skill | Đường dẫn SKILL.md | Ngữ cảnh kích hoạt bắt buộc | Chuẩn mực & Nhiệm vụ thực hiện |
| :--- | :--- | :--- | :--- |
| **`architecture-patterns`** | `.agents/skills/architecture-patterns/` | Thiết kế phân tầng, tách ranh giới module, áp dụng Clean Architecture / Hexagonal / CQRS. | Tuân thủ Dependency Rule (Domain $\leftarrow$ Application $\leftarrow$ Infrastructure $\leftarrow$ Presentation), không rò rỉ thực thể. |
| **`dotnet-architect`** | `.agents/skills/dotnet-architect/` | Cấu hình ASP.NET Core 8+, Entity Framework Core, Dependency Injection, Middleware pipeline. | Tối ưu hóa cấu hình WebAPI, phân chia Service/Repository, xử lý lifecycle scoped/singleton chuẩn mực. |
| **`dotnet-backend`** | `.agents/skills/dotnet-backend/` | Viết code API Endpoints, Controllers mỏng, DTOs, FluentValidation. | Đóng gói `Result<T>`, bắt ngoại lệ RFC 7807, tích hợp OpenAPI Swagger, tối ưu bất đồng bộ `async/await`. |
| **`dotnet-backend-patterns`** | `.agents/skills/dotnet-backend-patterns/` | Triển khai các pattern chuyên sâu của C#/.NET hiện đại (2024/2025). | Xử lý Concurrency Locks (chống trùng lịch), Resilience Policy, Exception-free flow, CancellationToken. |
| **`csharp-pro`** | `.agents/skills/csharp-pro/` | Viết mã nguồn C# chuẩn enterprise, tối ưu hóa bộ nhớ và hiệu năng. | Dùng records, pattern matching, nullable annotations (`?`), LINQ tối ưu, lambda expressions an toàn. |
| **`domain-driven-design`** | `.agents/skills/domain-driven-design/` | Mô hình hóa nghiệp vụ y tế tâm lý, Entity, Value Object, Aggregate Root. | Bảo vệ bất biến nghiệp vụ (Invariants), đóng gói logic tính điểm DASS-21, luật phân luồng ca hẹn. |
| **`clean-code`** | `.agents/skills/clean-code/` | Tái cấu trúc (refactoring), đặt tên hàm/biến rõ nghĩa, hàm ngắn đơn trách nhiệm. | Tuân thủ 100% nguyên tắc Clean Code của Uncle Bob; không comment thừa; cấu trúc code sáng sủa. |
| **`clean-code-guard`** | `.agents/skills/clean-code-guard/` | Rà soát (code review) mã nguồn trước khi bàn giao (Gate G3). | Kiểm tra vi phạm SOLID, DRY, KISS, YAGNI và các bẫy sinh mã của AI (Hallucination, Dead code). |

---

### 🎨 NHÓM 2: UI/UX, EMOTIONAL DESIGN & GIAO DIỆN ĐẲNG CẤP

| Tên Skill | Đường dẫn SKILL.md | Ngữ cảnh kích hoạt bắt buộc | Chuẩn mực & Nhiệm vụ thực hiện |
| :--- | :--- | :--- | :--- |
| **`antigravity-design-expert`** | `.agents/skills/antigravity-design-expert/` | Xây dựng giao diện spatial, glassmorphism, floating elements, micro-animations. | Áp dụng hiệu ứng làm mờ (backdrop-filter blur), bóng đổ mềm mịn, banner nổi xanh SafeCall nhấp nháy êm dịu. |
| **`high-end-visual-design`** | `.agents/skills/high-end-visual-design/` | Thiết kế typography cao cấp, tỷ lệ vàng, không gian nhịp điệu (spatial rhythm). | Chọn font chữ Inter/Be Vietnam Pro, bảng màu hài hòa HSL, thẻ bo tròn mềm mại, không dùng màu thô gắt. |
| **`emotional-arc-designer`** | `.agents/skills/emotional-arc-designer/` | Thiết kế trải nghiệm tâm lý cho sinh viên (từ bất an, lo âu $\rightarrow$ nhẹ nhõm, an tâm). | Thiết kế luồng viết nhật ký, vòng tròn thở 4-7-8, bảng tin chia sẻ 2 cột không gây áp lực, phản hồi thấu cảm. |
| **`frontend-design`** | `.agents/skills/frontend-design/` | Đảm bảo tính nhất quán của hệ thống thiết kế (Design System) và chuẩn tiếp cận WCAG 2.2. | Tương phản chữ/nền $\ge 4.5:1$, hỗ trợ phím bấm đầy đủ, bố cục responsive hoàn hảo từ di động đến desktop. |
| **`kpi-dashboard-design`** | `.agents/skills/kpi-dashboard-design/` | Thiết kế Dashboard thống kê quản trị và phân tích sức khỏe tinh thần. | Biểu đồ biến thiên năng lượng 7 ngày, tỷ lệ ca tư vấn thành công, phân bố khoa, bảng dữ liệu trực quan. |

---

### ⚛️ NHÓM 3: FRONTEND ARCHITECTURE & REACT VITE

| Tên Skill | Đường dẫn SKILL.md | Ngữ cảnh kích hoạt bắt buộc | Chuẩn mực & Nhiệm vụ thực hiện |
| :--- | :--- | :--- | :--- |
| **`frontend-architecture`** | `.agents/skills/frontend-architecture/` | Tổ chức thư mục React modular (`features/student`, `features/expert`, `features/admin`). | Tách biệt nghiêm ngặt giữa Server-State (API data) và UI-State, tái sử dụng Layouts và Shared components. |
| **`react-best-practices`** | `.agents/skills/react-best-practices/` | Tối ưu hóa hiệu năng React, tránh re-render lãng phí, Lazy Loading routes. | Sử dụng `useMemo`, `useCallback`, Code-splitting với `React.lazy` và `Suspense`, bundle size nhỏ gọn. |
| **`react-state-management`** | `.agents/skills/react-state-management/` | Quản lý trạng thái đăng nhập, giỏ hàng, thông báo toàn cục. | Đồng bộ token JWT, kiểm soát phiên người dùng, đồng bộ trạng thái cuộc họp trực tuyến tức thì. |
| **`react-ui-patterns`** | `.agents/skills/react-ui-patterns/` | Xây dựng các thành phần giao diện xử lý bất đồng bộ. | Hiện thực đủ **5 trạng thái UI**: Loading (Skeleton), Empty, Error, Success, và Denied (403 Forbidden). |

---

### 🛡️ NHÓM 4: BẢO MẬT, QUYỀN RIÊNG TƯ & AN TOÀN DỮ LIỆU

| Tên Skill | Đường dẫn SKILL.md | Ngữ cảnh kích hoạt bắt buộc | Chuẩn mực & Nhiệm vụ thực hiện |
| :--- | :--- | :--- | :--- |
| **`privacy-by-design`** | `.agents/skills/privacy-by-design/` | Bảo vệ thông tin sinh viên, ẩn danh hóa dữ liệu (Pseudonymization). | Không bao giờ trả về MSSV hay họ tên thật trên cộng đồng; nhật ký cảm xúc cô lập tuyệt đối theo `StudentId`. |
| **`security-audit`** | `.agents/skills/security-audit/` | Rà soát lỗ hổng OWASP Top 10, kiểm tra IDOR, XSS, CSRF, Injection. | Đảm bảo an toàn API, khử khuẩn mã HTML đầu vào, kiểm tra phân quyền tài nguyên ở tầng ứng dụng. |
| **`auth-implementation-patterns`** | `.agents/skills/auth-implementation-patterns/` | Cơ chế xác thực JWT, RBAC đa vai trò và Zero-Trust Access Control. | Chặn sinh viên lạ truy cập phòng họp tư vấn bằng mã lỗi `403 Forbidden`; phân quyền động chuyên gia. |
| **`audit-logging`** | `.agents/skills/audit-logging/` | Ghi vết kiểm toán an toàn hệ thống đối với thao tác của Admin và Chuyên viên. | Bảng `AuditLogs` bất biến (chỉ `INSERT` và `SELECT`); ghi nhận ActorId, Action, Timestamp, IP Address. |

---

### 💾 NHÓM 5: CƠ SỞ DỮ LIỆU SQL SERVER & TỐI ƯU HIỆU NĂNG

| Tên Skill | Đường dẫn SKILL.md | Ngữ cảnh kích hoạt bắt buộc | Chuẩn mực & Nhiệm vụ thực hiện |
| :--- | :--- | :--- | :--- |
| **`database-design`** | `.agents/skills/database-design/` | Thiết kế bảng dữ liệu, chuẩn hóa 3NF, ràng buộc khóa ngoại và toàn vẹn. | Đặt khóa chính GUID, ràng buộc duy nhất `UQ_Appointments_TimeSlot` chống trùng lịch ca hẹn. |
| **`database-security`** | `.agents/skills/database-security/` | Bảo mật CSDL, ngăn ngừa lộ connection string, kiểm soát quyền truy cập bảng. | Tham số hóa câu lệnh truy vấn (Parameterized Queries), che giấu mật khẩu đã băm. |
| **`sql-pro`** | `.agents/skills/sql-pro/` | Viết truy vấn SQL Server phức tạp, tổng hợp dữ liệu báo cáo, chỉ mục Index. | Tạo chỉ mục composite cho `Appointments`, `CommunityPosts`, `MoodJournals` để tăng tốc truy vấn. |
| **`sql-optimization-patterns`** | `.agents/skills/sql-optimization-patterns/` | Chẩn đoán truy vấn chậm, tối ưu Transaction, giải quyết nghẽn khóa Concurrency. | Ngăn ngừa Deadlock khi 2 sinh viên cùng đặt một ca; giảm thời gian khóa dữ liệu (Lock Duration). |

---

### 🧪 NHÓM 6: KIỂM THỬ & BẢO ĐẢM CHẤT LƯỢNG (QA)

| Tên Skill | Đường dẫn SKILL.md | Ngữ cảnh kích hoạt bắt buộc | Chuẩn mực & Nhiệm vụ thực hiện |
| :--- | :--- | :--- | :--- |
| **`testing-qa`** | `.agents/skills/testing-qa/` | Lập kế hoạch kiểm thử đa tầng (Unit, Integration, Security, E2E) & Bảng kiểm DoD. | Kiểm chứng đạt 100% Acceptance Criteria; xác thực không trùng lịch ca hẹn; kiểm tra Zero-Trust 403. |

---

## 3. Quy tắc Thực thi Bắt buộc cho AI Agent
1. **Trước khi thiết kế màn hình mới:** Bắt buộc kích hoạt `antigravity-design-expert`, `emotional-arc-designer`, `high-end-visual-design` và `react-ui-patterns` (đảm bảo đủ 5 trạng thái giao diện và phong cách xoa dịu cảm xúc).
2. **Trước khi viết API hoặc Service:** Bắt buộc kích hoạt `architecture-patterns`, `dotnet-architect`, `csharp-pro` và `privacy-by-design` (đảm bảo tuân thủ Clean Architecture, không rò rỉ thực thể và che giấu PII).
3. **Trước khi thao tác CSDL:** Bắt buộc kích hoạt `database-design`, `sql-pro`, `sql-optimization-patterns` (đảm bảo chống trùng ca tư vấn và tối ưu chỉ mục).
4. **Trước khi bàn giao kết quả (Gate G3):** Bắt buộc kích hoạt `clean-code-guard`, `security-audit` và `testing-qa` (đảm bảo biên dịch thành công 0 lỗi và đáp ứng tiêu chí Definition of Done).
