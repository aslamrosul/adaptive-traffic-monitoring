# Test ESP32 API Endpoint - Azure Production
# Test endpoint Azure sebelum upload ke ESP32

Write-Host "[TEST] Testing ESP32 to Azure Production API" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Azure Production URL
$apiUrl = "https://traffic-monitoring-app-hah0g9awf6eecfgf.southeastasia-01.azurewebsites.net/api/traffic/realtime"
$deviceId = "lane-north"
$lane = "north"

Write-Host "[URL] Azure Endpoint: $apiUrl" -ForegroundColor Yellow
Write-Host ""

# Test Data (simulasi dari ESP32)
$testData = @{
    deviceId = $deviceId
    lane = $lane
    intersectionId = "int-001"
    vehicleCount = 12
    speed = 25.5
    density = 120
    status = "normal"
    greenDuration = 15
    timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
} | ConvertTo-Json

Write-Host "[SEND] Sending test data to Azure..." -ForegroundColor Yellow
Write-Host "Device: $deviceId" -ForegroundColor Gray
Write-Host "Lane: $lane" -ForegroundColor Gray
Write-Host "Payload:" -ForegroundColor Gray
Write-Host $testData -ForegroundColor Gray
Write-Host ""

try {
    # Send POST request
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 30
    
    Write-Host "[SUCCESS] Data berhasil dikirim!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Green
    Write-Host ""
    Write-Host "[OK] ESP32 dapat kirim data ke Azure!" -ForegroundColor Green
    
} catch {
    Write-Host "[ERROR] Gagal mengirim data!" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 404) {
            Write-Host "Endpoint tidak ditemukan. Cek URL dan deployment Azure." -ForegroundColor Yellow
        } elseif ($statusCode -eq 500) {
            Write-Host "Server error. Cek Azure App Service logs dan Cosmos DB." -ForegroundColor Yellow
        } elseif ($statusCode -eq 401 -or $statusCode -eq 403) {
            Write-Host "Authentication error. Cek API key jika digunakan." -ForegroundColor Yellow
        }
    }
    
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Cek Azure App Service masih running" -ForegroundColor Gray
    Write-Host "  2. Test health endpoint: /api/health" -ForegroundColor Gray
    Write-Host "  3. Verifikasi Cosmos DB credentials" -ForegroundColor Gray
    Write-Host "  4. Cek Azure App Service logs" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "[DONE] Test Complete" -ForegroundColor Cyan

# Test Health Endpoint
Write-Host "`n[HEALTH] Testing Health Endpoint..." -ForegroundColor Cyan
$healthUrl = "https://traffic-monitoring-app-hah0g9awf6eecfgf.southeastasia-01.azurewebsites.net/api/health"

try {
    $healthResponse = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10
    Write-Host "[OK] Health Check: OK" -ForegroundColor Green
    Write-Host ($healthResponse | ConvertTo-Json -Depth 10) -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Health Check: FAILED" -ForegroundColor Red
    Write-Host "Azure App Service mungkin tidak running atau ada masalah." -ForegroundColor Yellow
}
