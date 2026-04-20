# Landing Page Update - Tentang Kami & Tim Kami

## 📝 Perubahan

Section "Cara Kerja" dan "Kontak" telah diganti dengan "Tentang Kami" dan "Tim Kami" sesuai dengan desain baru.

## 🔄 Section yang Diubah

### 1. Tentang Kami Section (#tentang-kami)

**Menggantikan**: How It Works Section (#cara-kerja)

**Konten**:

- **Layout**: Grid 2 kolom (text + icon)
- **Heading**: "Tentang Kami" (blue-600, uppercase)
- **Title**: "Misi Kami Merevolusi Mobilitas Perkotaan"
- **Deskripsi**: 2 paragraf tentang Aerial Command
  - Paragraf 1: Penjelasan sistem dan filosofi
  - Paragraf 2: Tujuan platform untuk pemerintah kota
- **Visual**: Icon "hub" besar (120px) di background slate-100 rounded-3xl
- **Animasi**: Slide dari kiri (text) dan kanan (icon)

**Fitur**:

- Responsive: Stack pada mobile, side-by-side pada desktop
- Order swap: Icon di atas pada mobile, di kanan pada desktop
- Hover effects: Smooth transitions
- Material Symbols icon: hub (filled)

### 2. Tim Kami Section (#tim-kami)

**Menggantikan**: CTA Section (#kontak)

**Konten**:

- **Layout**: Grid 4 kolom (responsive: 1 → 2 → 4)
- **Heading**: "Tim Kami" (blue-600, uppercase)
- **Title**: "Para Inovator di Balik Aerial Command"
- **Subtitle**: "Dedikasi kami untuk menciptakan solusi teknologi..."

**4 Anggota Tim**:

1. **Aditya Pratama**
   - Role: Lead Developer
   - NIM: 2101234567
   - Avatar: Gradient blue (AP initials)
   - Badge: Verified icon

2. **Siti Nurhaliza**
   - Role: AI Specialist
   - NIM: 2101234568
   - Avatar: Gradient purple (SN initials)

3. **Budi Santoso**
   - Role: UI/UX Designer
   - NIM: 2101234569
   - Avatar: Gradient green (BS initials)

4. **Dewi Anggraini**
   - Role: System Analyst
   - NIM: 2101234570
   - Avatar: Gradient pink (DA initials)

**Fitur Avatar**:

- Size: 192px × 192px (w-48 h-48)
- Background: Blue-100 circle dengan hover scale
- Avatar: Gradient circle dengan initials (text-4xl)
- Badge: Verified icon (hanya member 1)
- Animasi: Stagger fade-in saat scroll

## 🎨 Design Details

### Tentang Kami

```tsx
- Background: White
- Padding: py-24
- Grid: lg:grid-cols-2 gap-16
- Text color: slate-600 (body), slate-900 (heading)
- Icon size: 120px
- Icon background: slate-100 rounded-3xl
```

### Tim Kami

```tsx
- Background: slate-50
- Padding: py-24
- Grid: sm:grid-cols-2 lg:grid-cols-4 gap-8
- Avatar: w-48 h-48 rounded-full
- Gradient colors: blue, purple, green, pink
- Hover: scale-105 transition
```

## 🔗 Navigation Updates

### Desktop Menu

```
Beranda → Fitur → Tentang Kami → Tim Kami
```

### Mobile Menu

```
Beranda
Fitur
Tentang Kami
Tim Kami
Masuk Dashboard (button)
```

### Hero CTA Buttons

- **Primary**: "Pelajari Lebih Lanjut" → #tentang-kami
- **Secondary**: "Lihat Tim Kami" → #tim-kami

## 📱 Responsive Behavior

### Tentang Kami

- **Mobile**: Stack vertical (icon → text)
- **Desktop**: Side by side (text → icon)

### Tim Kami

- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 4 columns

## 🎭 Animations

### Tentang Kami

```tsx
Text: initial={{ opacity: 0, x: -20 }}
Icon: initial={{ opacity: 0, x: 20 }}
Trigger: whileInView (once)
Duration: 0.6s
```

### Tim Kami

```tsx
Each member: initial={{ opacity: 0, y: 20 }}
Stagger delay: 0.1s, 0.2s, 0.3s, 0.4s
Trigger: whileInView (once)
Duration: 0.6s
Avatar hover: scale-105 (300ms)
```

## 🎨 Color Palette

### Avatar Gradients

- **Member 1**: from-blue-400 to-blue-600
- **Member 2**: from-purple-400 to-purple-600
- **Member 3**: from-green-400 to-green-600
- **Member 4**: from-pink-400 to-pink-600

### Text Colors

- **Heading**: text-slate-900
- **Subheading**: text-blue-600
- **Body**: text-slate-600
- **Role**: text-blue-600
- **NIM**: text-slate-500

## 📦 Files Modified

1. **`app/landing/page.tsx`**
   - Replaced "How It Works" section with "Tentang Kami"
   - Replaced "CTA" section with "Tim Kami"
   - Updated hero CTA button links

2. **`components/LandingNav.tsx`**
   - Updated desktop menu items
   - Updated mobile menu items

## ✅ Checklist

- [x] Section "Tentang Kami" dibuat
- [x] Section "Tim Kami" dibuat dengan 4 anggota
- [x] Avatar dengan gradient dan initials
- [x] Verified badge untuk member 1
- [x] Navbar desktop diupdate
- [x] Navbar mobile diupdate
- [x] Hero CTA buttons diupdate
- [x] Animasi Framer Motion
- [x] Responsive design
- [x] Hover effects
- [x] No diagnostic errors

## 🚀 Testing

### Manual Testing

1. Buka http://localhost:3000/landing
2. Klik menu "Tentang Kami" → scroll smooth ke section
3. Klik menu "Tim Kami" → scroll smooth ke section
4. Test responsive: resize browser
5. Test hover: hover pada avatar tim
6. Test animasi: scroll ke section untuk trigger

### Expected Behavior

- ✅ Smooth scroll ke sections
- ✅ Animasi fade-in saat scroll
- ✅ Avatar scale saat hover
- ✅ Responsive layout
- ✅ Mobile menu berfungsi

## 📝 Notes

- Avatar menggunakan initials karena tidak ada URL gambar yang valid
- Gradient colors dipilih untuk variasi visual
- Verified badge hanya pada Lead Developer
- Section background: White (Tentang Kami), Slate-50 (Tim Kami)
- Semua animasi menggunakan `viewport={{ once: true }}` untuk performa

## 🎯 Future Enhancements

1. Tambahkan foto real untuk avatar tim
2. Tambahkan social media links (LinkedIn, GitHub)
3. Tambahkan hover tooltip dengan bio singkat
4. Tambahkan email contact per member
5. Tambahkan skill tags untuk setiap member
6. Animasi parallax untuk icon "hub"
