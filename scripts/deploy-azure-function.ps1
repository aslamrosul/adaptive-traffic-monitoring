# Deploy Azure Function to Azure

Write-Host "=== Deploy Azure Function ===" -ForegroundColor Cyan
Write-Host ""

# Check if logged in
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "❌ Not logged in to Azure" -ForegroundColor Red
    Write-Host "Run: az login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host ""

# Configuration
$functionAppName = "traffic-api-slam1"
$resourceGroup = "traffic-monitoring-rg"

Write-Host "Function App: $functionAppName" -ForegroundColor Yellow
Write-Host "Resource Group: $resourceGroup" -ForegroundColor Yellow
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

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Build TypeScript
Write-Host "🔨 Building TypeScript..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed" -ForegroundColor Green
Write-Host ""

# Deploy using func CLI
Write-Host "🚀 Deploying to Azure..." -ForegroundColor Cyan
func azure functionapp publish $functionAppName

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Configure app settings (connection strings)" -ForegroundColor White
    Write-Host "2. Test function with dummy data" -ForegroundColor White
    Write-Host "3. Check function logs in Azure Portal" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check if Azure Functions Core Tools installed:" -ForegroundColor White
    Write-Host "   npm install -g azure-functions-core-tools@4" -ForegroundColor Gray
    Write-Host "2. Check function app exists:" -ForegroundColor White
    Write-Host "   az functionapp show --name $functionAppName --resource-group $resourceGroup" -ForegroundColor Gray
}
