# 01. DEPLOYMENT RUNBOOK & OPERATIONS GUIDE
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — Mẫu 10 & Bước 15**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Thông số Cấu hình Môi trường (Environment Register)

| Tham số / Dịch vụ | Môi trường Development (Cục bộ) | Môi trường Production (Triển khai thật) |
| :--- | :--- | :--- |
| **Backend API Host** | `http://localhost:5080` | `https://unimind-api.lhu.edu.vn` |
| **Frontend Web Host** | `http://localhost:5173` | `https://unimind.lhu.edu.vn` |
| **Cơ sở dữ liệu** | SQL Server Local (`UniMindDb`) | SQL Server Standard Enterprise (Cluster HA) |
| **Connection String** | `Server=localhost;Database=UniMindDb;Trusted_Connection=True;TrustServerCertificate=True;` | Lấy từ Azure Key Vault / Environment Variable |
| **Cloudinary Cloud** | `kh0hrw3c` (Key: `668128831581771`) | Dedicated Enterprise CDN với Signed URL |
| **AI LLM API** | Google Gemini 2.5 Flash / Flash-Lite | Enterprise Private LLM Endpoint với SLA 99.9% |
| **WebRTC STUN/TURN** | `stun:stun.l.google.com:19302` | Turn Server Riêng với chứng thực Coturn |

---

## 2. Quy trình Khởi động Toàn bộ Hệ thống (Startup Runbook)

Dự án cung cấp sẵn script khởi động một chạm thuận tiện:

### Cách 1: Sử dụng Script tự động `start-system.bat` / `start-system.ps1`
1. Mở PowerShell hoặc Command Prompt tại thư mục gốc `b:\PTUD\PTUD`.
2. Chạy lệnh:
   ```powershell
   .\start-system.ps1
   ```
3. Hệ thống sẽ tự động:
   - Kiểm tra kết nối SQL Server và tự động nạp seed data nếu cơ sở dữ liệu trống.
   - Biên dịch và khởi chạy Backend .NET 8 WebAPI tại cổng `http://localhost:5080`.
   - Biên dịch và khởi chạy Frontend React Vite tại cổng `http://localhost:5173`.
   - Tự động mở trình duyệt truy cập hệ thống.

### Cách 2: Khởi động thủ công từng phân hệ

#### Bước 1: Khởi động Backend WebAPI
```bash
cd backend/src/Presentation/WebAPI
dotnet restore
dotnet build
dotnet run --urls "http://localhost:5080"
```
- Kiểm tra trạng thái hoạt động: Truy cập `http://localhost:5080/` (Trả về JSON HealthCheck `Healthy`).
- Kiểm tra tài liệu Swagger: Truy cập `http://localhost:5080/swagger`.

#### Bước 2: Khởi động Frontend React Vite
```bash
cd frontend
npm install
npm run dev
```
- Truy cập giao diện người dùng tại `http://localhost:5173`.

---

## 3. Danh mục Tài khoản Mặc định Dùng Kiểm thử (Seed Accounts)

| Vai trò | Email đăng nhập | Mật khẩu | Bí danh ẩn danh | Ghi chú quyền hạn |
| :--- | :--- | :--- | :--- | :--- |
| **Sinh viên (Student)** | `student@lhu.edu.vn` (hoặc `student`) | `123456` | *"Cú Mèo Say Ngủ #402"* | Đầy đủ tính năng sinh viên, đã có sẵn nhật ký và lịch hẹn mẫu |
| **Chuyên viên (Expert)** | `expert@lhu.edu.vn` (hoặc `expert`) | `123456` | *"ThS. Lê Hoàng An"* | Chuyên viên tâm lý lâm sàng P.302, sở hữu đầy đủ quyền workspace |
| **Quản trị viên (Admin)** | `admin@lhu.edu.vn` (hoặc `admin`) | `123456` | *"Quản trị viên Hệ thống"* | Toàn quyền kiểm duyệt, phân quyền, từ khóa và tra cứu audit log |
