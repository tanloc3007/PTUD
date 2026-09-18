# Skill: Clean Infrastructure Architecture (.NET 8 & EF Core)

## Mục Đích
Kỹ năng này cung cấp các chỉ dẫn chuyên sâu cho AI Coding Assistant khi xây dựng, mở rộng hoặc tối ưu tầng Hạ tầng (Infrastructure Layer) trong kiến trúc Clean Architecture cho dự án Web API .NET 8.

---

## 1. Nguyên Tắc Thiết Kế Cốt Lõi
1. **Inversion of Control (IoC)**: Tầng Application định nghĩa Interface nghiệp vụ cần thiết (ví dụ: `IApplicationDbContext`, `IAppointmentRepository`, `IAISentimentService`). Tầng Infrastructure chỉ hiện thực (implement).
2. **Không Rò Rỉ ORM (No Leaking EF Core)**: Không để kiểu dữ liệu của EF Core như `DbSet<T>`, `EntityEntry<T>`, hoặc ngoại lệ `SqlException` rò rỉ lên Use Case hoặc Controller.
3. **Fluent Configuration Tách Biệt**: Mỗi Domain Entity bắt buộc phải có một class cấu hình độc lập thực thi `IEntityTypeConfiguration<T>` tại `Infrastructure/Persistence/Configurations/`.
4. **Resilience & Retry**: Mọi external call (gọi AI API, gửi email) phải có retry policy qua Microsoft.Extensions.Http.Resilience hoặc Polly.

---

## 2. Các Thư Mục & Vai Trò Trong Infrastructure

| Thư mục / Thành phần | Chức năng | Quy chuẩn đặt tên |
|---|---|---|
| `Persistence/Context` | Quản lý DbContext kết nối SQL Server | `ApplicationDbContext.cs` |
| `Persistence/Configurations` | Cấu hình schema bảng, khóa, index, quan hệ | `[EntityName]Configuration.cs` |
| `Persistence/Repositories` | Hiện thực repository truy vấn dữ liệu | `[EntityName]Repository.cs` |
| `Persistence/Interceptors` | Can thiệp vòng đời SaveChanges (Audit date/user) | `[Name]Interceptor.cs` |
| `ExternalServices/AI` | Gọi API AI phân tích sắc thái cảm xúc | `[Vendor]SentimentService.cs` |
| `ExternalServices/Security` | Mã hóa mật khẩu, sinh token JWT | `PasswordHasher.cs`, `JwtTokenGenerator.cs` |
| `ExternalServices/Communication` | Gửi thông báo, Email xác nhận lịch hẹn | `EmailService.cs` |
| `DependencyInjection.cs` | Điểm đăng ký tất cả dịch vụ tầng Hạ tầng | `AddInfrastructure(IServiceCollection, IConfiguration)` |

---

## 3. Mẫu Triển Khai Chuẩn

### Mẫu 1: Triển khai IApplicationDbContext
```csharp
public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<MoodJournal> MoodJournals => Set<MoodJournal>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<AnonymousPost> AnonymousPosts => Set<AnonymousPost>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await base.SaveChangesAsync(cancellationToken);
    }
}
```

### Mẫu 2: Fluent Configuration với Index Chống Trùng Lịch
```csharp
public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.ToTable("Appointments");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.AppointmentDate)
            .IsRequired();

        builder.Property(a => a.TimeSlot)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(a => a.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        // Index độc quyền để chống trùng lịch ca khám của cùng một chuyên gia
        builder.HasIndex(a => new { a.ExpertId, a.AppointmentDate, a.TimeSlot })
            .IsUnique()
            .HasFilter("[Status] NOT IN ('Cancelled', 'Rejected')");
    }
}
```

### Mẫu 3: External AI Service với Polly Retry
```csharp
public class GeminiSentimentService : IAISentimentService
{
    private readonly HttpClient _httpClient;
    private readonly AIServiceOptions _options;

    public GeminiSentimentService(HttpClient httpClient, IOptions<AIServiceOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public async Task<SentimentResult> AnalyzeMoodAsync(string text, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra text đầu vào
        if (string.IsNullOrWhiteSpace(text))
            return SentimentResult.Neutral;

        // 2. Gửi request đến AI API
        var requestPayload = new { prompt = text };
        var response = await _httpClient.PostAsJsonAsync(_options.Endpoint, requestPayload, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            // Trả về fallback rule-based hoặc log cảnh báo
            return FallbackKeywordAnalysis(text);
        }

        var result = await response.Content.ReadFromJsonAsync<SentimentResponseDto>(cancellationToken: cancellationToken);
        return new SentimentResult(result.Score, result.Label, result.WarningFlags);
    }

    private SentimentResult FallbackKeywordAnalysis(string text)
    {
        // Phân tích từ điển cục bộ khi API AI gián đoạn
        return new SentimentResult(50, "Moderate", new List<string>());
    }
}
```

---

## 4. Quy Tắc Kiểm Tra Nhanh Khi Viết Code
- ❌ Không được `using Microsoft.EntityFrameworkCore;` trong tầng Domain.
- ❌ Không viết chuỗi kết nối trực tiếp trong code; phải đọc từ `configuration.GetConnectionString("DefaultConnection")`.
- ❌ Không dùng `Thread.Sleep` hoặc gọi đồng bộ `.Result` / `.Wait()`; luôn dùng `await ...Async(...)` và truyền `CancellationToken`.
- ❌ Không bỏ qua việc đặt index cho các trường thường xuyên `Where` hoặc `OrderBy` (UserId, CreatedAt, Status).
- ✅ Đăng ký toàn bộ DI qua phương thức `AddInfrastructure(this IServiceCollection services, IConfiguration configuration)`.
