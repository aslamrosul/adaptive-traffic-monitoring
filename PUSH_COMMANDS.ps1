# ============================================
# Script untuk Push Bagian Anda ke GitHub
# ============================================

Write-Host "🚀 Starting Git Push Process..." -ForegroundColor Green
Write-Host ""

# 1. Init Git (jika belum)
Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
git init

# 2. Add file yang Anda kerjakan
Write-Host "📝 Adding your files..." -ForegroundColor Yellow

# Base Template
git add app/layout.tsx
git add app/globals.css
git add app/favicon.ico

# Components
git add components/Sidebar.tsx
git add components/Header.tsx
git add components/Toast.tsx

# Your Pages
git add app/peta/page.tsx
git add app/pengguna/page.tsx
git add components/ModalTambahUser.tsx

# State Management
git add lib/store.ts

# Config Files
git add tailwind.config.ts
git add postcss.config.mjs
git add package.json
git add package-lock.json
git add tsconfig.json
git add next.config.ts
git add eslint.config.mjs

# Documentation
git add README.md
git add .gitignore
git add GIT_GUIDE.md
git add CONTRIBUTING.md

# Public assets
git add public/

Write-Host "✅ Files added successfully!" -ForegroundColor Green
Write-Host ""

# 3. Check status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status
Write-Host ""

# 4. Commit
Write-Host "💾 Creating commit..." -ForegroundColor Yellow
git commit -m "feat: implement base template, peta, and manajemen pengguna pages

- Add base template with Sidebar, Header, and Toast components
- Implement interactive map page with 4 markers and tooltips
- Implement user management page with CRUD operations
- Add ModalTambahUser component for adding new users
- Setup Tailwind CSS with Material Design 3 colors
- Configure Zustand for state management
- Add comprehensive documentation"

Write-Host "✅ Commit created successfully!" -ForegroundColor Green
Write-Host ""

# 5. Add remote (ganti dengan URL repo Anda)
Write-Host "🔗 Adding remote repository..." -ForegroundColor Yellow
git remote add origin https://github.com/aslamrosul/adaptive-traffic-monitoring.git

# 6. Rename branch
Write-Host "🌿 Renaming branch to main..." -ForegroundColor Yellow
git branch -M main

# 7. Push
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host ""
Write-Host "✅ Push completed successfully!" -ForegroundColor Green
Write-Host "🎉 Your code is now on GitHub!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Repository: https://github.com/aslamrosul/adaptive-traffic-monitoring" -ForegroundColor Blue
Write-Host ""
