using UniMind.Application.Common.Interfaces;
using UniMind.Application.Features;
using UniMind.Infrastructure.ExternalServices.AI;
using UniMind.Infrastructure.ExternalServices.Cloudinary;
using UniMind.Infrastructure.ExternalServices.Email;
using UniMind.Infrastructure.ExternalServices.Security;
using UniMind.Infrastructure.Persistence.Context;
using UniMind.WebAPI.Middlewares;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.local.json", optional: true, reloadOnChange: true)
    .AddJsonFile("appsettings.Development.local.json", optional: true, reloadOnChange: true);
builder.WebHost.UseUrls("http://localhost:5080");

// 1. ADD SERVICES
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpClient();

// 2. SWAGGER CONFIGURATION
builder.Services.AddSwaggerGen();

// 3. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 4. DEPENDENCY INJECTION
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddSingleton<IApplicationDbContext>(sp => new ApplicationDbContext(connectionString));
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<IJwtProvider, JwtProvider>();
builder.Services.AddSingleton<ICloudinaryService>(sp =>
    new CloudinaryService(
        builder.Configuration["Cloudinary:CloudName"],
        builder.Configuration["Cloudinary:ApiKey"],
        builder.Configuration["Cloudinary:ApiSecret"]));
builder.Services.AddSingleton<IAISentimentService>(sp => 
    new AISentimentService(builder.Configuration["Gemini:ApiKey"], builder.Configuration["Gemini:Model"]));
builder.Services.AddSingleton<IEmailService>(sp =>
    new EmailService(
        builder.Configuration["Email:SmtpHost"],
        int.TryParse(builder.Configuration["Email:SmtpPort"], out var p) ? p : 587,
        builder.Configuration["Email:SenderEmail"],
        builder.Configuration["Email:SenderName"],
        builder.Configuration["Email:Password"],
        bool.TryParse(builder.Configuration["Email:EnableSsl"], out var ssl) ? ssl : true,
        connectionString));

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IMoodJournalService, MoodJournalService>();
builder.Services.AddScoped<IPsychologicalTestService, PsychologicalTestService>();
builder.Services.AddScoped<ICommunityService, CommunityService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IExpertWorkspaceService, ExpertWorkspaceService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

var app = builder.Build();

// 5. CONFIGURE PIPELINE
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Enable Swagger in all environments for testing
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "UniMind Web API v1.0");
    c.RoutePrefix = "swagger";
    c.DocumentTitle = "UniMind Swagger API Documentation";
});

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Health check endpoint
app.MapGet("/", () => Results.Ok(new
{
    service = "UniMind Psychological Platform API",
    version = "1.0.0",
    status = "Healthy",
    swagger = "/swagger",
    timestamp = DateTime.UtcNow
}));

app.Run();
