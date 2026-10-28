# 01. CLEAN ARCHITECTURE & ARCHITECTURE DECISION RECORDS (ADR)
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — B | Bước 10**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Sơ đồ Kiến trúc Clean Architecture 4 Tầng (.NET 8 & React Vite)

```
                            ┌──────────────────────────────────────────────┐
                            │        Presentation Layer (WebAPI & UI)      │
                            │  - WebAPI Controllers (Mỏng, chỉ dispatch)   │
                            │  - ExceptionHandlingMiddleware (RFC 7807)    │
                            │  - Swagger / OpenAPI UI 3.1.1 Specification  │
                            │  - React Vite SPA + Modular Features UI      │
                            └──────────────────────┬───────────────────────┘
                                                   │
                                                   ▼
                            ┌──────────────────────────────────────────────┐
                            │            Infrastructure Layer              │
                            │  - ApplicationDbContext (SQL Server & EF)    │
                            │  - External AI: Gemini & Sentiment Engine    │
                            │  - External CDN: Cloudinary Media Storage    │
                            │  - Security: BCrypt Password & JWT Provider  │
                            └──────────────────────┬───────────────────────┘
                                                   │
                                                   ▼
                            ┌──────────────────────────────────────────────┐
                            │             Application Layer                │
                            │  - CQRS / Feature Services (Use Cases)       │
                            │  - Data Transfer Objects (DTOs) & Mapping    │
                            │  - Interfaces: IApplicationDbContext, IAISvc │
                            │  - Result Pattern: Result<T>                 │
                            │  - Business Rules & Concurrency Locks        │
                            └──────────────────────┬───────────────────────┘
                                                   │
                                                   ▼
                            ┌──────────────────────────────────────────────┐
                            │                Domain Layer                  │
                            │  - Core Entities: User, Expert, Appointment  │
                            │  - Enums: UserRole, MoodType, PostStatus...  │
                            │  - Domain Exceptions & Pure Invariants       │
                            │  - Hoàn toàn KHÔNG phụ thuộc thư viện ngoài  │
                            └──────────────────────────────────────────────┘
```

### Các nguyên tắc vàng Clean Architecture bắt buộc tuân thủ:
1. **Quy tắc phụ thuộc một chiều (Dependency Rule):** Mã nguồn chỉ phụ thuộc từ tầng ngoài hướng vào trong. Domain không tham chiếu bất kỳ tầng nào. Application chỉ tham chiếu Domain. Infrastructure và Presentation tham chiếu Application.
2. **Không rò rỉ thực thể (No Entity Leaking):** Tuyệt đối không trả thực thể Domain trực tiếp ra Controller hoặc Client. Toàn bộ dữ liệu ra vào API đều bắt buộc phải chuyển đổi (mapping) qua DTO.
3. **Bộ điều khiển mỏng (Thin Controllers):** WebAPI Controller chỉ làm nhiệm vụ tiếp nhận HTTP Request, gọi tầng Application Service và trả về `Result<T>` đóng gói thành HTTP Status phù hợp.

---

## 2. Danh mục Architecture Decision Records (ADR)

### ADR-001: Lựa chọn Mô hình Clean Architecture cho Hệ thống UniMind
- **Trạng thái:** Đã phê duyệt (Accepted)
- **Bối cảnh:** Dự án cần đảm bảo tính bảo mật y tế tâm lý, khả năng mở rộng chức năng, kiểm thử độc lập và phân chia công việc rõ ràng giữa 2 lập trình viên (Ngô Tấn Lộc & Lê Minh Luân).
- **Quyết định:** Áp dụng mô hình **Clean Architecture 4 tầng** chuẩn của Robert C. Martin kết hợp Result Pattern.
- **Hệ quả:** Mã nguồn cực kỳ dễ bảo trì, tách biệt hoàn toàn giữa logic nghiệp vụ (Application) và cơ sở hạ tầng (SQL Server, Cloudinary, AI Gemini).

