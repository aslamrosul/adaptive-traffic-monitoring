# Script untuk kirim data dummy ke IoT Hub (simulasi ESP32)
# Gunakan ini untuk testing tanpa hardware ESP32

Write-Host "=== Send Dummy IoT Data ===" -ForegroundColor Cyan
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
    Write-Host "✅ Loaded .env.local" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local not found!" -ForegroundColor Red
    exit 1
}

$iotHubName = $env:AZURE_IOT_HUB_NAME
$deviceId = "esp32-traffic-monitor"

if (-not $iotHubName) {
    Write-Host "❌ AZURE_IOT_HUB_NAME not found in .env.local" -ForegroundColor Red
    Write-Host "Add this to .env.local: AZURE_IOT_HUB_NAME=traffic-iot-slam1" -ForegroundColor Yellow
    exit 1
}

Write-Host "IoT Hub: $iotHubName" -ForegroundColor Yellow
Write-Host "Device: $deviceId" -ForegroundColor Yellow
Write-Host ""

# Check Azure CLI login
Write-Host "Checking Azure CLI login..." -ForegroundColor Cyan
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "❌ Not logged in to Azure CLI" -ForegroundColor Red
    Write-Host "Run: az login" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host ""

# Generate dummy data dengan format baru (densityLevel, queueDetected)
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

# Random traffic light states (only 1 green at a time)
$lights = @("green", "red", "red")
$lights = $lights | Get-Random -Count 3

$data = @{
    deviceId = $deviceId
    timestamp = $timestamp.ToString()
    north = @{
        light = $lights[0]
        vehicleCount = Get-Random -Minimum 5 -Maximum 25
        densityLevel = Get-Random -Minimum 0 -Maximum 3
        queueDetected = (Get-Random -Minimum 0 -Maximum 2) -eq 1
        queueLength = @(0, 15, 30, 40) | Get-Random
    }
    south = @{
        light = $lights[1]
        vehicleCount = Get-Random -Minimum 5 -Maximum 25
        densityLevel = Get-Random -Minimum 0 -Maximum 3
        queueDetected = (Get-Random -Minimum 0 -Maximum 2) -eq 1
        queueLength = @(0, 15, 30, 40) | Get-Random
    }
    east = @{
        light = $lights[2]
        vehicleCount = Get-Random -Minimum 5 -Maximum 25
        densityLevel = Get-Random -Minimum 0 -Maximum 3
        queueDetected = (Get-Random -Minimum 0 -Maximum 2) -eq 1
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

Write-Host "📤 Sending data to IoT Hub..." -ForegroundColor Cyan
Write-Host "Data:" -ForegroundColor Gray
Write-Host ($data | ConvertTo-Json -Depth 10) -ForegroundColor DarkGray
Write-Host ""

# Send to IoT Hub using Azure CLI
try {
    $result = az iot device send-d2c-message `
        --hub-name $iotHubName `
        --device-id $deviceId `
        --data $json `
        2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Data sent successfully to IoT Hub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Flow:" -ForegroundColor Yellow
        Write-Host "  IoT Hub → Azure Function → Cosmos DB + Blob Storage" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Check Azure Function logs" -ForegroundColor White
        Write-Host "2. Query Cosmos DB (traffic-data container)" -ForegroundColor White
        Write-Host "3. Check Blob Storage (analytics-data-lake container)" -ForegroundColor White
    } else {
        throw $result
    }
} catch {
    Write-Host "❌ Failed to send data: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check Azure CLI login: az login" -ForegroundColor White
    Write-Host "2. Check IoT Hub name: $iotHubName" -ForegroundColor White
    Write-Host "3. Check device exists:" -ForegroundColor White
    Write-Host "   az iot hub device-identity show --hub-name $iotHubName --device-id $deviceId" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Create device if not exists:" -ForegroundColor Yellow
    Write-Host "   az iot hub device-identity create --hub-name $iotHubName --device-id $deviceId" -ForegroundColor Gray
}
