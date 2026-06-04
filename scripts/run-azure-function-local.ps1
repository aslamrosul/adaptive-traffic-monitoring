# Run Azure Function locally for testing

Write-Host "=== Run Azure Function Locally ===" -ForegroundColor Cyan
Write-Host ""

# Navigate to azure-functions folder
$functionPath = Join-Path $PSScriptRoot "..\azure-functions"
if (-not (Test-Path $functionPath)) {
    Write-Host "❌ azure-functions folder not found!" -ForegroundColor Red
    exit 1
}

Set-Location $functionPath
Write-Host "📁 Working directory: $functionPath" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    Write-Host ""
}

# Check if local.settings.json exists
if (-not (Test-Path "local.settings.json")) {
    Write-Host "❌ local.settings.json not found!" -ForegroundColor Red
    Write-Host "Create it with your connection strings" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Configuration found" -ForegroundColor Green
Write-Host ""

# Start function
Write-Host "🚀 Starting Azure Function..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npm start
