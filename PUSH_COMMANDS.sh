#!/bin/bash

# ============================================
# Script untuk Push Bagian Anda ke GitHub
# ============================================

echo "🚀 Starting Git Push Process..."
echo ""

# 1. Init Git (jika belum)
echo "📦 Initializing Git repository..."
git init

# 2. Add file yang Anda kerjakan
echo "📝 Adding your files..."

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

echo "✅ Files added successfully!"
echo ""

# 3. Check status
echo "📋 Checking git status..."
git status
echo ""

# 4. Commit
echo "💾 Creating commit..."
git commit -m "feat: implement base template, peta, and manajemen pengguna pages

- Add base template with Sidebar, Header, and Toast components
- Implement interactive map page with 4 markers and tooltips
- Implement user management page with CRUD operations
- Add ModalTambahUser component for adding new users
- Setup Tailwind CSS with Material Design 3 colors
- Configure Zustand for state management
- Add comprehensive documentation"

echo "✅ Commit created successfully!"
echo ""

# 5. Add remote (ganti dengan URL repo Anda)
echo "🔗 Adding remote repository..."
git remote add origin https://github.com/aslamrosul/adaptive-traffic-monitoring.git

# 6. Rename branch
echo "🌿 Renaming branch to main..."
git branch -M main

# 7. Push
echo "🚀 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Push completed successfully!"
echo "🎉 Your code is now on GitHub!"
echo ""
echo "📍 Repository: https://github.com/aslamrosul/adaptive-traffic-monitoring"
echo ""
