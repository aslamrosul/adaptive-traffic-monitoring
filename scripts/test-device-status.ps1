# Test Device Status API
# Usage: .\scripts\test-device-status.ps1

Write-Host "🧪 Testing Device Status API" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Create device status manually
Write-Host "📝 Test 1: Create device status (Manual)" -ForegroundColor Yellow
$body = @{
    deviceId = "esp32-traffic-monitor"
    intersectionId = "intersection-1"
    status = "online"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/api/devices/status" -Method POST -Body $body -ContentType "application/json"
Write-Host "✅ Response:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 5
Write-Host ""

# Test 2: Get all device status
Write-Host "📊 Test 2: Get all device status" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/api/devices/status" -Method GET
Write-Host "✅ Response:" -ForegroundColor Green
Write-Host "Total devices: $($response.stats.total)"
Write-Host "Online: $($response.stats.online)"
Write-Host "Offline: $($response.stats.offline)"
Write-Host ""
$response.devices | Format-Table deviceId, status, lastHeartbeat
Write-Host ""

# Test 3: Get specific device
Write-Host "🔍 Test 3: Get specific device" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/api/devices/status?deviceId=esp32-traffic-monitor" -Method GET
Write-Host "✅ Response:" -ForegroundColor Green
$response.devices | ConvertTo-Json -Depth 5
Write-Host ""

# Test 4: Get devices by intersection
Write-Host "🗺️ Test 4: Get devices by intersection" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/api/devices/status?intersectionId=intersection-1" -Method GET
Write-Host "✅ Response:" -ForegroundColor Green
Write-Host "Devices in intersection-1: $($response.stats.total)"
$response.devices | Format-Table deviceId, status, lastHeartbeat
Write-Host ""

Write-Host "🎉 All tests completed!" -ForegroundColor Green
