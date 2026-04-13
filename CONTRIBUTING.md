# 🤝 Contributing Guide - Kelompok 4

## 👥 Pembagian Tugas

### Anggota 1: [Nama] - Template & Peta & Manajemen Pengguna ✅
**Status**: Selesai & Sudah di-push

**File yang dikerjakan:**
- ✅ `app/layout.tsx` - Root layout
- ✅ `app/globals.css` - Global styles
- ✅ `components/Sidebar.tsx` - Navigation
- ✅ `components/Header.tsx` - Top header
- ✅ `components/Toast.tsx` - Toast provider
- ✅ `app/peta/page.tsx` - Interactive map
- ✅ `app/pengguna/page.tsx` - User management
- ✅ `components/ModalTambahUser.tsx` - Add user modal
- ✅ `lib/store.ts` - State management
- ✅ `tailwind.config.ts` - Tailwind config

---

### Anggota 2: [Nama] - Dashboard & Persimpangan
**Status**: Belum di-push

**File yang perlu dikerjakan:**
- [ ] `app/page.tsx` - Dashboard utama
- [ ] `app/persimpangan/page.tsx` - Kontrol persimpangan
- [ ] `components/ModalTambahSimpangan.tsx` - Add intersection modal

**Fitur yang harus ada:**
- Dashboard dengan 4 stat cards
- Bar chart dengan filter periode
- Daftar simpangan dengan map images
- Filter status simpangan
- Persimpangan dengan 4 jalur control
- Traffic light visualization
- Manual override button
- Tabel kejadian

**Cara push:**
```bash
git clone https://github.com/aslamrosul/adaptive-traffic-monitoring.git
cd adaptive-traffic-monitoring/traffic-monitoring
npm install

# Kerjakan file Anda
# ...

# Push
git add app/page.tsx
git add app/persimpangan/page.tsx
git add components/ModalTambahSimpangan.tsx
git commit -m "feat: implement dashboard and persimpangan pages"
git push origin main
```

---

### Anggota 3: [Nama] - Analitik
**Status**: Belum di-push

**File yang perlu dikerjakan:**
- [ ] `app/analitik/page.tsx` - Analytics page

**Fitur yang harus ada:**
- Chart volume mingguan
- Heatmap intensitas per jam
- Efisiensi sistem (AI vs Manual)
- Indeks kemacetan
- Export data button

**Cara push:**
```bash
git clone https://github.com/aslamrosul/adaptive-traffic-monitoring.git
cd adaptive-traffic-monitoring/traffic-monitoring
npm install

# Kerjakan file Anda
# ...

# Push
git add app/analitik/page.tsx
git commit -m "feat: implement analitik page with charts and heatmap"
git push origin main
```

---

### Anggota 4: [Nama] - Pengaturan, Bantuan, Profil
**Status**: Belum di-push

**File yang perlu dikerjakan:**
- [ ] `app/pengaturan/page.tsx` - Settings page
- [ ] `app/bantuan/page.tsx` - Help center
- [ ] `app/profil/page.tsx` - User profile
- [ ] `components/ModalLaporan.tsx` - Report modal
- [ ] `components/NotificationDropdown.tsx` - Notifications
- [ ] `components/ProfileDropdown.tsx` - Profile menu

**Fitur yang harus ada:**
- Pengaturan: Toggle switches, IoT config
- Bantuan: FAQ accordion, contact cards
- Profil: Edit mode, activity stats
- Modal Laporan: Form dengan validation
- Notification Dropdown: Badge count, list
- Profile Dropdown: Menu items

**Cara push:**
```bash
git clone https://github.com/aslamrosul/adaptive-traffic-monitoring.git
cd adaptive-traffic-monitoring/traffic-monitoring
npm install

# Kerjakan file Anda
# ...

# Push
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

## 🚀 Workflow untuk Semua Anggota

### 1. Clone Repository (Pertama Kali)
```bash
git clone https://github.com/aslamrosul/adaptive-traffic-monitoring.git
cd adaptive-traffic-monitoring/traffic-monitoring
npm install
```

### 2. Sebelum Mulai Coding
```bash
# Pull perubahan terbaru
git pull origin main

# Buat branch baru (optional tapi recommended)
git checkout -b feature/nama-fitur-anda
```

### 3. Saat Coding
```bash
# Test app jalan
npm run dev

# Buka http://localhost:3000
# Test fitur Anda
```

### 4. Setelah Selesai
```bash
# Check file yang berubah
git status

# Add hanya file Anda
git add app/your-page/page.tsx
git add components/YourComponent.tsx

# Commit dengan message jelas
git commit -m "feat: implement your feature"

# Pull dulu (untuk avoid conflict)
git pull origin main

# Push
git push origin main
```

---

## 📋 Checklist Sebelum Push

- [ ] `npm run dev` - App jalan normal
- [ ] `npm run build` - No errors
- [ ] `npm run lint` - No errors
- [ ] Test semua fitur yang Anda buat
- [ ] Hanya add file yang Anda kerjakan
- [ ] Commit message jelas
- [ ] Pull sebelum push

---

## 🎨 Design Guidelines

### Colors (Material Design 3)
```css
Primary:   #0040a1  /* Blue - Main buttons */
Secondary: #525f73  /* Slate - Secondary elements */
Tertiary:  #93000d  /* Red - Alerts */
Surface:   #f7f9fc  /* Light gray - Backgrounds */
```

### Typography
- Headlines: `font-headline` (Manrope)
- Body: `font-body` (Inter)
- Labels: `font-label` (Inter)

### Spacing
- Use Tailwind spacing: `p-4`, `m-6`, `gap-3`, etc.
- Consistent padding: `p-6` untuk cards, `p-8` untuk pages

### Components
- Semua button harus ada hover effect
- Semua card harus ada shadow
- Semua modal harus ada backdrop blur
- Semua form harus ada validation

---

## 🔄 Handling Conflicts

Jika ada conflict saat push:

```bash
# Pull dengan rebase
git pull origin main --rebase

# Resolve conflicts di editor
# Cari marker: <<<<<<< HEAD

# Setelah resolve
git add .
git rebase --continue

# Push
git push origin main
```

---

## 💡 Tips

1. **Komunikasi**: Koordinasi di grup sebelum push
2. **Commit Sering**: Jangan tunggu semua selesai
3. **Test Dulu**: Pastikan no errors sebelum push
4. **Pull Sering**: Pull setiap mau mulai coding
5. **Backup**: Copy file Anda sebelum pull/merge

---

## 🐛 Troubleshooting

### "npm run dev" error
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### "Module not found"
```bash
npm install
```

### "Port 3000 already in use"
```bash
npm run dev -- -p 3001
```

### Git conflict
```bash
# Lihat file yang conflict
git status

# Edit file, hapus marker conflict
# Lalu:
git add .
git commit -m "resolve conflict"
git push origin main
```

---

## 📞 Kontak

Jika ada masalah, hubungi:
- **Koordinator**: [Nama Anggota 1]
- **WhatsApp Group**: [Link Group]
- **GitHub Issues**: [Link Issues]

---

## ✅ Progress Tracking

| Anggota | Bagian | Status | Last Update |
|---------|--------|--------|-------------|
| Anggota 1 | Template, Peta, Pengguna | ✅ Done | [Date] |
| Anggota 2 | Dashboard, Persimpangan | 🔄 In Progress | - |
| Anggota 3 | Analitik | 📋 Todo | - |
| Anggota 4 | Pengaturan, Bantuan, Profil | 📋 Todo | - |

---

**Happy Coding! 🚀**
