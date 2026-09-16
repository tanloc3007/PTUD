# AGENTS.md - HƯỚNG DẪN DÀNH CHO AI CODING ASSISTANT
# Dự án: Xây dựng hệ thống nhật ký cảm xúc & tư vấn tâm lý ẩn danh dành cho sinh viên
# Môn học: Phát triển ứng dụng (PTUD) - GVHD: ThS. Lê Minh Nhật - ĐH Lạc Hồng

## 1. Bối cảnh dự án & Phân công nhóm
Hệ thống là nền tảng web bảo mật và ẩn danh dành cho sinh viên ghi chép nhật ký cảm xúc, thực hiện trắc nghiệm tâm lý, tương tác cộng đồng ẩn danh và đặt lịch hẹn tư vấn với chuyên gia.
- **Thành viên 1**: Ngô Tấn Lộc (MSSV: 120000212) -> Phụ trách: Auth, Nhật ký cảm xúc, AI Sentiment, Quản lý bài test.
- **Thành viên 2**: Lê Minh Luân (MSSV: 120000352) -> Phụ trách: Đặt lịch tư vấn, Chống trùng lịch, Góc chia sẻ ẩn danh, Báo cáo Admin.

---

## 2. Ràng buộc Kiến trúc BẮT BUỘC (Clean Architecture Constraints)
Khi Agent sinh mã hoặc tái cấu trúc (refactor), bắt buộc tuân thủ 100% các nguyên tắc sau:
1. **TUÂN THỦ NGUYÊN TẮC PHỤ THUỘC (Dependency Rule)**:
   - Tầng **Domain** KHÔNG ĐƯỢC PHÉP tham chiếu đến bất kỳ project/thư viện hạ tầng nào (Không EntityFramework, không ASP.NET, không UI).
   - Tầng **Application** chỉ tham chiếu Domain. Mọi giao tiếp với CSDL, AI API, Email đều phải thông qua **INTERFACES** định nghĩa tại `Application/Common/Interfaces/`.
   - Tầng **Infrastructure** chỉ hiện thực (implement) các interface từ Application.
   - Tầng **WebAPI (Presentation)** chỉ tiếp nhận HTTP request và chuyển xuống Use Case (MediatR Handler / Service), TUYỆT ĐỐI không viết logic tính toán hay truy vấn CSDL ở Controller.
2. **KHÔNG ĐƯỢC RÒ RỈ THỰC THỂ (No Entity Leaking)**:
   - Tuyệt đối không trả Domain Entity trực tiếp về Client. Mọi kết quả trả về API bắt buộc phải map qua DTO (Data Transfer Object).
3. **ĐẢM BẢO TÍNH BẢO MẬT & ẨN DANH**:
   - Dữ liệu nhật ký và bài viết cộng đồng phải che giấu danh tính sinh viên. Không lưu hoặc trả về MSSV / Tên thật của sinh viên trong module cộng đồng.
4. **XỬ LÝ CHỐNG TRÙNG LỊCH HẸN (Double Booking)**:
   - Logic kiểm tra trùng ca tư vấn phải được xử lý chặt chẽ ở tầng Application/Domain trước khi lưu vào SQL Server.

---

## 3. Quy trình khi Agent tạo Tính năng mới (Feature Creation Protocol)
Khi được yêu cầu tạo một chức năng mới, Agent phải thực hiện tuần tự:
1. **Bước 1**: Khai báo Entity / Enums tại `backend/src/Core/Domain/Entities/` (nếu có dữ liệu mới).
2. **Bước 2**: Khai báo Interface Repository hoặc External Service tại `backend/src/Core/Application/Common/Interfaces/`.
3. **Bước 3**: Tạo thư mục tính năng tại `backend/src/Core/Application/Features/[FeatureName]/` gồm:
   - `[Action]Command.cs` hoặc `[Action]Query.cs`
   - `[Action]CommandHandler.cs` hoặc `[Action]QueryHandler.cs`
   - `[Action]Validator.cs` (dùng FluentValidation)
   - `[Action]Dto.cs`
4. **Bước 4**: Khai báo DbContext mapping / Service implementation tại `backend/src/Infrastructure/`.
5. **Bước 5**: Tạo Endpoint tại Controller tương ứng trong `backend/src/Presentation/WebAPI/Controllers/`.
6. **Bước 6**: Khai báo API Service, Hook và UI Component tương ứng tại `frontend/src/features/[feature-name]/`.

---

## 4. Công nghệ chuẩn
- **Backend**: C# .NET 8 Web API (hoặc Node.js / NestJS)
- **Database / ORM**: SQL Server, Entity Framework Core / Dapper
- **Frontend**: React, TypeScript, Vite, TailwindCSS (hoặc Vanilla CSS)
- **Design Pattern**: Clean Architecture, CQRS (MediatR), Result Pattern, Specification Pattern
