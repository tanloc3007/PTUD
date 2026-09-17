# ============================================================================
# UNIMIND SYSTEM STARTUP SCRIPT
# Tự động kiểm tra Database, khởi chạy Backend Web API và mở Frontend
# ============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    KHỞI ĐỘNG HỆ THỐNG UNIMIND (PTUD - ĐH LẠC HỒNG)      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Kiểm tra SQL Server
Write-Host "[1/3] Kiểm tra dịch vụ SQL Server (SQLEXPRESS)..." -ForegroundColor Yellow
$sqlService = Get-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction SilentlyContinue
if ($sqlService) {
    if ($sqlService.Status -ne "Running") {
        Write-Host "      Đang bật dịch vụ SQL Server..." -ForegroundColor Yellow
        Start-Service -Name "MSSQL`$SQLEXPRESS"
    }
    Write-Host "      -> SQL Server đã sẵn sàng." -ForegroundColor Green
} else {
    Write-Host "      -> Dịch vụ SQL Server cục bộ đã sẵn sàng." -ForegroundColor Green
}

# 2. Khởi chạy Backend Web API
Write-Host "[2/3] Khởi chạy Backend Web API trên cổng http://localhost:5080..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "dotnet" -ArgumentList "run --project backend/src/Presentation/WebAPI/WebAPI.csproj" -PassThru -NoNewWindow

Start-Sleep -Seconds 4

# 3. Mở Frontend
Write-Host "[3/3] Khởi chạy Giao diện Frontend..." -ForegroundColor Yellow
$frontendPath = Resolve-Path "frontend/index.html"
Start-Process $frontendPath

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " -> Backend API:  http://localhost:5080" -ForegroundColor Green
Write-Host " -> Swagger Docs: http://localhost:5080/swagger" -ForegroundColor Green
Write-Host " -> Frontend:     $frontendPath" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Nhấn Enter để dừng hệ thống khi hoàn tất thử nghiệm..." -ForegroundColor Gray
Read-Host
Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
