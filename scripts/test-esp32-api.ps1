# Test ESP32 API Endpoint
# Simulasi pengiriman data dari ESP32 ke Next.js API

Write-Host "🧪 Testing ESP32 to Azure API Endpoint" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuration
$apiUrl = "http://localhost:3000/api/traffic/realtime"
$deviceId = "lane-north"
$lane = "north"

# Test Data (simulasi dari ESP32)
$testData = @{
    deviceId = $deviceId
    lane = $lane
    vehicleCount = 12
    speed = 25.5
    density = 120
    status = "normal"
    greenDuration = 15
    timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
} | ConvertTo-Json

Write-Host "📤 Sending test data to API..." -ForegroundColor Yellow
Write-Host "URL: $apiUrl" -ForegroundColor Gray
Write-Host "Payload:" -ForegroundColor Gray
Write-Host $testData -ForegroundColor Gray
Write-Host ""

try {
    # Send POST request
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $testData -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Green
    
} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🏁 Test Complete" -ForegroundColor Cyan
