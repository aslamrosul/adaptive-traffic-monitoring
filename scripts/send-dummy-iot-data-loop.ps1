# Script untuk kirim data dummy ke IoT Hub secara berkala
# Simulasi ESP32 yang kirim data setiap 15 detik

param(
    [int]$Count = 10,           # Jumlah messages
    [int]$IntervalSeconds = 15  # Interval antar message
)

Write-Host "=== Send Dummy IoT Data (Loop) ===" -ForegroundColor Cyan
Write-Host "Count: $Count messages" -ForegroundColor Yellow
Write-Host "Interval: $IntervalSeconds seconds" -ForegroundColor Yellow
Write-Host ""

# Load environment variables
$envFile = ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "❌ .env.local not found!" -ForegroundColor Red
    exit 1
}

$iotHubName = $env:AZURE_IOT_HUB_NAME
$deviceId = "esp32-traffic-monitor"

if (-not $iotHubName) {
    Write-Host "❌ AZURE_IOT_HUB_NAME not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "IoT Hub: $iotHubName" -ForegroundColor Cyan
Write-Host "Device: $deviceId" -ForegroundColor Cyan
Write-Host ""

# Check Azure CLI
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "❌ Not logged in. Run: az login" -ForegroundColor Red
    exit 1
}

# Traffic light cycle state
$currentGreen = "east"  # Start with east green
$cycleTime = 0

for ($i = 1; $i -le $Count; $i++) {
    Write-Host "[$i/$Count] Sending message..." -ForegroundColor Cyan
    
    # Cycle traffic lights every 30 seconds (2 messages)
    if ($cycleTime % 2 -eq 0) {
        $currentGreen = switch ($currentGreen) {
            "north" { "south" }
            "south" { "east" }
            "east" { "north" }
        }
    }
    $cycleTime++
    
    # Set lights (only 1 green)
    $northLight = if ($currentGreen -eq "north") { "green" } else { "red" }
    $southLight = if ($currentGreen -eq "south") { "green" } else { "red" }
    $eastLight = if ($currentGreen -eq "east") { "green" } else { "red" }
    
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    
    # Generate realistic traffic data
    $data = @{
        deviceId = $deviceId
        timestamp = $timestamp  # Use current timestamp (milliseconds)
        north = @{
            light = $northLight
            vehicleCount = Get-Random -Minimum 5 -Maximum 30
            densityLevel = Get-Random -Minimum 0 -Maximum 3
            queueDetected = (Get-Random -Minimum 0 -Maximum 3) -eq 1
            queueLength = @(0, 15, 30, 40) | Get-Random
        }
        south = @{
            light = $southLight
            vehicleCount = Get-Random -Minimum 5 -Maximum 30
            densityLevel = Get-Random -Minimum 0 -Maximum 3
            queueDetected = (Get-Random -Minimum 0 -Maximum 3) -eq 1
            queueLength = @(0, 15, 30, 40) | Get-Random
        }
        east = @{
            light = $eastLight
            vehicleCount = Get-Random -Minimum 5 -Maximum 30
            densityLevel = Get-Random -Minimum 0 -Maximum 3
            queueDetected = (Get-Random -Minimum 0 -Maximum 3) -eq 1
            queueLength = @(0, 15, 30, 40) | Get-Random
        }
        west = @{
            light = "red"
            vehicleCount = Get-Random -Minimum 0 -Maximum 10
            densityLevel = 0
            queueDetected = $false
            queueLength = 0
        }
    }
    
    $json = $data | ConvertTo-Json -Depth 10 -Compress
    
    try {
        az iot device send-d2c-message `
            --hub-name $iotHubName `
            --device-id $deviceId `
            --data $json `
            --silent
        
        Write-Host "  ✅ Sent (Green: $currentGreen)" -ForegroundColor Green
        Write-Host "     North: $($data.north.vehicleCount) vehicles, Level $($data.north.densityLevel)" -ForegroundColor Gray
        Write-Host "     South: $($data.south.vehicleCount) vehicles, Level $($data.south.densityLevel)" -ForegroundColor Gray
        Write-Host "     East: $($data.east.vehicleCount) vehicles, Level $($data.east.densityLevel)" -ForegroundColor Gray
    } catch {
        Write-Host "  ❌ Failed: $_" -ForegroundColor Red
    }
    
    if ($i -lt $Count) {
        Write-Host "  ⏳ Waiting $IntervalSeconds seconds..." -ForegroundColor DarkGray
        Start-Sleep -Seconds $IntervalSeconds
    }
    
    Write-Host ""
}

Write-Host "✅ Completed! Sent $Count messages" -ForegroundColor Green
Write-Host ""
Write-Host "Check results:" -ForegroundColor Cyan
Write-Host "1. Azure Function logs" -ForegroundColor White
Write-Host "2. Cosmos DB: traffic-data container" -ForegroundColor White
Write-Host "3. Blob Storage: analytics-data-lake container" -ForegroundColor White
