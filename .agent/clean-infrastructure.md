# Clean Infrastructure Skill - Hướng Dẫn Thiết Kế & Lập Trình Tầng Hạ Tầng

Tài liệu này định nghĩa chuẩn mực kỹ thuật và các quy tắc bắt buộc khi hiện thực tầng **Infrastructure** trong hệ thống Clean Architecture (.NET 8 & SQL Server / External APIs) cho dự án *Nhật ký cảm xúc & Tư vấn tâm lý ẩn danh sinh viên*.

---

## 1. Bản Chất & Vai Trò của Tầng Infrastructure

Tầng **Infrastructure** là nơi chứa toàn bộ các chi tiết kỹ thuật (technical details), giao tiếp ngoại vi và công nghệ cụ thể mà hệ thống cần để hoạt động:
- **Cơ sở dữ liệu (Persistence)**: Entity Framework Core, Dapper, Migration, DbContext, Fluent API.
- **External Services**: Gọi AI API (Gemini / Sentiment Analysis), dịch vụ gửi Email (SMTP/SendGrid), SMS, Cloud Storage.
- **Security / Identity**: Băm mật khẩu (BCrypt), phát hành và xác thực JWT token.
- **System Clock / Caching**: Triển khai `IDateTimeProvider`, MemoryCache, Redis.

### 📌 Nguyên Tắc Vàng (Dependency Inversion Principle - DIP)
> **"Tầng Application sở hữu giao diện (Interfaces). Tầng Infrastructure chỉ đóng vai trò hiện thực hóa (Implements) các giao diện đó."**

```
+-------------------------------------------------------------+
|                     Domain Layer                            |
|  (Entities, Enums, Value Objects, Domain Events)             |
+-------------------------------------------------------------+
                              ▲
                              │ depends on
+-------------------------------------------------------------+
|                   Application Layer                         |
|  (Use Cases, CQRS MediatR, Interfaces: IAppDbContext, ...)  |
+-------------------------------------------------------------+
                              ▲
                              │ implements interfaces
+-------------------------------------------------------------+
|                  Infrastructure Layer                       |
|  (EF Core DbContext, Configurations, Repositories, AI API)   |
+-------------------------------------------------------------+
```

- **Domain** không tham chiếu bất kỳ thư viện nào bên ngoài.
- **Application** KHÔNG ĐƯỢC tham chiếu trực tiếp tới `Microsoft.EntityFrameworkCore`, thư viện AI SDK, hoặc SQL Client. Mọi thứ phải thông qua Interface trong `Core/Application/Common/Interfaces/`.
- **Infrastructure** tham chiếu `Application` và `Domain`, thực thi các Interface và không để rò rỉ các kiểu dữ liệu của ORM ra ngoài.

---

## 2. Cấu Trúc Thư Mục Chuẩn Tầng Infrastructure

```
backend/src/Infrastructure/
│
├── Persistence/                               # Lưu trữ dữ liệu
│   ├── Context/
│   │   └── ApplicationDbContext.cs            # Thực thi IApplicationDbContext
│   ├── Configurations/                        # Fluent API mapping cho từng Entity
│   │   ├── UserConfiguration.cs
│   │   ├── MoodJournalConfiguration.cs
│   │   ├── AppointmentConfiguration.cs
│   │   └── AnonymousPostConfiguration.cs
│   ├── Repositories/                          # Các repository chuyên biệt (nếu có)
│   │   ├── AppointmentRepository.cs
│   │   └── MoodJournalRepository.cs
│   ├── Interceptors/                          # EF Core Interceptors (Audit, Soft Delete)
│   │   └── AuditableEntitySaveChangesInterceptor.cs
│   └── Migrations/                            # Các file EF Core migration tự sinh
│
├── ExternalServices/                          # Tích hợp dịch vụ bên thứ ba
│   ├── AI/
│   │   ├── GeminiSentimentService.cs          # Gọi AI phân tích cảm xúc
│   │   └── AIServiceOptions.cs                # Options pattern cho API keys
│   ├── Security/
│   │   ├── JwtTokenGenerator.cs               # Triển khai IJwtTokenGenerator
│   │   └── PasswordHasher.cs                  # Triển khai IPasswordHasher
│   └── Communication/
│       └── EmailService.cs                    # Triển khai IEmailService
│
└── DependencyInjection.cs                     # Service Registration Extension Method
```

---

## 3. Quy Chuẩn Persistence & Entity Framework Core

### 3.1. Phân Tách Configuration (Không dùng Data Annotations bẩn Entity)
Không gắn thuộc tính `[Required]`, `[MaxLength]`, `[Table]` vào Entity ở Domain. Toàn bộ mapping đặt ở `Infrastructure/Persistence/Configurations/` thông qua `IEntityTypeConfiguration<T>`:

