# PowerShell script untuk commit yang aman (tidak commit file sensitif)

Write-Host "🔒 Safe Commit Script" -ForegroundColor Cyan
Write-Host "=====================`n" -ForegroundColor Cyan

# Check if in git repo
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not a git repository!" -ForegroundColor Red
    exit 1
}

# Check for sensitive files
Write-Host "🔍 Checking for sensitive files...`n" -ForegroundColor Yellow

$sensitiveFiles = @(
    ".env.local",
    ".env",
    "node_modules",
    ".next",
    "database-structure",
    "exports"
)

$foundSensitive = $false

foreach ($file in $sensitiveFiles) {
    if (Test-Path $file) {
        $status = git status --porcelain $file 2>$null
        if ($status) {
            Write-Host "⚠️  WARNING: $file is staged or modified!" -ForegroundColor Red
            $foundSensitive = $true
        }
    }
}

if ($foundSensitive) {
    Write-Host "`n❌ Found sensitive files in staging area!" -ForegroundColor Red
    Write-Host "Please remove them before committing:`n" -ForegroundColor Yellow
    Write-Host "  git reset .env.local" -ForegroundColor Gray
    Write-Host "  git reset node_modules" -ForegroundColor Gray
    Write-Host "  git reset .next" -ForegroundColor Gray
    Write-Host "  git reset database-structure" -ForegroundColor Gray
    Write-Host "  git reset exports`n" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ No sensitive files found`n" -ForegroundColor Green

# Show what will be committed
Write-Host "📋 Files to be committed:" -ForegroundColor Cyan
git status --short

Write-Host "`n" -NoNewline

# Ask for confirmation
$confirm = Read-Host "Do you want to continue? (y/n)"

if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "`n❌ Commit cancelled" -ForegroundColor Yellow
    exit 0
}

# Ask for commit message
Write-Host "`n📝 Enter commit message:" -ForegroundColor Cyan
$message = Read-Host

if ([string]::IsNullOrWhiteSpace($message)) {
    Write-Host "`n❌ Commit message cannot be empty!" -ForegroundColor Red
    exit 1
}

# Commit
Write-Host "`n💾 Committing...`n" -ForegroundColor Yellow

try {
    git commit -m $message
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Commit successful!`n" -ForegroundColor Green
        
        # Ask to push
        $push = Read-Host "Do you want to push to remote? (y/n)"
        
        if ($push -eq 'y' -or $push -eq 'Y') {
            Write-Host "`n🚀 Pushing to remote...`n" -ForegroundColor Yellow
            git push
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n✅ Push successful!`n" -ForegroundColor Green
            } else {
                Write-Host "`n❌ Push failed!" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "`n❌ Commit failed!" -ForegroundColor Red
    }
} catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
    exit 1
}
