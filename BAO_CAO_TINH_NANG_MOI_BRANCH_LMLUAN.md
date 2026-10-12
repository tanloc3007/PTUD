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

### 1.6. Chuẩn hóa Audit Log Quản trị viên, Thang đo Nguy cơ Từ khóa & Ma trận Phân quyền (Chuẩn Playbook v1.0)

#### A. Ghi nhật ký bảo mật mọi hành động Quản trị viên (Admin Audit Log)
- **Cơ sở Playbook**: Tuân thủ chuẩn `ACT-ADM` (Trang 4 & Trang 7 Playbook: *"Quản trị viên thực hiện các quyền nhạy cảm, bắt buộc phải ghi nhật ký kiểm toán hệ thống"*).
- **Hiện thực Backend**: Bảng `dbo.AuditLogs` ghi vết tự động và liên tục mọi thao tác can thiệp của Quản trị viên:
  - `ADMIN_TOGGLE_USER_STATUS`: Khóa hoặc mở khóa tài khoản người dùng/sinh viên vi phạm.
  - `ADMIN_MODERATE_POST`: Phê duyệt, ẩn, từ chối hoặc kích hoạt can thiệp SOS đối với bài viết diễn đàn.
  - `MODERATE_IMAGE`: Phê duyệt, gắn cờ nhạy cảm hoặc ẩn ảnh bài viết cộng đồng.
  - `ADMIN_ADD_KEYWORD`: Thêm từ khóa nhạy cảm vào bộ lọc kèm phân loại và trọng số rủi ro ($1 - 100$).
  - `ADMIN_DELETE_KEYWORD`: Xóa từ khóa khỏi danh mục kiểm duyệt.
  - `ADMIN_UPDATE_ROLE`: Điều chỉnh phân quyền người dùng (Student / Expert / Admin).
- **Dữ liệu kiểm toán lưu trữ**: `Id`, `ActionType`, `Details`, `ActorRole` ("Admin"), `ActorId`, `IpAddress`, `CreatedAt`. Truy xuất qua `GET /api/admin/audit-logs` và `GET /api/admin/audit-log-history`.

#### B. Thang đo mức độ nguy cơ từ khóa (Risk Weight) & Đánh giá chuẩn y khoa
- **Thang điểm trọng số từ khóa (`dbo.SensitiveKeywords.RiskWeight` từ $1 - 100$)**:
  - 🔴 **Mức nguy cơ cực đoan (90 - 99 điểm)**: Nhóm `SelfHarm` (vd: *tự tử: 99*, *nhảy lầu: 99*, *rạch tay: 95*, *uống thuốc ngủ: 92*, *end my life: 99*, *suicide: 99*). Kích hoạt ngay cảnh báo khẩn cấp `TriageLevel.Urgent` và tự động ẩn khỏi bảng tin sinh viên.
  - 🟡 **Mức nguy cơ cao (70 - 89 điểm)**: Nhóm `AcademicFraud`, `Harassment`, bạo lực ngôn từ (vd: *mua bán điểm: 80*, *bế tắc tột cùng: 75*). Kích hoạt `TriageLevel.High` đưa vào hàng đợi kiểm duyệt.
  - 🟢 **Mức căng thẳng học đường (30 - 69 điểm)**: Nhóm `AcademicStress`, áp lực thi cử, mất ngủ nhẹ.
- **Tích hợp đánh giá chuẩn lâm sàng Lovibond (1995)**:
  - 21 câu hỏi DASS-21 chuẩn hóa tỷ lệ 7-7-7 (Trầm cảm, Lo âu, Căng thẳng).
  - Điểm thô nhân đôi ($x2$) quy đổi sang thang chuẩn $0 - 42$.
  - Khi Trầm cảm $\ge 14$, Lo âu $\ge 10$, hoặc Stress $\ge 19$ (mức độ Vừa trở lên): Cờ `NeedsConsultation = true` tự động bật, đưa sinh viên vào danh sách phân tầng tư vấn của chuyên viên.