```csharp
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class MoodJournalConfiguration : IEntityTypeConfiguration<MoodJournal>
{
    public void Configure(EntityTypeBuilder<MoodJournal> builder)
    {
        builder.ToTable("MoodJournals");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Note)
            .HasMaxLength(2000)
            .IsRequired(false);

        builder.Property(x => x.MoodScore)
            .IsRequired();

        // Index tăng tốc truy vấn theo UserId và Ngày tạo
        builder.HasIndex(x => new { x.UserId, x.CreatedAt });

        // Quan hệ với User
        builder.HasOne(x => x.User)
            .WithMany(u => u.MoodJournals)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

### 3.2. Đăng Ký DbContext & Tự Động Quét Configurations
Trong `ApplicationDbContext.cs`:

```csharp
public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<MoodJournal> MoodJournals => Set<MoodJournal>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<AnonymousPost> AnonymousPosts => Set<AnonymousPost>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Tự động load tất cả IEntityTypeConfiguration trong assembly Infrastructure
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
```

### 3.3. Auditing Tự Động (Interceptors)
Tự động cập nhật `CreatedAt`, `LastModifiedAt` mà không cần code tay ở từng Use Case:

```csharp
public class AuditableEntitySaveChangesInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData, 
        InterceptionResult<int> result)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, 
        InterceptionResult<int> result, 
        CancellationToken cancellationToken = default)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void UpdateEntities(DbContext? context)
    {
        if (context == null) return;

        foreach (var entry in context.ChangeTracker.Entries<BaseAuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
            {
                entry.Entity.LastModifiedAt = DateTime.UtcNow;
            }
        }
    }
}
```

---

## 4. Xử Lý Chống Trùng Lịch & Concurrency (Anti-Double Booking)

Để bảo vệ lịch hẹn chuyên viên không bị đăng ký trùng chéo (hai sinh viên cùng book 1 slot):

1. **Khóa Độc Quyền hoặc Transaction ở Infrastructure**:
   - Sử dụng Unique Index trên Database:
     ```csharp
     builder.HasIndex(x => new { x.ExpertId, x.AppointmentDate, x.TimeSlot })
            .IsUnique()
            .HasFilter("[Status] <> 'Cancelled'");
     ```
2. **Bắt DbUpdateException**:
   - Khi có xung đột trùng lịch, Infrastructure bắt `DbUpdateException` và dịch thành Domain Exception (`DoubleBookingConflictException`) để tầng Application/Presentation phản hồi mã lỗi chuẩn HTTP 409 Conflict.

---

## 5. Tích Hợp External Services (AI, Email, Security)

### 5.1. AI Sentiment Analysis (Gemini / NLP API)
- Sử dụng `HttpClientFactory` kèm cơ chế Resilience (Retry 3 lần với Exponential Backoff qua Polly).
- Không bao giờ hard-code API Key trong code; dùng `IOptions<AIServiceOptions>` ánh xạ từ `appsettings.json` hoặc Environment Variable.
- Thiết kế Fallback an toàn: Nếu AI API lỗi mạng, hệ thống chuyển sang rule-based sentiment (từ điển từ khóa) thay vì làm sập ứng dụng.

### 5.2. Bảo Mật Mật Khẩu (Security)
- Dùng `BCrypt.Net-Next` hoặc `Argon2id`.
- Triển khai interface `IPasswordHasher`:
  ```csharp
  public class PasswordHasher : IPasswordHasher
  {
      public string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password);
      public bool VerifyPassword(string password, string hashedPassword) => BCrypt.Net.BCrypt.Verify(password, hashedPassword);
  }
  ```

---

## 6. Đăng Ký Dịch Vụ Sạch Sẽ (Dependency Injection Pattern)

Tầng Infrastructure gom toàn bộ đăng ký dịch vụ vào một phương thức mở rộng duy nhất `AddInfrastructure`:

```csharp
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        // 1. Database Connection
        services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));
        });

        services.AddScoped<IApplicationDbContext>(provider => 
            provider.GetRequiredService<ApplicationDbContext>());

        // 2. Security Services
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        // 3. External Services
        services.Configure<AIServiceOptions>(configuration.GetSection("AIService"));
        services.AddHttpClient<IAISentimentService, GeminiSentimentService>();

        return services;
    }
}
```

Ở file `Program.cs` của WebAPI chỉ cần gọi 1 dòng:
```csharp
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
```

---

## 7. Checklist Kiểm Duyệt Code Tầng Infrastructure
- [ ] Không có class nào trong Application hoặc Domain tham chiếu tới `Infrastructure`.
- [ ] Không rò rỉ `Microsoft.EntityFrameworkCore` lên tầng Domain.
- [ ] Mọi Entity đều có file cấu hình `IEntityTypeConfiguration<T>` riêng biệt, không cấu hình lộn xộn trong DbContext.
- [ ] Các kết nối bên ngoài (AI, Email, Database) đều có CancellationToken và timeout hợp lý.
- [ ] Mọi bí mật (Secret keys, Connection strings) đều lấy qua `IConfiguration` hoặc Secret Manager, không commit plain text lên Git.
