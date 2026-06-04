# Test Events API
# Usage: .\scripts\test-events.ps1

Write-Host "🧪 Testing Events API" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Create event
Write-Host "📝 Test 1: Create Event" -ForegroundColor Yellow
$body = @{
    intersectionId = "int_001"
    type = "alert"
    severity = "warning"
    title = "High Congestion Detected"
    description = "Queue level 2 detected at north lane"
    userId = "user_001"
    userName = "Test Operator"
    metadata = @{
        queueLevel = 2
        direction = "north"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/events" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Event created successfully" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Get all events
Write-Host "📊 Test 2: Get All Events" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/events?limit=10" -Method GET
    Write-Host "✅ Events fetched: $($response.count)" -ForegroundColor Green
    $response.data | Format-Table id, type, severity, title, timestamp -AutoSize
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get events by intersection
Write-Host "🗺️ Test 3: Get Events by Intersection" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/events?intersectionId=int_001" -Method GET
    Write-Host "✅ Events for int_001: $($response.count)" -ForegroundColor Green
    $response.data | Format-Table id, type, severity, title, timestamp -AutoSize
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get events by type
Write-Host "🔍 Test 4: Get Events by Type (alert)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/events?type=alert" -Method GET
    Write-Host "✅ Alert events: $($response.count)" -ForegroundColor Green
    $response.data | Format-Table id, severity, title, timestamp -AutoSize
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Create multiple event types
Write-Host "📝 Test 5: Create Different Event Types" -ForegroundColor Yellow

$eventTypes = @(
    @{
        intersectionId = "int_001"
        type = "manual_override"
        severity = "info"
        title = "Manual Override Activated"
        description = "Operator switched to manual mode"
    },
    @{
        intersectionId = "int_001"
        type = "system"
        severity = "error"
        title = "Device Offline"
        description = "ESP32 device not responding"
    },
    @{
        intersectionId = "int_001"
        type = "maintenance"
        severity = "info"
        title = "Scheduled Maintenance"
        description = "Maintenance scheduled for tomorrow"
    }
)

foreach ($event in $eventTypes) {
    $body = $event | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/events" -Method POST -Body $body -ContentType "application/json"
        Write-Host "✅ Created: $($event.type) - $($event.title)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed: $($event.type)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "🎉 All tests completed!" -ForegroundColor Green