#### C. Ma trận phân quyền chi tiết (RBAC Permission Matrix)
Tuân thủ **Mẫu 02 (Actor Matrix)** & **Mẫu 05 (Module Permission)** trong Playbook:

| Tác vụ / Chức năng | Sinh viên (`Student`) | Chuyên viên (`Expert`) | Quản trị viên (`Admin`) | Ghi chú bảo mật & Phạm vi (Scope) |
|:---|:---:|:---:|:---:|:---|
| **Viết & xem nhật ký cảm xúc** | ✅ (Chính mình) | ❌ | ❌ | **Bảo mật tuyệt đối**: Chỉ chủ sở hữu đọc được. |
| **Làm trắc nghiệm DASS-21** | ✅ (Chính mình) | ❌ | ❌ | Lưu điểm vào hồ sơ tâm lý cá nhân. |
| **Đăng bài & bình luận cộng đồng** | ✅ (Ẩn danh) | ✅ (Công khai danh xưng) | ✅ (Công khai danh xưng) | Sinh viên luôn được cấp bí danh ngẫu nhiên. |
| **Đính kèm hình ảnh khi đăng bài** | ✅ (Chính mình) | ✅ | ✅ | Ảnh đi qua quy trình kiểm duyệt 3 trạng thái. |
| **Xóa bài viết cộng đồng** | ✅ (Chỉ bài của mình) | ✅ (Bài vi phạm) | ✅ (Toàn hệ thống) | Phân quyền kiểm tra `StudentId == currentUserId`. |
| **Xem bảng tin cộng đồng** | ✅ (Bài đã duyệt) | ✅ (Xem cả bài bị gắn cờ) | ✅ (Xem cả bài bị gắn cờ) | Bài chứa từ khóa nguy cơ bị ẩn với sinh viên. |
| **Kiểm duyệt bài viết & hình ảnh** | ❌ | ✅ (Chuyên môn) | ✅ (Toàn quyền) | Thay đổi trạng thái: Approved / Flagged / Rejected. |
| **Đặt & hủy lịch hẹn tư vấn** | ✅ (Chính mình) | ❌ | ❌ | Chống trùng lịch (Double Booking) triệt để. |
| **Tiếp nhận & đổi lịch tư vấn** | ❌ | ✅ (Lịch của mình) | ✅ (Điều phối) | Chuyên viên quản lý ca trực được giao. |
| **Sàng lọc người cần tư vấn (Triage)** | ❌ | ✅ (Danh sách ẩn danh) | ✅ (Xem tổng thể) | Chỉ hiển thị Bí danh, Khoa, Điểm DASS-21, Mức rủi ro. |
| **Vào phòng tham vấn SafeRoom** | ✅ (Khi có hẹn) | ✅ (Chuyên viên phụ trách) | ❌ | Phòng tương tác bảo mật 1-1 chuyên gia - sinh viên. |
| **Thêm / xóa từ khóa nhạy cảm** | ❌ | ✅ (Từ khóa chuyên môn) | ✅ (Toàn quyền) | Tự động cập nhật trọng số `RiskWeight`. |
| **Quản lý & khóa tài khoản người dùng** | ❌ | ❌ | ✅ (Toàn quyền) | **Bắt buộc ghi Audit Log**. |
| **Xem báo cáo & Thống kê toàn trường** | ❌ | ❌ | ✅ (Toàn quyền) | Thống kê số liệu ẩn danh vĩ mô. |
| **Xem nhật ký kiểm toán (Audit Logs)** | ❌ | ❌ | ✅ (Toàn quyền) | **Truy vết mọi thao tác nhạy cảm của Admin**. |

