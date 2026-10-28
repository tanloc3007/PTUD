# 03. NON-FUNCTIONAL REQUIREMENTS (YÊU CẦU PHI CHỨC NĂNG)
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — B | Bước 08**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Định hướng & Nguyên tắc đo lường
Các yêu cầu phi chức năng (NFR) dưới đây được đặc tả theo tiêu chuẩn kỹ thuật có thể đo lường được (*Measurable Metrics*), gắn liền với ngữ cảnh thực tế, công cụ kiểm thử và ngưỡng đạt cụ thể; tuyệt đối loại bỏ các khẩu hiệu mơ hồ như *"hệ thống phải nhanh"*, *"bảo mật cao"*, *"giao diện đẹp"*.

---

## 2. Bảng Đặc tả Chi tiết Yêu cầu Phi chức năng (NFR Matrix)

| Nhóm NFR | Yêu cầu kỹ thuật chi tiết | Bối cảnh & Điều kiện đo | Công cụ đo lường | Ngưỡng đạt yêu cầu (Threshold) |
| :--- | :--- | :--- | :--- | :--- |
| **Security (Bảo mật)** | - Mật khẩu người dùng được băm an toàn.<br>- Xác thực phân quyền qua JWT Bearer với thuật toán HMAC-SHA256.<br>- Chặn rò rỉ mã số sinh viên, email, họ tên thật ra API cộng đồng.<br>- Kiểm soát Zero-Trust tại phòng họp SafeCall. | Kiểm thử với 500 yêu cầu giả lập tấn công vượt quyền (IDOR) và dò quét endpoint. | Postman Newman, OWASP ZAP, Unit Test | - **0%** rò rỉ PII trong các API cộng đồng.<br>- 100% request không sở hữu ca hẹn truy cập phòng họp bị trả mã `403 Forbidden`.<br>- 100% mật khẩu trong CSDL được băm an toàn. |
| **Performance (Hiệu năng)** | - Tốc độ phản hồi trung bình của API đọc dữ liệu (bảng tin, danh sách ca hẹn, kết quả test).<br>- Tốc độ phản hồi API phân tích AI Sentiment (kết hợp cache và từ điển).<br>- Tốc độ tải trang ban đầu (First Contentful Paint). | 100 người dùng đồng thời, CSDL thử nghiệm 10.000 bài viết, 20.000 bình luận. | k6 Load Test, Chrome DevTools Lighthouse | - $p95$ của các API truy vấn $\le \mathbf{450ms}$.<br>- $p95$ của API phân tích AI $\le \mathbf{1.2s}$.<br>- Điểm Lighthouse Performance $\ge \mathbf{85/100}$. |
| **Availability (Độ sẵn sàng)** | - Mức độ sẵn sàng phục vụ của hệ thống trong kỳ thi cử và cao điểm.<br>- Khả năng tự phục hồi khi kết nối SQL Server gián đoạn tạm thời. | Hoạt động liên tục trong 30 ngày thử nghiệm tại trường ĐH Lạc Hồng. | Prometheus / HealthCheck Endpoint `/` | - Tỷ lệ sẵn sàng (Uptime) $\ge \mathbf{99.5\%}$.<br>- Thời gian tự kết nối lại CSDL $\le \mathbf{5s}$. |
| **Privacy (Quyền riêng tư)** | - Dữ liệu nhật ký cảm xúc cá nhân không thể bị đọc bởi người dùng khác hoặc nhân viên hỗ trợ.<br>- Cơ chế xóa dữ liệu hoặc ẩn danh hóa triệt để khi người dùng yêu cầu đóng tài khoản. | Kiểm tra truy xuất CSDL trực tiếp và kiểm toán tầng ứng dụng. | Privacy Audit Checklist, Clean Architecture Boundaries | - **100%** bài nhật ký bị cô lập theo `StudentId`.<br>- Không có API nào cho phép Admin xuất nội dung nhật ký cảm xúc dạng thô của sinh viên. |
| **Accessibility (Khả năng tiếp cận)** | - Tuân thủ tiêu chuẩn W3C WCAG 2.2 cấp độ AA.<br>- Độ tương phản màu sắc cho văn bản và thẻ cảm xúc.<br>- Điều hướng và nộp form đầy đủ bằng phím bấm (Tab, Enter, Escape). | Kiểm tra trên các màn hình chính (Đăng nhập, Viết nhật ký, Làm bài test DASS-21, Bảng tin). | axe DevTools, Lighthouse Accessibility | - Tỷ lệ tương phản chữ/nền $\ge \mathbf{4.5:1}$.<br>- 100% form và nút bấm thao tác được bằng bàn phím.<br>- Điểm Accessibility $\ge \mathbf{90/100}$. |
| **Maintainability (Khả năng bảo trì)** | - Tuân thủ cấu trúc Clean Architecture 4 tầng (Domain $\leftarrow$ Application $\leftarrow$ Infrastructure $\leftarrow$ Presentation).<br>- Tỷ lệ bao phủ kiểm thử tự động (Unit Test / Integration Test).<br>- Kiểm soát Lint và quy chuẩn mã nguồn C# và React. | Đánh giá mã nguồn trên repository Git. | dotnet test, ESLint, SonarQube | - Tỷ lệ bao phủ kiểm thử logic nghiệp vụ lõi (Application) $\ge \mathbf{80\%}$.<br>- 0 lỗi kiến trúc rò rỉ thực thể (Entity Leaking). |
| **Compatibility (Tương thích)** | - Tương thích hoàn hảo trên các trình duyệt hiện đại (Chrome, Edge, Firefox, Safari).<br>- Thiết kế Responsive trên các kích thước màn hình phổ biến. | Kiểm thử đa thiết bị và đa viewport: Mobile (375px, 414px), Tablet (768px, 1024px), Desktop (1440px, 1920px). | Chrome Responsive Mode, BrowserStack | - Không vỡ giao diện trên mọi độ phân giải từ 360px đến 2560px.<br>- Hoạt động trơn tru trên cả Windows, macOS, Android và iOS. |
