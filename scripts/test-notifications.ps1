# Test Notifications API
# Usage: .\scripts\test-notifications.ps1

Write-Host "🧪 Testing Notifications API" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Create notification
Write-Host "📝 Test 1: Create Notification" -ForegroundColor Yellow
$body = @{
    userId = "user_001"
    type = "alert"
    priority = "high"
    title = "High Congestion Alert"
    message = "Simpang Tugu Tani mengalami kemacetan tinggi"
    relatedId = "int_001"
    relatedType = "intersection"
    actionUrl = "/persimpangan/int_001"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Notification created successfully" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Get all notifications for user
Write-Host "📊 Test 2: Get All Notifications" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications?userId=user_001" -Method GET
    Write-Host "✅ Notifications fetched" -ForegroundColor Green
    Write-Host "   Total: $($response.count)" -ForegroundColor Cyan
    Write-Host "   Unread: $($response.unreadCount)" -ForegroundColor Cyan
    $response.data | Format-Table id, type, priority, title, read, createdAt -AutoSize
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get unread notifications only
Write-Host "🔔 Test 3: Get Unread Notifications Only" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications?userId=user_001&unreadOnly=true" -Method GET
    Write-Host "✅ Unread notifications: $($response.count)" -ForegroundColor Green
    $response.data | Format-Table id, type, priority, title, createdAt -AutoSize
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Create multiple notifications with different priorities
Write-Host "📝 Test 4: Create Multiple Notifications" -ForegroundColor Yellow

$notifications = @(
    @{
        userId = "user_001"
        type = "alert"
        priority = "critical"
        title = "Device Offline"
        message = "ESP32 device tidak merespon"
        relatedId = "esp32-001"
        actionUrl = "/devices"
    },
    @{
        userId = "user_001"
        type = "report"
        priority = "medium"
        title = "Report Updated"
        message = "Laporan kemacetan telah diupdate"
        relatedId = "rpt_001"
        actionUrl = "/laporan/rpt_001"
    },
    @{
        userId = "user_001"
        type = "system"
        priority = "low"
        title = "System Update"
        message = "Sistem akan diupdate malam ini"
        actionUrl = "/settings"
    },
    @{
        userId = "user_001"
        type = "info"
        priority = "low"
        title = "Welcome"
        message = "Selamat datang di Traffic Monitoring System"
        actionUrl = "/dashboard"
    }
)

foreach ($notif in $notifications) {
    $body = $notif | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications" -Method POST -Body $body -ContentType "application/json"
        Write-Host "✅ Created: [$($notif.priority)] $($notif.title)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed: $($notif.title)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Get notifications with limit
Write-Host "📊 Test 5: Get Notifications with Limit (5)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications?userId=user_001&limit=5" -Method GET
    Write-Host "✅ Fetched $($response.count) notifications" -ForegroundColor Green
    $response.data | Format-Table id, priority, title, read -AutoSize
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: Create notifications for multiple users
Write-Host "📝 Test 6: Create Notifications for Multiple Users" -ForegroundColor Yellow

$users = @("user_001", "user_002", "user_003")

foreach ($userId in $users) {
    $body = @{
        userId = $userId
        type = "system"
        priority = "medium"
        title = "System Announcement"
        message = "Maintenance dijadwalkan besok pukul 02:00 WIB"
        actionUrl = "/announcements"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications" -Method POST -Body $body -ContentType "application/json"
        Write-Host "✅ Notification sent to: $userId" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed for: $userId" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "🎉 All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Check Cosmos DB → notifications container" -ForegroundColor Cyan
Write-Host "   2. Verify data in Azure Portal" -ForegroundColor Cyan
Write-Host "   3. Test in frontend dashboard" -ForegroundColor Cyan
