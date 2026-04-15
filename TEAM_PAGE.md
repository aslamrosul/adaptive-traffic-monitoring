# Halaman Tim Kami

## Overview
Halaman "Our Team" yang menampilkan anggota tim Aerial Command dengan desain modern dan interaktif.

## Struktur File

### 1. **app/tim/page.tsx**
Halaman utama yang mengintegrasikan semua komponen tim.

### 2. **components/TeamHero.tsx**
Hero section dengan:
- Badge "The Aerial Command Squad"
- Heading besar "Membangun Masa Depan Mobilitas Cerdas"
- Deskripsi singkat tentang tim
- Animasi fade-in

### 3. **components/TeamGrid.tsx**
Grid anggota tim dengan:
- 4 anggota tim dengan foto, nama, role, dan deskripsi
- Hover effect pada foto (scale up)
- Social icons untuk setiap anggota
- Hiring card yang prominent di bawah
- Animasi staggered untuk setiap card

### 4. **components/TeamFooter.tsx**
Footer section dengan:
- Informasi tentang kolaborasi global
- 2 stat cards (15+ Bahasa, 4 Kantor Cabang)
- Hover effect pada stat cards

## Anggota Tim

1. **Budi Santoso** - Lead Developer
   - Arsitek sistem utama dengan fokus pada integrasi cloud dan real-time processing
   
2. **Siti Aminah** - UI Designer
   - Spesialis dalam visualisasi data kompleks menjadi antarmuka yang intuitif
   
3. **Rian Hidayat** - IoT Specialist
   - Mengelola jaringan sensor pintar dan optimasi transmisi data dari lapangan
   
4. **Maya Putri** - Data Analyst
   - Menerjemahkan jutaan titik data menjadi wawasan lalu lintas yang dapat ditindaklanjuti

## Fitur

### Animasi
- ✅ Fade-in hero section
- ✅ Staggered animation untuk team cards
- ✅ Hover scale effect pada foto
- ✅ Hover scale effect pada hiring card icon
- ✅ Button hover effects

### Interaktivitas
- ✅ Social icons clickable (placeholder links)
- ✅ Hiring button dengan animasi
- ✅ Hover effects pada semua cards
- ✅ Smooth transitions

### Responsive Design
- ✅ Grid 1 kolom di mobile
- ✅ Grid 2 kolom di tablet (md)
- ✅ Grid 3 kolom di desktop (lg)
- ✅ Grid 4 kolom di large desktop (xl)
- ✅ Hiring card full-width di semua breakpoint

## Routing

URL: `/tim`

Sudah terintegrasi di Sidebar dengan icon `group_work`

## Styling

- Material Design 3 color system
- Framer Motion untuk animasi
- Next.js Image optimization
- Tailwind CSS utility classes
- Custom hover states

## Future Enhancements

1. **Dynamic Data**: Fetch team members dari API
2. **Team Member Detail**: Modal atau halaman detail untuk setiap anggota
3. **Social Links**: Integrasi dengan social media real
4. **Careers Page**: Halaman lowongan kerja lengkap
5. **Testimonials**: Tambahkan testimonial dari anggota tim
6. **Team Stats**: Tambahkan statistik tim (projects completed, years experience, dll)
7. **Filter/Search**: Filter anggota berdasarkan role atau department
8. **Dark Mode**: Support untuk dark mode

## Images

Semua gambar menggunakan Google Cloud Storage (lh3.googleusercontent.com) yang sudah dikonfigurasi di `next.config.ts`.

## Accessibility

- Alt text untuk semua gambar
- Semantic HTML structure
- Keyboard navigation support
- ARIA labels (bisa ditambahkan)
