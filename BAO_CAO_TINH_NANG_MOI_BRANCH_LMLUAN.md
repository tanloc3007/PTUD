# BÁO CÁO CÁC TÍNH NĂNG VÀ CẢI TIẾN ĐÃ TRIỂN KHAI
**Dự án**: Hệ thống nhật ký cảm xúc & tư vấn tâm lý ẩn danh dành cho sinh viên (UniMind)  
**Môn học**: Phát triển ứng dụng (PTUD) - Giảng viên hướng dẫn: ThS. Lê Minh Nhật - ĐH Lạc Hồng  
**Nhánh triển khai (Git Branch)**: `LMLuan`  
**Thành viên thực hiện**: Lê Minh Luân (MSSV: 120000352)  
**Thời gian hoàn thành**: Tháng 10/2026  

---

## 📌 TỔNG QUAN CÔNG VIỆC THỰC HIỆN
Toàn bộ 5 yêu cầu cải tiến chức năng đã được thiết kế, lập trình và kiểm thử hoàn tất trên nhánh `LMLuan` tuân thủ nghiêm ngặt mô hình **Clean Architecture (.NET 8 Web API)** ở Backend và **Feature-Based React (Vite)** ở Frontend.

| STT | Tính năng yêu cầu | Tình trạng | Phạm vi hiện thực |
|:---:|:---|:---:|:---|
| **1** | **Chuyên viên xem người dùng có cần tư vấn tâm lý hay không** | ✅ Đã hoàn thành | Database + Backend API + Giao diện Chuyên viên |
| **2** | **Xử lý sinh viên viết bài viết / nhật ký bằng Tiếng Anh** | ✅ Đã hoàn thành | NLP Service song ngữ + Từ khóa + UI gợi ý song ngữ |
| **3** | **Góc chia sẻ: Đính kèm hình ảnh và xóa bài viết cá nhân** | ✅ Đã hoàn thành | Database + CRUD API (Authorization) + UI Sinh viên |
| **4** | **Kiểm duyệt hình ảnh bài viết (Chuyên viên & Admin)** | ✅ Đã hoàn thành | Workflow 3 trạng thái + API duyệt ảnh + UI kiểm duyệt |
| **5** | **Rà soát & chuẩn hóa bài trắc nghiệm DASS-21 chuẩn quốc tế** | ✅ Đã hoàn thành | Chuẩn Lovibond 1995 (7-7-7, nhân đôi điểm, 5 ngưỡng) |

---

## 1. CHI TIẾT CÁC TÍNH NĂNG ĐÃ TRIỂN KHAI

### 1.1. Tính năng 1: Sàng lọc & Phân tầng nhu cầu tư vấn tâm lý (Consultation Need Triage)
- **Mục tiêu**: Giúp chuyên viên tâm lý chủ động nắm bắt danh sách sinh viên đang trong vùng rủi ro tâm lý cần can thiệp hoặc khuyến nghị tham vấn, không để sót các ca trầm cảm/khủng hoảng tiềm ẩn.
- **Backend**:
  - Bổ sung trường `NeedsConsultation` (Boolean) và các mức độ nghiêm trọng `DepressionSeverity`, `AnxietySeverity`, `StressSeverity` vào bảng `dbo.TestResults`.
  - Khai báo DTO `StudentConsultationAssessmentDto` mang đầy đủ thông tin: Bí danh sinh viên, Khoa, Mức độ rủi ro (`Urgent` 🔴, `Recommended` 🟡, `Stable` 🟢), Điểm số 3 thang DASS-21, Lý do lâm sàng tổng hợp và Gợi ý hành động.
  - Endpoint: `GET /api/expert/consultation-assessments` được điều phối qua `IExpertWorkspaceService`.