#### D. Phân quyền chức năng hạt nhân cho từng Chuyên viên (Granular Expert Permissions)
- **Đáp ứng yêu cầu**: Admin có toàn quyền cấp phát hoặc thu hồi quyền truy cập từng phân hệ đối với từng Chuyên viên cụ thể:
  1. `PERM_WORKSPACE` (**Bàn làm việc & Sàng lọc**): Truy cập Bàn làm việc, danh sách Triage sàng lọc người cần tư vấn và kết nối SafeRoom.
  2. `PERM_SCHEDULE` (**Lịch hẹn & Duyệt ca trực**): Quản lý khung giờ trực, tiếp nhận, phê duyệt hoặc từ chối lịch hẹn của sinh viên.
  3. `PERM_ANALYTICS` (**Phân tích & Cảnh báo tâm lý**): Xem báo cáo thống kê, biểu đồ phân tích tâm lý học đường và danh sách cảnh báo SOS.
  4. `PERM_MODERATION` (**Kiểm duyệt bài viết & Hình ảnh**): Kiểm duyệt bài viết diễn đàn chứa từ khóa nhạy cảm, duyệt hình ảnh đính kèm.
- **Kịch bản thực tế đã cấu hình**:
  - **Chuyên viên 1 (ThS. Nguyễn Thanh Hà - `tha@unimind.edu.vn`)**: Được cấp `['PERM_WORKSPACE', 'PERM_SCHEDULE']` $\rightarrow$ Menu Cổng Chuyên viên chỉ hiển thị *Bàn làm việc* và *Lịch hẹn & Duyệt ca*; nếu cố truy cập tab khác sẽ bị chặn bằng màn hình cảnh báo 403.
  - **Chuyên viên 2 (TS. Trần Mai Lan - `lan.tran@unimind.edu.vn`)**: Được cấp `['PERM_ANALYTICS', 'PERM_MODERATION']` $\rightarrow$ Menu Cổng Chuyên viên chỉ hiển thị *Phân tích & Cảnh báo* và *Kiểm duyệt bài viết*.
- **Giao diện Admin Portal**: Tại trang `/admin/users`, cạnh mỗi tài khoản Chuyên viên có nút **"🛡️ Phân quyền"** mở hộp thoại cấu hình trực quan với 3 nút Preset một chạm (Chuyên viên 1, Chuyên viên 2, Toàn quyền).
- **Audit Log tự động**: Mỗi lần Admin cập nhật quyền cho chuyên viên, hệ thống ghi sự kiện `ADMIN_UPDATE_EXPERT_PERMISSIONS` vào bảng `dbo.AuditLogs`.

