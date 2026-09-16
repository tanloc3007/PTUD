using UniMind.Application.Common.Interfaces;
using UniMind.Application.Features;
using UniMind.Infrastructure.ExternalServices.AI;
using UniMind.Infrastructure.ExternalServices.Security;
using UniMind.Infrastructure.Persistence.Context;
using UniMind.WebAPI.Middlewares;

var builder = WebApplication.CreateBuilder(args);

// 1. ADD SERVICES
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

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
builder.Services.AddSingleton<IApplicationDbContext, ApplicationDbContext>();
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<IJwtProvider, JwtProvider>();
builder.Services.AddSingleton<IAISentimentService, AISentimentService>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IMoodJournalService, MoodJournalService>();
builder.Services.AddScoped<IPsychologicalTestService, PsychologicalTestService>();
builder.Services.AddScoped<ICommunityService, CommunityService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IExpertWorkspaceService, ExpertWorkspaceService>();
builder.Services.AddScoped<IAdminService, AdminService>();

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
