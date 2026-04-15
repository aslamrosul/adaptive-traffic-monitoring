# Test Azure API Connection

Write-Host "Testing Azure Cosmos DB Connection..." -ForegroundColor Cyan

# Test 1: Insert data
Write-Host "`n1. Inserting test data..." -ForegroundColor Yellow
$body = @{
    deviceId = "lane-north"
    lane = "north"
    vehicleCount = 25
    speed = 45.5
    density = 0.7
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/traffic/realtime" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    Write-Host "✅ Data inserted successfully!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error inserting data: $_" -ForegroundColor Red
}

# Test 2: Get data
Write-Host "`n2. Fetching data from Cosmos DB..." -ForegroundColor Yellow
try {
    $data = Invoke-RestMethod -Uri "http://localhost:3000/api/traffic/realtime" -Method GET
    Write-Host "✅ Data fetched successfully!" -ForegroundColor Green
    Write-Host "Total records: $($data.count)" -ForegroundColor Gray
    Write-Host "Data: $($data.data | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error fetching data: $_" -ForegroundColor Red
}

# Test 3: Insert more data
Write-Host "`n3. Inserting more test data..." -ForegroundColor Yellow
$devices = @("lane-south", "lane-east", "lane-west")
foreach ($device in $devices) {
    $body = @{
        deviceId = $device
        lane = $device.Replace("lane-", "")
        vehicleCount = Get-Random -Minimum 10 -Maximum 50
        speed = Get-Random -Minimum 30 -Maximum 60
        density = [math]::Round((Get-Random -Minimum 40 -Maximum 90) / 100, 2)
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/traffic/realtime" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
        Write-Host "✅ Data inserted for $device" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error inserting data for $device" -ForegroundColor Red
    }
}

# Test 4: Get all data again
Write-Host "`n4. Fetching all data..." -ForegroundColor Yellow
try {
    $data = Invoke-RestMethod -Uri "http://localhost:3000/api/traffic/realtime" -Method GET
    Write-Host "✅ Total records now: $($data.count)" -ForegroundColor Green
    
    if ($data.count -gt 0) {
        Write-Host "`nLatest data:" -ForegroundColor Cyan
        $data.data | Select-Object -First 5 | Format-Table deviceId, lane, vehicleCount, speed, density -AutoSize
    }
} catch {
    Write-Host "❌ Error fetching data: $_" -ForegroundColor Red
}

Write-Host "`n✅ Test complete!" -ForegroundColor Green
Write-Host "Check Azure Portal > Cosmos DB > Data Explorer to see the data!" -ForegroundColor Cyan