#### E. Đổi mới Công nghệ Cuộc họp Tư vấn: Cơ chế Báo Động Trực Tuyến & Phân Quyền Zero-Trust 1-1 (Thay thế mô hình mã mời)
- **Vấn đề của mô hình cũ**: Chuyên viên mở phòng phải gửi mã mời thủ công cho sinh viên, sau đó sinh viên phải nhập mã mới vào được $\rightarrow$ Trải nghiệm phức tạp, dễ lộ mã phòng và không bảo mật.
- **Mô hình kiến trúc mới hoàn toàn tự động**:
  1. **Khởi động từ Chuyên viên**: Khi chuyên viên nhấn **"Bắt đầu cuộc họp"** (`POST /api/appointments/{id}/start-meeting`), backend đánh dấu ca hẹn `IsMeetingActive = true`, ghi nhận `MeetingStartedAt` và tự động ghi sự kiện kiểm toán `AuditLog` (`ActionType = "EXPERT_START_MEETING"`).
  2. **Phát thông báo thời gian thực có chọn lọc (Selective Real-time Push)**:
     - API `GET /api/appointments/student/{studentId}/active-meeting` chỉ truy vấn ca hẹn của **đúng sinh viên đã đặt lịch với chuyên viên đó**.
     - **Chỉ duy nhất sinh viên có lịch hẹn được mở mới nhận được thông báo**: Một Banner nổi sang trọng (Floating Notification Card) kèm biểu tượng `🔴 LIVE` nhấp nháy lập tức xuất hiện trên màn hình của sinh viên đó, hiển thị rõ Tên chuyên viên, Mã ca hẹn, cùng nút bấm **"🎥 Tham gia ngay"**.
     - **Tất cả các sinh viên khác không bao giờ nhìn thấy thông báo này**.
  3. **Không cần nhập mã mời**: Sinh viên chỉ cần nhấn **"Tham gia ngay"**, hệ thống tự động điều hướng vào phòng tư vấn bảo mật tại `/student/meeting/{appointmentId}`.
  4. **Kiểm soát truy cập Zero-Trust (403 Forbidden)**:
     - Endpoint `GET /api/appointments/{id}/verify-participant` kiểm tra danh tính trước khi cho phép vào phòng.
     - Nếu bất kỳ sinh viên nào khác cố tình sao chép đường dẫn cuộc họp để truy cập trái phép, hệ thống lập tức trả về mã lỗi **403 Forbidden** và hiển thị màn hình từ chối màu đỏ: *"Quyền truy cập bị từ chối - Bạn không phải là sinh viên của ca hẹn này"*.
  5. **Tích hợp WebRTC & Tiện ích Thư giãn cho Sinh viên**:
     - Phòng họp nhúng WebRTC trực tuyến Jitsi Meet đồng bộ giữa chuyên viên và sinh viên.
     - Cổng sinh viên tích hợp thanh công cụ thư giãn với bài tập thở $4-7-8$ đếm nhịp trực quan giúp sinh viên giải tỏa áp lực và bình tĩnh trong suốt phiên tham vấn.
     - Chuyên viên có thể bấm **"🚪 Đóng phòng họp"** hoặc **"⏹️ Kết thúc phiên"** kèm lưu Sổ tay lâm sàng để tự động kết thúc phiên và gỡ bỏ thông báo ở phía sinh viên.

---

## 2. DANH SÁCH TẬP TIN ĐÃ THAY ĐỔI TRÊN BRANCH `LMLuan`

### 🗄️ Database
- `database/schema.sql`: Bổ sung các cột mới cho `CommunityPosts` và `TestResults`.
- `database/seed_data.sql`: Chuẩn hóa 21 câu hỏi DASS-21 theo tỷ lệ 7-7-7 và thêm từ khóa tiếng Anh.
- `database/run_utf8_seed.ps1`: Script PowerShell nạp seed data UTF-8 chống lỗi font tiếng Việt.

### ⚙️ Backend (.NET 8 Web API)
- `backend/Directory.Build.props`: Cấu hình `<CodePage>65001</CodePage>` hỗ trợ UTF-8 triệt để.
- `backend/src/Core/Domain/Enums/DomainEnums.cs`: Thêm enum `ImageModerationStatus`, `ConsultationNeedLevel`.
- `backend/src/Core/Domain/Entities/DomainEntities.cs`: Thêm trường mới cho `TestResult`, `CommunityPost`, `Appointment` (`IsMeetingActive`, `MeetingStartedAt`).
- `backend/src/Core/Application/Common/Models/Dtos.cs`: Bổ sung DTO kiểm duyệt ảnh, DTO sàng lọc tư vấn, `ActiveMeetingDto`.
- `backend/src/Core/Application/Features/Services.cs`: Khai báo method xóa bài, duyệt ảnh, mở/đóng cuộc họp, kiểm tra ca active cho sinh viên, xác thực participant.
- `backend/src/Core/Application/Features/ServiceImplementations.cs`: Hiện thực nghiệp vụ DASS-21 x2, kiểm duyệt ảnh, phân tầng rủi ro, quản lý meeting lifecycle kèm ghi `AuditLog`.
- `backend/src/Infrastructure/ExternalServices/AI/AISentimentService.cs`: Bổ sung NLP đa ngôn ngữ Anh - Việt.
- `backend/src/Infrastructure/Persistence/Context/ApplicationDbContext.cs`: Đồng bộ ánh xạ CSDL cho các trường mới.
- `backend/src/Presentation/WebAPI/Controllers/Controllers.cs`: Bổ sung endpoints kiểm duyệt, active-meeting, start-meeting, end-meeting, verify-participant.

