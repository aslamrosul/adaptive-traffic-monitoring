# Panduan Commit - Apa yang Perlu di-Commit

## ❌ JANGAN Commit File Ini:

### 1. Environment & Secrets
```
.env.local              # Berisi credentials Azure (BAHAYA!)
.env
```

### 2. Build & Dependencies
```
node_modules/           # Sudah di .gitignore
.next/                  # Build output
dist/
build/
```

### 3. Auto-generated Reports
```
database-structure/     # Auto-generated dari npm run db:check
exports/                # Backup data dari npm run db:export
```

### 4. IDE & OS Files
```
.DS_Store              # Mac
Thumbs.db              # Windows
.vscode/               # VS Code settings (optional)
```

### 5. Lock Files (Optional)
```
package-lock.json      # Besar, bisa di-commit atau tidak
```

## ✅ HARUS Commit File Ini:

### 1. Source Code
```
app/**/*.tsx           # Frontend pages
app/**/*.ts            # API routes
components/**/*.tsx    # React components
lib/**/*.ts            # Utilities
```

### 2. Configuration
```
package.json           # Dependencies list
tsconfig.json          # TypeScript config
next.config.ts         # Next.js config
tailwind.config.ts     # Tailwind config
postcss.config.mjs     # PostCSS config
eslint.config.mjs      # ESLint config
```

### 3. Scripts
```
scripts/**/*.ts        # Database scripts
scripts/**/*.ps1       # PowerShell scripts
```

### 4. Documentation
```
*.md                   # Semua markdown files
DATABASE_*.md
DEPLOY_*.md
README.md
```

### 5. Docker & CI/CD
```
Dockerfile
.dockerignore
.github/workflows/*.yml
```

### 6. Git Configuration
```
.gitignore
```

## 📝 Cara Commit yang Benar:

### Step 1: Check Status
```powershell
git status
```

### Step 2: Add Files yang Perlu
```powershell
# Add source code
git add app/
git add components/
git add lib/

# Add scripts
git add scripts/

# Add config
git add package.json
git add tsconfig.json
git add next.config.ts
git add tailwind.config.ts

# Add documentation
git add *.md

# Add Docker & CI/CD
git add Dockerfile
git add .dockerignore
git add .github/

# Add gitignore
git add .gitignore
```

### Step 3: Verify (PENTING!)
```powershell
# Pastikan .env.local TIDAK ada di list
git status

# Jika ada .env.local, JANGAN commit!
# Remove dengan:
git reset .env.local
```

### Step 4: Commit
```powershell
git commit -m "feat: Add dynamic backend integration for users, map, and help pages"
```

### Step 5: Push
```powershell
git push origin main
```

## 🎯 Quick Commit (Recommended):

```powershell
# Add semua kecuali yang di .gitignore
git add .

# Check apa yang akan di-commit
git status

# PASTIKAN tidak ada:
# - .env.local
# - node_modules/
# - .next/
# - database-structure/
# - exports/

# Jika aman, commit
git commit -m "feat: Add backend APIs and dynamic frontend integration

- Add backend APIs for users, intersections, reports, notifications
- Add settings and help APIs
- Update frontend to fetch from APIs (users, map, help)
- Add database setup and seed scripts
- Add documentation for database and deployment"

# Push
git push origin main
```

## 🔍 Verify Before Push:

```powershell
# Lihat files yang akan di-commit
git diff --cached --name-only

# Pastikan TIDAK ada:
# .env.local
# .env
# node_modules/
# .next/
```

## 🚨 Jika Sudah Terlanjur Commit .env.local:

```powershell
# JANGAN PUSH!

# Remove dari staging
git reset HEAD .env.local

# Atau jika sudah commit, undo commit
git reset --soft HEAD~1

# Lalu commit ulang tanpa .env.local
```

## 📋 Checklist Sebelum Commit:

- [ ] ✅ Source code (app/, components/, lib/)
- [ ] ✅ Scripts (scripts/)
- [ ] ✅ Config files (package.json, tsconfig.json, dll)
- [ ] ✅ Documentation (*.md)
- [ ] ✅ Docker & CI/CD files
- [ ] ✅ .gitignore
- [ ] ❌ .env.local (JANGAN!)
- [ ] ❌ node_modules/ (JANGAN!)
- [ ] ❌ .next/ (JANGAN!)
- [ ] ❌ database-structure/ (JANGAN!)
- [ ] ❌ exports/ (JANGAN!)

## 💡 Tips:

1. **Selalu check `git status` sebelum commit**
2. **Jangan commit credentials** (.env.local)
3. **Jangan commit build output** (.next/, node_modules/)
4. **Jangan commit auto-generated files** (database-structure/, exports/)
5. **Commit message yang jelas** (feat:, fix:, docs:, dll)

## 🎓 Commit Message Convention:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

## 📚 Example Commits:

```powershell
# Good commits:
git commit -m "feat: Add user management API"
git commit -m "fix: Fix intersection map positioning"
git commit -m "docs: Add database setup guide"
git commit -m "chore: Update dependencies"

# Bad commits:
git commit -m "update"
git commit -m "fix"
git commit -m "changes"
```

---

**IMPORTANT:** 
- ❌ JANGAN commit `.env.local` (berisi credentials!)
- ❌ JANGAN commit `node_modules/` (terlalu besar!)
- ❌ JANGAN commit `.next/` (build output!)
- ✅ SELALU check `git status` sebelum commit!
