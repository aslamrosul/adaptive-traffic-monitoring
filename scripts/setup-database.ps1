# PowerShell script untuk setup dan seed database Azure Cosmos DB

Write-Host "🚀 Azure Cosmos DB Setup & Seed Script" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Error: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with your Azure credentials" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found .env.local file`n" -ForegroundColor Green

# Step 1: Setup Collections
Write-Host "Step 1: Creating Cosmos DB collections..." -ForegroundColor Yellow
Write-Host "This will create the database and all required containers`n" -ForegroundColor Gray

try {
    npx tsx scripts/setup-cosmos-db.ts
    if ($LASTEXITCODE -ne 0) {
        throw "Setup failed"
    }
    Write-Host "`n✅ Collections created successfully!`n" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Failed to create collections" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Seed Data
Write-Host "Step 2: Seeding initial data..." -ForegroundColor Yellow
Write-Host "This will add sample users, intersections, reports, and notifications`n" -ForegroundColor Gray

$response = Read-Host "Do you want to seed sample data? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    try {
        npx tsx scripts/seed-data.ts
        if ($LASTEXITCODE -ne 0) {
            throw "Seeding failed"
        }
        Write-Host "`n✅ Data seeded successfully!`n" -ForegroundColor Green
    } catch {
        Write-Host "`n❌ Failed to seed data" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  Skipping data seeding`n" -ForegroundColor Yellow
}

# Step 3: Test API
Write-Host "Step 3: Testing API endpoints..." -ForegroundColor Yellow
Write-Host "Starting development server to test APIs`n" -ForegroundColor Gray

$testResponse = Read-Host "Do you want to test the API endpoints? (y/n)"
if ($testResponse -eq 'y' -or $testResponse -eq 'Y') {
    Write-Host "`nStarting Next.js dev server..." -ForegroundColor Cyan
    Write-Host "Once server is running, open another terminal and run:" -ForegroundColor Yellow
    Write-Host "  .\scripts\test-api.ps1`n" -ForegroundColor Cyan
    
    npm run dev
} else {
    Write-Host "`n✨ Setup completed!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Run 'npm run dev' to start the development server" -ForegroundColor White
    Write-Host "  2. Open http://localhost:3000 in your browser" -ForegroundColor White
    Write-Host "  3. Test the following pages:" -ForegroundColor White
    Write-Host "     - /pengguna (User Management)" -ForegroundColor Gray
    Write-Host "     - /persimpangan (Intersections)" -ForegroundColor Gray
    Write-Host "     - /peta (Map View)" -ForegroundColor Gray
    Write-Host "     - /laporan (Reports)" -ForegroundColor Gray
}