### 💻 Frontend (React + Vite)
- `frontend/src/features/student/pages/TestPage.jsx`: Chuẩn hóa 21 câu hỏi, phân loại DASS-21 Lovibond, cảnh báo tư vấn.
- `frontend/src/features/student/pages/CommunityFeedPage.jsx`: Thêm form đính kèm ảnh, nút xóa bài, hiển thị ảnh có kiểm duyệt.
- `frontend/src/features/student/pages/JournalPage.jsx`: Hỗ trợ viết nhật ký song ngữ Anh - Việt.
- `frontend/src/features/student/pages/StudentMeetingRoomPage.jsx`: **(MỚI)** Phòng họp trực tuyến bảo mật cho sinh viên, xác thực quyền Zero-Trust (403), WebRTC Jitsi, tiện ích thư giãn 4-7-8.
- `frontend/src/app/layouts/StudentLayout.jsx`: **(MỚI)** Polling kiểm tra cuộc họp chủ động, Banner thông báo nổi bật độc quyền cho sinh viên của ca hẹn, Topbar indicator.
- `frontend/src/app/router/AppRoutes.jsx`: Đăng ký tuyến đường bảo vệ `/student/meeting/:id`.
- `frontend/src/features/expert/pages/ConsultationRoomPage.jsx`: Kích hoạt `start-meeting`, `end-meeting`, nút đóng phòng và kết thúc phiên.
- `frontend/src/features/expert/pages/WorkspacePage.jsx`: Bổ sung bảng sàng lọc & phân tầng nhu cầu tư vấn tâm lý.
- `frontend/src/features/expert/pages/ModerationPage.jsx`: Thêm bộ lọc ảnh và nút duyệt/ẩn/gắn cờ hình ảnh.
- `frontend/src/features/admin/pages/UsersPage.jsx`: Giao diện phân quyền 4 phân hệ chi tiết cho từng chuyên viên kèm Audit Log.
- `frontend/src/features/admin/pages/ModerationPage.jsx`: Tích hợp tính năng duyệt ảnh dành cho Admin.

---

## 3. HƯỚNG DẪN KIỂM THỬ (TEST GUIDE)

### Tài khoản thử nghiệm:
| Vai trò | Tên đăng nhập | Mật khẩu | URL kiểm tra |
|:---|:---|:---:|:---|
| **Sinh viên 1 (Có lịch hẹn)** | `student@unimind.edu.vn` (hoặc `student`) | `123456` | `http://localhost:5173/student/home` |
| **Chuyên viên** | `expert@unimind.edu.vn` (hoặc `expert`) | `123456` | `http://localhost:5173/expert/consultation` |
| **Quản trị viên** | `admin@unimind.edu.vn` (hoặc `admin`) | `123456` | `http://localhost:5173/admin/dashboard` |

