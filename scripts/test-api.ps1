# PowerShell script untuk test API endpoints

Write-Host "🧪 Testing API Endpoints" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

# Test Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
    Write-Host "   ✅ Health: $($response.status)" -ForegroundColor Green
    Write-Host "   Database: $($response.database)`n" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Health check failed: $_`n" -ForegroundColor Red
}

# Test Users API
Write-Host "2. Testing Users API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method Get
    Write-Host "   ✅ Users found: $($response.count)" -ForegroundColor Green
    if ($response.count -gt 0) {
        Write-Host "   Sample user: $($response.data[0].name) ($($response.data[0].role))`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Users API failed: $_`n" -ForegroundColor Red
}

# Test Intersections API
Write-Host "3. Testing Intersections API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/intersections" -Method Get
    Write-Host "   ✅ Intersections found: $($response.count)" -ForegroundColor Green
    if ($response.count -gt 0) {
        Write-Host "   Sample: $($response.data[0].name) - $($response.data[0].status)`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Intersections API failed: $_`n" -ForegroundColor Red
}

# Test Reports API
Write-Host "4. Testing Reports API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/reports" -Method Get
    Write-Host "   ✅ Reports found: $($response.count)" -ForegroundColor Green
    if ($response.count -gt 0) {
        Write-Host "   Sample: $($response.data[0].title) - $($response.data[0].status)`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Reports API failed: $_`n" -ForegroundColor Red
}

# Test Notifications API
Write-Host "5. Testing Notifications API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/notifications" -Method Get
    Write-Host "   ✅ Notifications found: $($response.count)" -ForegroundColor Green
    if ($response.count -gt 0) {
        Write-Host "   Sample: $($response.data[0].title)`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Notifications API failed: $_`n" -ForegroundColor Red
}

Write-Host "`n✨ API Testing Complete!" -ForegroundColor Green
Write-Host "`nYou can now access the application at:" -ForegroundColor Cyan
Write-Host "  - Dashboard: $baseUrl" -ForegroundColor White
Write-Host "  - Users: $baseUrl/pengguna" -ForegroundColor White
Write-Host "  - Intersections: $baseUrl/persimpangan" -ForegroundColor White
Write-Host "  - Map: $baseUrl/peta" -ForegroundColor White
Write-Host "  - Reports: $baseUrl/laporan`n" -ForegroundColor White
