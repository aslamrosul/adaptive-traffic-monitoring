# Script untuk kirim data dummy LANGSUNG ke API
# Bypass IoT Hub, langsung masuk ke database
# Cocok untuk testing cepat tanpa setup IoT Hub

Write-Host "=== Send Dummy Data Direct to API ===" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://localhost:3000/api/events"

# Generate dummy data dengan format baru
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

$data = @{
    deviceId = "esp32-traffic-monitor"
    timestamp = $timestamp.ToString()
    north = @{
        light = "green"
        vehicleCount = Get-Random -Minimum 5 -Maximum 20
        densityLevel = Get-Random -Minimum 0 -Maximum 3
        queueDetected = $false
        queueLength = 15
    }
    south = @{
        light = "red"
        vehicleCount = Get-Random -Minimum 10 -Maximum 25
        densityLevel = 2
        queueDetected = $true
        queueLength = 40
    }
    east = @{
        light = "yellow"
        vehicleCount = Get-Random -Minimum 3 -Maximum 15
        densityLevel = 1
        queueDetected = $false
        queueLength = 15
    }
    west = @{
        light = "red"
        vehicleCount = Get-Random -Minimum 0 -Maximum 10
        densityLevel = 0
        queueDetected = $false
        queueLength = 0
    }
}

$json = $data | ConvertTo-Json -Depth 10

Write-Host "📤 Sending to: $apiUrl" -ForegroundColor Yellow
Write-Host $json -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Body $json -ContentType "application/json"
    
    Write-Host "✅ Data sent successfully!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to send data: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pastikan:" -ForegroundColor Yellow
    Write-Host "1. Next.js dev server running (npm run dev)" -ForegroundColor Yellow
    Write-Host "2. API endpoint /api/events tersedia" -ForegroundColor Yellow
    Write-Host "3. Cosmos DB connection configured" -ForegroundColor Yellow
}
