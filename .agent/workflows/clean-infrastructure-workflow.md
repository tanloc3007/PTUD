# Workflow: Triển Khai Tính Năng Tầng Clean Infrastructure

Quy trình chuẩn từng bước khi một developer hoặc AI assistant tạo mới hoặc chỉnh sửa thành phần thuộc tầng Infrastructure.

---

## Quy Trình 5 Bước Chuẩn

### Bước 1: Khảo Sát Interface Từ Tầng Application
- Kiểm tra interface cần hiện thực tại `Core/Application/Common/Interfaces/`.
- Nếu chưa có, tạo interface trước tại Application, đảm bảo chỉ dùng các kiểu dữ liệu C# cơ bản hoặc Domain Entities / Value Objects (không mang theo kiểu dữ liệu của EF Core hay thư viện ngoài).

### Bước 2: Tạo Hoặc Cập Nhật Entity Configuration
- Mở `Infrastructure/Persistence/Configurations/`.
- Tạo class `[EntityName]Configuration.cs` kế thừa `IEntityTypeConfiguration<T>`.
- Khai báo:
  - Tên bảng: `builder.ToTable("TableName");`
  - Khóa chính: `builder.HasKey(x => x.Id);`
  - Ràng buộc độ dài, nullable: `builder.Property(x => x.Field).HasMaxLength(...).IsRequired();`
  - Chỉ mục (Indexes): `builder.HasIndex(...);`
  - Các quan hệ `HasOne / WithMany` kèm chiến lược xóa `OnDelete(...)`.

### Bước 3: Đăng Ký DbSet Trong ApplicationDbContext
- Mở `Infrastructure/Persistence/Context/ApplicationDbContext.cs`.
- Thêm thuộc tính `public DbSet<[Entity]> [Entities] => Set<[Entity]>();`.

### Bước 4: Tạo Và Áp Dụng Migration
Mở terminal tại thư mục backend và chạy lệnh:
```powershell
# Tạo migration mới
dotnet ef migrations add Add[FeatureName]Table --project src/Infrastructure --startup-project src/Presentation/WebAPI

# Cập nhật CSDL cục bộ
dotnet ef database update --project src/Infrastructure --startup-project src/Presentation/WebAPI
```

### Bước 5: Đăng Ký Dependency Injection
- Mở `Infrastructure/DependencyInjection.cs`.
- Đăng ký Service hoặc Repository mới vào `IServiceCollection`:
  ```csharp
  services.AddScoped<I[Service]Interface, [Service]Implementation>();
  ```
- Kiểm tra tính tương thích và kiểm thử vòng đời DI (`Scoped`, `Singleton`, `Transient`).