### Quy trình kiểm thử nhanh:
1. **Kiểm tra Cuộc họp Tư vấn mới (Không cần mã mời - Push Notification & Zero-Trust)**:
   - **Bước 1**: Đăng nhập tài khoản Chuyên viên (`expert` / `123456`), vào trang Phòng tư vấn (`/expert/consultation`), chọn một ca hẹn của sinh viên và bấm **"🌐 Bắt Đầu Cuộc Họp Trực Tuyến Internet"**.
   - **Bước 2**: Đăng nhập tài khoản Sinh viên của ca hẹn đó (`student` / `123456`). Trong vòng vài giây, màn hình sinh viên xuất hiện **Floating Banner thông báo nổi bật**: *"Chuyên viên đang đợi bạn! Cuộc họp đang mở"*, kèm nút bấm **"🎥 Tham gia ngay"**.
   - **Bước 3**: Sinh viên bấm **"Tham gia ngay"** $\rightarrow$ Hệ thống đưa thẳng vào phòng họp `/student/meeting/{id}` mà **không cần nhập bất kỳ mã mời nào**. Sinh viên và Chuyên viên kết nối video/audio qua WebRTC Jitsi Meet.
   - **Bước 4 (Thử nghiệm Bảo mật 403 Forbidden)**: Đăng nhập một tài khoản Sinh viên khác hoặc cố gõ URL phòng họp của ca hẹn này $\rightarrow$ Hệ thống lập tức hiển thị màn hình đỏ từ chối: *"Quyền truy cập bị từ chối - Bạn không phải là sinh viên của ca hẹn này (403 Forbidden)"*.
   - **Bước 5**: Chuyên viên bấm **"🚪 Đóng phòng họp"** hoặc **"⏹️ Kết thúc phiên"** $\rightarrow$ Thông báo trên máy sinh viên tự động biến mất.
2. **Kiểm tra Phân quyền Chuyên viên**: Đăng nhập Admin (`admin` / `123456`) -> Vào `/admin/users` -> Bấm nút **"🛡️ Phân quyền"** trên Chuyên viên -> Thử áp dụng Preset `Chuyên viên 1 (Chỉ Workspace & Lịch hẹn)` hoặc `Chuyên viên 2 (Chỉ Phân tích & Kiểm duyệt)` -> Đăng nhập tài khoản Chuyên viên đó kiểm tra thanh menu bên trái tương ứng.
3. **Kiểm tra Sàng lọc Tư vấn**: Đăng nhập Chuyên viên -> Vào Bàn làm việc -> Cuộn xem mục *Đánh Giá Người Dùng Cần Tư Vấn Tâm Lý* -> Thử các tab lọc `Khẩn cấp (🔴)`, `Khuyến nghị (🟡)`.
4. **Kiểm tra DASS-21 chuẩn Lovibond**: Đăng nhập Sinh viên -> Vào `/student/test` -> Trả lời 21 câu hỏi -> Xem kết quả thang điểm $0-42$ và banner cảnh báo cần tư vấn.
5. **Kiểm tra Đăng ảnh & Xóa bài**: Vào `/student/community` -> Đăng bài chọn ảnh mẫu -> Xem bài viết có ảnh -> Bấm nút đỏ *Xóa bài* để xác nhận bài biến mất.
6. **Kiểm tra Duyệt ảnh**: Đăng bài có ảnh từ Sinh viên -> Chuyển sang tài khoản Chuyên viên hoặc Admin vào mục Kiểm duyệt -> Bấm tab *Có hình ảnh* -> Thử bấm *Duyệt ảnh*, *Gắn cờ nhạy cảm*, *Từ chối ảnh*.
7. **Kiểm tra Danh mục Góc chia sẻ ẩn danh (Chuẩn hóa chung chung, tích cực)**:
   - Vào `/student/community`, quan sát thanh lọc danh mục: Các chủ đề đã được viết lại gần gũi, đời thường:
     + `Áp lực học tập` $\rightarrow$ `Góc học tập`
     + `Mối quan hệ & Gia đình` $\rightarrow$ `Gia đình & Bạn bè`
     + `Chia sẻ tích cực` $\rightarrow$ `Chuyện thường ngày`
     + `Cô đơn & Lạc lõng` $\rightarrow$ `Góc tâm sự`
     + `Việc làm & Tài chính` $\rightarrow$ `Định hướng & Tương lai`
   - Bấm vào bất kỳ danh mục nào: Hệ thống lọc chính xác cả các bài viết mới và bài viết cũ (hỗ trợ alias ngược phía Backend).
   - Mở cửa sổ đăng bài viết mới: Dropdown chủ đề và bản Live Preview thời gian thực đều hiển thị nhãn mới chuẩn hóa.

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
