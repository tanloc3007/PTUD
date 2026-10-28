# 04. SECURITY MODEL & OWASP ASVS COMPLIANCE
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — B | Bước 10**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Mô hình An toàn Thông tin Đa Tầng (Defense in Depth)

```
                            [ Khách hàng / Sinh viên / Chuyên gia ]
                                              │ (HTTPS / TLS 1.3)
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │    CORS Policy & WAF Rate Limiting        │
                        └─────────────────────┬─────────────────────┘
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │   JWT Bearer Authentication & RBAC        │
                        └─────────────────────┬─────────────────────┘
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │   Zero-Trust Resource Access Control      │
                        │   (Owner Check & 403 Forbidden Gate)      │
                        └─────────────────────┬─────────────────────┘
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │   Data Sanitization & XSS / SQLi Guard    │
                        └─────────────────────┬─────────────────────┘
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │   Pseudonymization & PII Masking Engine   │
                        └─────────────────────┬─────────────────────┘
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │   SQL Server DB (Constraints & Hashes)    │
                        └───────────────────────────────────────────┘
```

---

## 2. Bảng Đối chiếu Chuẩn Bảo mật OWASP ASVS v4.0

| Nhóm kiểm soát OWASP | Biện pháp kỹ thuật áp dụng trong UniMind | Mức độ tuân thủ |
| :--- | :--- | :---: |
| **V1: Architecture** | Phân tầng Clean Architecture nghiêm ngặt; tách biệt Domain, Application, Infrastructure và WebAPI; không để lộ Domain Entity qua API. | Đạt Chuẩn Level 2 |
| **V2: Authentication** | Băm mật khẩu bằng BCrypt/Argon2 với Salt ngẫu nhiên; cấp phát Access Token thời hạn ngắn kết hợp cơ chế kiểm tra Claim phân quyền; bảo vệ chống tấn công Brute-force. | Đạt Chuẩn Level 2 |
| **V3: Session Management** | JWT Stateless Token không lưu trữ trạng thái đăng nhập nhạy cảm tại máy chủ; Client lưu trữ an toàn trong Secure Storage / HttpOnly Cookie. | Đạt Chuẩn Level 2 |
| **V4: Access Control (Kiểm soát truy cập)** | Áp dụng mô hình **Zero-Trust**: Kiểm tra quyền sở hữu tài nguyên ở tầng Application Service và Controller (VD: Chỉ đúng sinh viên sở hữu ca hẹn mới được phép vào phòng họp SafeCall; nếu khác ID lập tức trả về `403 Forbidden`). | Đạt Chuẩn Level 3 |
| **V5: Validation & Sanitization** | Khử khuẩn đầu vào (Input Sanitization) phòng chống tấn công Stored XSS; sử dụng ORM tham số hóa (Parameterized Queries) loại trừ 100% rủi ro SQL Injection. | Đạt Chuẩn Level 2 |
| **V8: Data Protection & Privacy** | Áp dụng nguyên tắc **Pseudonymization (Ẩn danh hóa)**: Tuyệt đối không lưu hoặc trả về MSSV, Họ tên thật ra API cộng đồng; chỉ hiển thị bí danh dạng `"Mây Trắng #841"`. Nhật ký cảm xúc được bảo vệ riêng tư 100%. | Đạt Chuẩn Level 3 |
| **V10: Malicious Code & AI NLP** | Hệ thống kiểm duyệt kép tự động phát hiện ngôn từ độc hại và nguy cơ tự hại ($RiskScore \ge 75$); tự động gắn cờ (`Flagged`) và ẩn khỏi sinh viên thông thường. | Đạt Chuẩn Level 2 |
| **V14: Configuration & Secrets** | Không hardcode khóa bí mật (API Key Gemini, Cloudinary Secret, Connection String) trong mã nguồn Git; quản lý qua biến môi trường `appsettings.json` và Secret Manager. | Đạt Chuẩn Level 2 |

---

## 3. Định dạng Xử lý Lỗi Thống nhất (RFC 7807 ProblemDetails & Result Pattern)
Mọi phản hồi lỗi từ hệ thống đều được định dạng nhất quán qua `Result<T>` và `ExceptionHandlingMiddleware`:

```json
{
  "success": false,
  "errorCode": "DOUBLE_BOOKING_CONFLICT",
  "message": "Khung giờ này vừa được người khác đăng ký. Vui lòng chọn khung giờ khác!",
  "timestamp": "2026-10-22T08:30:00.000Z"
}
```
Các mã lỗi tiêu chuẩn:
- `400 BAD_REQUEST`: Dữ liệu đầu vào không hợp lệ hoặc trùng lặp Email.
- `401 UNAUTHORIZED`: Người dùng chưa đăng nhập hoặc token đã hết hạn.
- `403 FORBIDDEN`: Không có quyền truy cập tài nguyên (Zero-Trust chặn cuộc họp lạ, hoặc chuyên viên bị tước quyền).
- `404 NOT_FOUND`: Không tìm thấy tài nguyên (chuyên gia, bài viết, ca hẹn).
- `409 CONFLICT`: Xung đột đồng thời (Trùng lịch tư vấn - Double-booking).
- `500 INTERNAL_SERVER_ERROR`: Lỗi hệ thống ngoài dự kiến (tự động ghi log chi tiết).
