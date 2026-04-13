# 📚 Git Guide - Commit Bagian Anda Saja

## 🎯 File yang Anda Kerjakan

### ✅ Template Dashboard (Base Components)
- `app/layout.tsx` - Root layout
- `app/globals.css` - Global styles
- `components/Sidebar.tsx` - Navigation sidebar
- `components/Header.tsx` - Top header
- `components/Toast.tsx` - Toast provider
- `lib/store.ts` - State management
- `tailwind.config.ts` - Tailwind config
- `postcss.config.mjs` - PostCSS config

### ✅ Halaman Peta
- `app/peta/page.tsx` - Interactive map page

### ✅ Halaman Manajemen Pengguna
- `app/pengguna/page.tsx` - User management page
- `components/ModalTambahUser.tsx` - Add user modal

### ✅ Config & Documentation
- `package.json` - Dependencies
- `package-lock.json` - Lock file
- `tsconfig.json` - TypeScript config
- `next.config.ts` - Next.js config
- `README.md` - Project documentation

---

## 🚀 Cara Push ke GitHub

### Step 1: Init Git Repository

```bash
cd traffic-monitoring
git init
```

### Step 2: Add File yang Anda Kerjakan

```bash
# Base Template
git add app/layout.tsx
git add app/globals.css
git add components/Sidebar.tsx
git add components/Header.tsx
git add components/Toast.tsx
git add lib/store.ts

# Halaman Anda
git add app/peta/page.tsx
git add app/pengguna/page.tsx
git add components/ModalTambahUser.tsx

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

# Public assets (jika ada)
git add public/
```

### Step 3: Commit

```bash
git commit -m "feat: implement base template, peta, and manajemen pengguna pages

- Add base template with Sidebar, Header, and Toast components
- Implement interactive map page with 4 markers and tooltips
- Implement user management page with CRUD operations
- Add ModalTambahUser component for adding new users
- Setup Tailwind CSS with Material Design 3 colors
- Configure Zustand for state management"
```

### Step 4: Create GitHub Repository

1. Buka https://github.com/new
2. Repository name: `adaptive-traffic-monitoring`
3. Description: (copy dari README)
4. Public
5. **JANGAN** centang "Add README" (sudah ada)
6. Click "Create repository"

### Step 5: Push ke GitHub

```bash
# Add remote
git remote add origin https://github.com/aslamrosul/adaptive-traffic-monitoring.git

# Rename branch ke main
git branch -M main

# Push
git push -u origin main
```

---

## 🔄 Jika Teman Mau Push Bagian Mereka

### Teman 1: Dashboard & Persimpangan
```bash
git pull origin main
git add app/page.tsx
git add app/persimpangan/page.tsx
git add components/ModalTambahSimpangan.tsx
git commit -m "feat: implement dashboard and persimpangan pages"
git push origin main
```

### Teman 2: Analitik
```bash
git pull origin main
git add app/analitik/page.tsx
git commit -m "feat: implement analitik page with charts and heatmap"
git push origin main
```

### Teman 3: Pengaturan, Bantuan, Profil
```bash
git pull origin main
git add app/pengaturan/page.tsx
git add app/bantuan/page.tsx
git add app/profil/page.tsx
git add components/ModalLaporan.tsx
git add components/NotificationDropdown.tsx
git add components/ProfileDropdown.tsx
git commit -m "feat: implement pengaturan, bantuan, and profil pages"
git push origin main
```

---

## 📋 Checklist Sebelum Push

- [ ] Sudah test `npm run dev` - app jalan normal
- [ ] Sudah test `npm run build` - no errors
- [ ] Sudah test `npm run lint` - no errors
- [ ] File yang di-add hanya bagian Anda
- [ ] Commit message jelas dan deskriptif
- [ ] README.md sudah diupdate dengan info tim

---

## 🔍 Verify File yang Akan Di-commit

Sebelum commit, cek dulu file apa saja yang akan di-commit:

```bash
git status
```

Output yang benar (hanya file Anda):
```
Changes to be committed:
  new file:   app/layout.tsx
  new file:   app/globals.css
  new file:   components/Sidebar.tsx
  new file:   components/Header.tsx
  new file:   components/Toast.tsx
  new file:   app/peta/page.tsx
  new file:   app/pengguna/page.tsx
  new file:   components/ModalTambahUser.tsx
  new file:   lib/store.ts
  new file:   tailwind.config.ts
  new file:   package.json
  new file:   README.md
  ...
```

Jika ada file yang tidak seharusnya (misal: `app/persimpangan/page.tsx`), remove dengan:
```bash
git reset app/persimpangan/page.tsx
```

---

## 🚨 Troubleshooting

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/aslamrosul/adaptive-traffic-monitoring.git
```

### Error: "failed to push"
```bash
git pull origin main --rebase
git push origin main
```

### Salah commit file yang tidak seharusnya
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Remove file dari staging
git reset app/persimpangan/page.tsx

# Commit lagi
git commit -m "your message"
```

---

## 💡 Tips

1. **Commit Sering**: Commit setiap selesai 1 fitur kecil
2. **Pull Sebelum Push**: Selalu `git pull` sebelum `git push`
3. **Commit Message Jelas**: Gunakan format `feat:`, `fix:`, `docs:`
4. **Test Sebelum Push**: Pastikan `npm run build` sukses

---

## 📝 Commit Message Format

```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting, missing semicolons, etc
refactor: code restructuring
test: add tests
chore: update dependencies
```

Contoh:
```bash
git commit -m "feat: implement interactive map with 4 markers"
git commit -m "fix: resolve user table hover effect"
git commit -m "docs: update README with team information"
```

---

## ✅ Setelah Push

1. Buka https://github.com/aslamrosul/adaptive-traffic-monitoring
2. Verify file yang ter-upload
3. Check README tampil dengan baik
4. Share link ke teman kelompok
5. Teman bisa clone dan lanjutkan bagian mereka

---

**Good luck! 🚀**