- **Frontend** ([WorkspacePage.jsx](file:///C:/PTUD/PTUD/frontend/src/features/expert/pages/WorkspacePage.jsx)):
  - Tích hợp khối **"Đánh Giá Người Dùng Cần Tư Vấn Tâm Lý"** ngay trên bàn làm việc của Chuyên viên.
  - Hỗ trợ bộ lọc nhanh:
    - *Cần tư vấn* (Gồm Urgent và Recommended)
    - *Khẩn cấp* (🔴 Điểm số DASS-21 vượt ngưỡng tự điều tiết hoặc có nhật ký khủng hoảng)
    - *Khuyến nghị* (🟡 Mức độ căng thẳng/lo âu trung bình)
    - *Ổn định* (🟢 Chỉ số bình thường)
  - Cung cấp 2 nút hành động trực tiếp: **"Xếp lịch tư vấn"** (điều hướng mở lịch hẹn) và **"Vào SafeRoom"** (kết nối phòng tham vấn trực tuyến 1-1).

---

### 1.2. Tính năng 2: Xử lý bài viết & Nhật ký bằng Tiếng Anh (English NLP Sentiment)
- **Mục tiêu**: Đáp ứng nhu cầu sinh viên các chương trình quốc tế, chất lượng cao hoặc sinh viên có thói quen giải tỏa cảm xúc bằng tiếng Anh.
- **Backend** ([AISentimentService.cs](file:///C:/PTUD/PTUD/backend/src/Infrastructure/ExternalServices/AI/AISentimentService.cs)):
  - Bổ sung từ điển cảm xúc tiếng Anh chuyên sâu:
    - `PositiveWords`: *happy, joyful, grateful, proud, calm, peaceful, relieved, optimistic, confident, blessed, loved,...*
    - `NegativeWords`: *depressed, anxious, exhausted, hopeless, lonely, sad, tired, stressed, broke, helpless, nervous, hurt,...*
    - `CrisisWords`: *suicide, kill myself, self-harm, end my life, want to die, overdosing, jump off,...*
  - Hiện thực hàm `IsEnglishText(text)` tự động nhận diện ngôn ngữ dựa trên mật độ từ vựng tiếng Anh.
  - **Tự động thích ứng ngôn ngữ**:
    - Khi nhận diện văn bản tiếng Anh, AI sinh lời nhận định và lời khuyên nâng đỡ bằng tiếng Anh chuẩn tâm lý học đường.
    - Đưa ra bài tập thở **Box Breathing** hoặc **4-7-8 Breathing Technique** hướng dẫn chi tiết bằng tiếng Anh.
- **Database**:
  - Insert các từ khóa khủng hoảng tiếng Anh vào bảng `dbo.SensitiveKeywords` để hệ thống tự động kích hoạt cờ Triage khi quét bài viết tiếng Anh.
- **Frontend** ([CommunityFeedPage.jsx](file:///C:/PTUD/PTUD/frontend/src/features/student/pages/CommunityFeedPage.jsx) & [JournalPage.jsx](file:///C:/PTUD/PTUD/frontend/src/features/student/pages/JournalPage.jsx)):
  - Gắn nhãn hướng dẫn `🌐 Song ngữ Anh - Việt (Bilingual EN / VI)` tại form viết nhật ký và chia sẻ tâm sự, giúp sinh viên yên tâm giãi bày.

---

### 1.3. Tính năng 3: Góc chia sẻ - Đính kèm hình ảnh & Xóa bài viết cá nhân
- **Mục tiêu**: Tăng tính biểu đạt cảm xúc qua hình ảnh minh họa và trao quyền tự chủ dữ liệu cho sinh viên khi muốn thu hồi bài đăng của mình.
- **Backend**:
  - Bổ sung các cột vào bảng `dbo.CommunityPosts`: `ImageUrl NVARCHAR(500) NULL`, `ImageModerationStatus NVARCHAR(30) NOT NULL DEFAULT 'None'`, `ImageModerationNote NVARCHAR(500) NULL`.
  - Khởi tạo API `DELETE /api/community/posts/{postId}`:
    - Kiểm tra quyền sở hữu chặt chẽ: Chỉ sinh viên tạo bài viết (`StudentId == currentUserId`) hoặc Chuyên viên/Quản trị viên (`isStaff == true`) mới có quyền xóa.
    - Tự động xóa bài viết và làm sạch bình luận liên quan khỏi cơ sở dữ liệu SQL Server.
- **Frontend** ([CommunityFeedPage.jsx](file:///C:/PTUD/PTUD/frontend/src/features/student/pages/CommunityFeedPage.jsx)):
  - **Đính kèm hình ảnh**:
    - Thêm ô nhập link ảnh kèm 4 ảnh chủ đề thư giãn mẫu (*🌿 Bầu trời xanh*, *🍵 Góc đọc sách*, *🌅 Bình minh*, *🌧️ Mưa êm dịu*).
    - Khung xem trước ảnh trực quan trước khi đăng.
  - **Hiển thị & Xóa bài**:
    - Bài viết của chính sinh viên đang đăng nhập được gắn huy hiệu **"Bài của bạn"** và nút màu đỏ **"Xóa bài"**.
    - Khi bấm xóa, hệ thống hiển thị hộp thoại xác nhận an toàn trước khi gửi lệnh lên server.

---

### 1.4. Tính năng 4: Kiểm duyệt hình ảnh bài viết (Image Moderation)
- **Mục tiêu**: Đảm bảo môi trường học đường an toàn, ngăn chặn hình ảnh bạo lực, nhạy cảm hoặc mang tính kích động tiêu cực.
- **Workflow kiểm duyệt**:
  1. Khi sinh viên đăng bài kèm ảnh: Trạng thái khởi tạo là `None` hoặc `Pending`.
  2. Chuyên viên hoặc Admin có thể gắn 1 trong 3 trạng thái:
     - `Approved`: Hình ảnh hợp lệ, hiển thị công khai.
     - `Flagged`: Hình ảnh có yếu tố nhạy cảm -> Làm mờ trên bảng tin, kèm cảnh báo và nút *"Xem ảnh"*.
     - `Rejected`: Hình ảnh vi phạm tiêu chuẩn -> Ẩn hoàn toàn hình ảnh, thay bằng thông báo *"Hình ảnh đã bị ẩn do vi phạm tiêu chuẩn cộng đồng"*.
- **Backend**:
  - API `PATCH /api/community/posts/{postId}/moderate-image` nhận payload: `{ action: "Approved" | "Rejected" | "Flagged", note: "..." }`.
- **Frontend**:
  - [Expert ModerationPage.jsx](file:///C:/PTUD/PTUD/frontend/src/features/expert/pages/ModerationPage.jsx) & [Admin ModerationPage.jsx](file:///C:/PTUD/PTUD/frontend/src/features/admin/pages/ModerationPage.jsx):
    - Bổ sung bộ lọc tab **"Có hình ảnh"**.
    - Hiển thị thumbnail ảnh cùng 3 nút duyệt nhanh: `✓ Duyệt ảnh`, `⚠️ Gắn cờ nhạy cảm`, `✕ Từ chối / Ẩn ảnh`.

---

### 1.5. Tính năng 5: Chuẩn hóa trắc nghiệm DASS-21 theo chuẩn y khoa Lovibond (1995)
- **Mục tiêu**: Rà soát, khắc phục triệt để sai lệch trong bộ 21 câu hỏi và cách chấm điểm, bảo đảm độ chính xác lâm sàng tương đương bệnh viện tâm thần và phòng tham vấn quốc tế.
- **Các tiêu chuẩn đã chuẩn hóa**:
  1. **Phân bổ chuẩn 7 - 7 - 7**:
     - **Căng thẳng (Stress - 7 câu)**: Câu 1, 6, 8, 11, 12, 14, 18.
     - **Lo âu (Anxiety - 7 câu)**: Câu 2, 4, 7, 9, 15, 19, 20.
     - **Trầm cảm (Depression - 7 câu)**: Câu 3, 5, 10, 13, 16, 17, 21.
  2. **Công thức tính điểm**:
     - Điểm thô từng thang đo ($0 - 21$) bắt buộc nhân đôi ($x2$) để quy về thang chuẩn $0 - 42$ điểm.
  3. **Ma trận phân loại 5 ngưỡng lâm sàng Lovibond & Lovibond (1995)**:
     - **Trầm cảm (Depression)**: $0-9$ (Bình thường), $10-13$ (Nhẹ), $14-20$ (Vừa), $21-27$ (Nặng), $28+$ (Rất nặng).
     - **Lo âu (Anxiety)**: $0-7$ (Bình thường), $8-9$ (Nhẹ), $10-14$ (Vừa), $15-19$ (Nặng), $20+$ (Rất nặng).
     - **Căng thẳng (Stress)**: $0-14$ (Bình thường), $15-18$ (Nhẹ), $19-25$ (Vừa), $26-33$ (Nặng), $34+$ (Rất nặng).
  4. **Cảnh báo cần tư vấn**:
     - Khi Trầm cảm $\ge 14$, Lo âu $\ge 10$, hoặc Stress $\ge 19$ (mức độ Vừa trở lên), cờ `NeedsConsultation` tự động bật sang `true`.
- **Frontend** ([TestPage.jsx](file:///C:/PTUD/PTUD/frontend/src/features/student/pages/TestPage.jsx)):
  - Sửa lại toàn bộ 21 câu hỏi khớp 100% bản dịch y khoa.
  - Khi có chỉ số vượt ngưỡng, trang kết quả hiển thị hộp thông báo màu cam nổi bật:
    > ⚠️ **Khuyến nghị: Bạn cần được hỗ trợ tư vấn tâm lý**  
    > Kèm nút điều hướng đặt lịch hẹn 1-1 với chuyên gia tâm lý học đường.

---

## 2. DANH SÁCH TẬP TIN ĐÃ THAY ĐỔI TRÊN BRANCH `LMLuan`

### 🗄️ Database
- `database/schema.sql`: Bổ sung các cột mới cho `CommunityPosts` và `TestResults`.
- `database/seed_data.sql`: Chuẩn hóa 21 câu hỏi DASS-21 theo tỷ lệ 7-7-7 và thêm từ khóa tiếng Anh.
- `database/run_utf8_seed.ps1`: Script PowerShell nạp seed data UTF-8 chống lỗi font tiếng Việt.

### ⚙️ Backend (.NET 8 Web API)
- `backend/Directory.Build.props`: Cấu hình `<CodePage>65001</CodePage>` hỗ trợ UTF-8 triệt để.
- `backend/src/Core/Domain/Enums/DomainEnums.cs`: Thêm enum `ImageModerationStatus`, `ConsultationNeedLevel`.
- `backend/src/Core/Domain/Entities/DomainEntities.cs`: Thêm trường mới cho `TestResult` và `CommunityPost`.
- `backend/src/Core/Application/Common/Models/Dtos.cs`: Bổ sung DTO kiểm duyệt ảnh, DTO sàng lọc tư vấn.
- `backend/src/Core/Application/Features/Services.cs`: Khai báo method xóa bài, duyệt ảnh, lấy danh sách đánh giá.
- `backend/src/Core/Application/Features/ServiceImplementations.cs`: Hiện thực nghiệp vụ DASS-21 x2, kiểm duyệt ảnh, phân tầng rủi ro.
- `backend/src/Infrastructure/ExternalServices/AI/AISentimentService.cs`: Bổ sung NLP đa ngôn ngữ Anh - Việt.
- `backend/src/Infrastructure/Persistence/Context/ApplicationDbContext.cs`: Đồng bộ ánh xạ CSDL cho các trường mới.
- `backend/src/Presentation/WebAPI/Controllers/Controllers.cs`: Bổ sung các endpoint DELETE post, PATCH moderate image, GET assessments.

### 💻 Frontend (React + Vite)
- `frontend/src/features/student/pages/TestPage.jsx`: Chuẩn hóa 21 câu hỏi, phân loại DASS-21 Lovibond, cảnh báo tư vấn.
- `frontend/src/features/student/pages/CommunityFeedPage.jsx`: Thêm form đính kèm ảnh, nút xóa bài, hiển thị ảnh có kiểm duyệt.
- `frontend/src/features/student/pages/JournalPage.jsx`: Hỗ trợ viết nhật ký song ngữ Anh - Việt.
- `frontend/src/features/expert/pages/WorkspacePage.jsx`: Bổ sung bảng sàng lọc & phân tầng nhu cầu tư vấn tâm lý.
- `frontend/src/features/expert/pages/ModerationPage.jsx`: Thêm bộ lọc ảnh và nút duyệt/ẩn/gắn cờ hình ảnh.
- `frontend/src/features/admin/pages/ModerationPage.jsx`: Tích hợp tính năng duyệt ảnh dành cho Admin.

---

## 3. HƯỚNG DẪN KIỂM THỬ (TEST GUIDE)

### Tài khoản thử nghiệm:
| Vai trò | Tên đăng nhập | Mật khẩu | URL kiểm tra |
|:---|:---|:---:|:---|
| **Sinh viên** | `student@unimind.edu.vn` (hoặc `student`) | `123456` | `http://localhost:5173/student/home` |
| **Chuyên viên** | `expert@unimind.edu.vn` (hoặc `expert`) | `123456` | `http://localhost:5173/expert/workspace` |
| **Quản trị viên** | `admin@unimind.edu.vn` (hoặc `admin`) | `123456` | `http://localhost:5173/admin/dashboard` |

### Quy trình kiểm thử nhanh:
1. **Kiểm tra Sàng lọc Tư vấn**: Đăng nhập tài khoản Chuyên viên -> Vào Bàn làm việc -> Cuộn xem mục *Đánh Giá Người Dùng Cần Tư Vấn Tâm Lý* -> Thử các tab lọc `Khẩn cấp (🔴)`, `Khuyến nghị (🟡)`.
2. **Kiểm tra DASS-21 chuẩn Lovibond**: Đăng nhập Sinh viên -> Vào `/student/test` -> Trả lời 21 câu hỏi -> Xem kết quả thang điểm $0-42$ và banner cảnh báo cần tư vấn.
3. **Kiểm tra Đăng ảnh & Xóa bài**: Vào `/student/community` -> Đăng bài chọn ảnh mẫu -> Xem bài viết có ảnh -> Bấm nút đỏ *Xóa bài* để xác nhận bài biến mất.
4. **Kiểm tra Duyệt ảnh**: Đăng bài có ảnh từ Sinh viên -> Chuyển sang tài khoản Chuyên viên hoặc Admin vào mục Kiểm duyệt -> Bấm tab *Có hình ảnh* -> Thử bấm *Duyệt ảnh*, *Gắn cờ nhạy cảm*, *Từ chối ảnh*.
5. **Kiểm tra Tiếng Anh**: Vào `/student/journal` -> Nhập bài nhật ký bằng tiếng Anh -> Lưu nhật ký -> Quan sát AI phân tích cảm xúc và đưa ra bài tập thở bằng tiếng Anh.

---

## 4. LỆNH KHỞI ĐỘNG HỆ THỐNG
- **Khởi động Backend .NET API**:
  ```powershell
  cd c:\PTUD\PTUD\backend\src\Presentation\WebAPI
  dotnet run
  ```
  *(Server lắng nghe tại `http://localhost:5080`)*

- **Khởi động Frontend React**:
  ```powershell
  cd c:\PTUD\PTUD\frontend
  npm run dev
  ```
  *(Truy cập ứng dụng tại `http://localhost:5173`)*
