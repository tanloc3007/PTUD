# 📚 HỆ THỐNG TÀI LIỆU DỰ ÁN UNIMIND
**Đề tài:** Nền tảng Nhật ký Cảm xúc & Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Môn học:** Phát triển Ứng dụng (PTUD) — Giảng viên hướng dẫn: ThS. Lê Minh Nhật  
**Trường:** Đại học Lạc Hồng (LHU)  

---

## 👥 Danh sách Sinh viên Thực hiện
| STT | Họ và Tên | Mã số Sinh viên | Phân công phụ trách |
|---|---|---|---|
| 1 | **Ngô Tấn Lộc** | `120000212` | Xác thực (Auth), Nhật ký Cảm xúc, AI Sentiment Analysis, Quản lý Bài test DASS-21 |
| 2 | **Lê Minh Luân** | `120000352` | Đặt lịch tư vấn, Chống trùng lịch, Góc chia sẻ ẩn danh, Báo cáo & Audit Logs Admin |

---

## 📑 Danh mục Tài liệu Chi tiết

Dưới đây là liên kết đến toàn bộ các tài liệu đặc tả giao diện, chức năng và kỹ thuật của hệ thống UniMind:

1. [**Hướng dẫn Giao diện & Chức năng Phân hệ Sinh viên (Student Portal Guide)**](STUDENT_PORTAL_GUIDE.md)  
   *Mô tả chi tiết Trang chủ, Nhật ký cảm xúc kèm AI Sentiment, Góc chia sẻ cộng đồng ẩn danh, Bài kiểm tra DASS-21, Đặt lịch tư vấn và Phòng An Yên (SafeRoom Live).*

2. [**Hướng dẫn Giao diện & Chức năng Phân hệ Chuyên viên (Expert Portal Guide)**](EXPERT_PORTAL_GUIDE.md)  
   *Mô tả chi tiết Bàn làm việc Workspace, Quy trình tiếp nhận & Phê duyệt lịch hẹn ca tư vấn, Phòng tham vấn trực tuyến SafeRoom Live, Phân tích & Cảnh báo Triage nguy cơ, Kiểm duyệt nội dung.*

3. [**Hướng dẫn Giao diện & Chức năng Phân hệ Quản trị viên (Admin Portal Guide)**](ADMIN_PORTAL_GUIDE.md)  
   *Mô tả chi tiết Dashboard tổng quan với biểu đồ tự động co giãn và biểu đồ tròn cảm xúc, Quản lý người dùng, Báo cáo & Thống kê CSDL, Bộ lọc từ khóa nhạy cảm, Quản lý thang đo tâm lý, Nhật ký hệ thống (Audit Logs).*

4. [**Kiến trúc Hệ thống & Đặc tả Kỹ thuật (Technical Specifications & API)**](SYSTEM_ARCHITECTURE_AND_API.md)  
   *Mô tả mô hình Clean Architecture 4 tầng, Database ERD Schema, Danh mục các API Endpoints, Quy trình bảo mật & Ẩn danh.*

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy Nhanh

### 1. Khởi động Toàn bộ Hệ thống (One-Click Start)
Chạy tệp script đã được cấu hình sẵn tại thư mục gốc:
```powershell
.\start-system.ps1
```
Hoặc:
```cmd
start-system.bat
```

### 2. Khởi chạy thủ công từng phần
- **Backend (.NET 8 WebAPI):**
  ```powershell
  cd backend/src/Presentation/WebAPI
  dotnet run
  ```
  API Server hoạt động tại: `http://localhost:5080` (Swagger UI: `http://localhost:5080/swagger`).

- **Frontend (React + Vite):**
  ```powershell
  cd frontend
  npm install
  npm run dev
  ```
  Ứng dụng web hoạt động tại: `http://localhost:5173`.

---

## 🔑 Tài khoản Thử nghiệm Mẫu (Demo Accounts)

| Vai trò | Email đăng nhập | Mật khẩu | Chức năng chính |
|---|---|---|---|
| **Quản trị viên (Admin)** | `admin@unimind.edu.vn` | `123456` | Toàn quyền Dashboard, Quản trị Users, Từ khóa, Báo cáo, Audit Logs |
| **Chuyên viên (Expert)** | `expert@unimind.edu.vn` | `123456` | Bàn làm việc, Duyệt ca hẹn, Mở phòng SafeRoom Live, Phân tích Triage |
| **Sinh viên (Student)** | `student@unimind.edu.vn` | `123456` | Ghi nhật ký, Đăng bài ẩn danh, Làm test DASS-21, Đặt lịch hẹn |