### ADR-002: Công nghệ Họp Trực tuyến WebRTC P2P Trực tiếp Không Cần Mã Mời
- **Trạng thái:** Đã phê duyệt (Accepted)
- **Bối cảnh:** Cơ chế gửi mã phòng họp cũ khiến sinh viên phải copy-paste phức tạp, dễ nhầm mã và tiềm ẩn nguy cơ lộ mã phòng cho người ngoài.
- **Quyết định:** Xây dựng cơ chế **Direct SafeCall Meeting Room**:
  - Chuyên viên bấm mở phòng -> CSDL ghi nhận `IsMeetingActive = true`.
  - Client của sinh viên tự động hiển thị Banner nổi màu xanh: *"Chuyên viên đang đợi bạn! Cuộc họp đang mở"*.
  - Sinh viên bấm nút là kết nối thẳng WebRTC P2P thuần túy không qua trung gian bên thứ 3.
  - Áp dụng kiểm soát **Zero-Trust**: Kiểm tra quyền truy cập ở cấp độ Backend và Component; chặn mọi sinh viên khác bằng mã `403 Forbidden`.
- **Hệ quả:** Trải nghiệm người dùng mượt mà tức thì, đảm bảo tính bảo mật và riêng tư tuyệt đối cho ca tham vấn.

### ADR-003: Thuật toán Chống Trùng Lịch Tư vấn (Anti-Double-Booking)
- **Trạng thái:** Đã phê duyệt (Accepted)
- **Bối cảnh:** Trong giờ cao điểm, nhiều sinh viên có thể cùng chọn một khung giờ rảnh của cùng một chuyên gia tại cùng một thời điểm.
- **Quyết định:** Áp dụng cơ chế bảo vệ kép:
  1. **Tầng Application:** Sử dụng transaction và kiểm tra điều kiện `TimeSlot.IsBooked == false` trước khi ghi nhận.
  2. **Tầng Database:** Đặt ràng buộc toàn vẹn duy nhất `CONSTRAINT UQ_Appointments_TimeSlot UNIQUE (TimeSlotId)`.
- **Hệ quả:** Nếu có 2 sinh viên bấm cùng lúc, chỉ có 1 sinh viên thành công; sinh viên còn lại nhận ngay mã lỗi `409 Conflict` và giao diện thông báo chọn khung giờ khác, loại bỏ 100% rủi ro trùng lịch.

### ADR-004: Cơ chế Kiểm duyệt Kép: Từ điển Từ khóa Nhạy cảm & AI NLP Gemini
- **Trạng thái:** Đã phê duyệt (Accepted)
- **Bối cảnh:** Sinh viên có thể chia sẻ các ý nghĩ tự hại cấp bách cần can thiệp tức thì, nhưng gọi AI LLM có thể mất 1-2 giây hoặc phụ thuộc mạng.
- **Quyết định:** Triển khai cơ chế kiểm duyệt song song (Dual-Check Engine):
  - **Lớp 1 (Local Regex/HashSet):** Quét bộ từ điển nhạy cảm trong CSDL SQL Server với độ trễ <1ms.
  - **Lớp 2 (Google Gemini AI):** Phân tích ngữ cảnh, thấu cảm và chấm điểm rủi ro $RiskScore$.
  - Nếu kích hoạt từ khóa tự hại hoặc $RiskScore \ge 75$: Ngay lập tức gắn nhãn `Flagged`, ẩn khỏi sinh viên thông thường (`IsSensitiveHiddenFromStudents = true`) và đẩy vào bảng `NlpRiskAlerts` mức `Urgent`.
- **Hệ quả:** Phản hồi tức thì, vừa đảm bảo tốc độ vừa đảm bảo độ chính xác thấu cảm ngữ cảnh sâu.

### ADR-005: Chuẩn hóa Thang đo Tâm lý DASS-21 Chuẩn Quốc tế Lovibond (1995)
- **Trạng thái:** Đã phê duyệt (Accepted)
- **Bối cảnh:** Cần đảm bảo kết quả trắc nghiệm tâm lý có giá trị y khoa và khoa học đáng tin cậy.
- **Quyết định:** Áp dụng đúng 21 câu hỏi chia đều 3 nhóm (Trầm cảm, Lo âu, Căng thẳng). Tính tổng điểm thô mỗi nhóm (0-21) và bắt buộc **nhân đôi ($x2$)** đưa về thang chuẩn $0 - 42$ theo chuẩn lâm sàng Lovibond (1995) trước khi phân tầng mức độ.
- **Hệ quả:** Đảm bảo tính khoa học chính xác, đồng thời mở rộng thêm 2 thang đo chuẩn PHQ-9 (9 câu) và GAD-7 (7 câu).
