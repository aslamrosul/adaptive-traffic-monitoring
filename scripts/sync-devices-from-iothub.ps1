# Sync Devices from IoT Hub to Cosmos DB
# Usage: .\scripts\sync-devices-from-iothub.ps1

Write-Host "🔄 Syncing Devices from IoT Hub to Cosmos DB" -ForegroundColor Cyan
Write-Host ""

$iotHubName = "traffic-iot-slam1"
$apiUrl = "http://localhost:3000/api/devices/status"

# Get all devices from IoT Hub
Write-Host "📡 Fetching devices from IoT Hub..." -ForegroundColor Yellow
try {
    $devices = az iot hub device-identity list --hub-name $iotHubName | ConvertFrom-Json
    Write-Host "✅ Found $($devices.Count) devices in IoT Hub" -ForegroundColor Green
} catch {
    Write-Host "❌ Error fetching devices from IoT Hub: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Sync each device to Cosmos DB
Write-Host "💾 Syncing to Cosmos DB..." -ForegroundColor Yellow
$successCount = 0
$failCount = 0

foreach ($device in $devices) {
    $deviceId = $device.deviceId
    $connectionState = $device.connectionState
    
    # Map deviceId to intersectionId (customize based on your naming convention)
    # Example: esp32-traffic-monitor → intersection-1
    $intersectionId = $deviceId -replace "esp32-", "intersection-"
    
    # Determine status based on connection state
    $status = if ($connectionState -eq "Connected") { "online" } else { "offline" }
    
    $body = @{
        deviceId = $deviceId
        intersectionId = $intersectionId
        status = $status
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Body $body -ContentType "application/json"
        Write-Host "✅ Synced: $deviceId ($status)" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "❌ Failed: $deviceId - $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "🎉 Sync completed!" -ForegroundColor Green
Write-Host "   Success: $successCount" -ForegroundColor Cyan
Write-Host "   Failed: $failCount" -ForegroundColor Cyan
Write-Host ""

# Verify in Cosmos DB
Write-Host "🔍 Verifying in Cosmos DB..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method GET
    Write-Host "✅ Total devices in Cosmos DB: $($response.stats.total)" -ForegroundColor Green
    Write-Host "   Online: $($response.stats.online)" -ForegroundColor Cyan
    Write-Host "   Offline: $($response.stats.offline)" -ForegroundColor Cyan
    Write-Host ""
    $response.devices | Format-Table deviceId, status, lastHeartbeat -AutoSize
} catch {
    Write-Host "❌ Error verifying: $_" -ForegroundColor Red
}
