# Fitur Pencarian Simpangan

## Overview
Fitur pencarian interaktif untuk mencari simpangan lalu lintas dengan dropdown hasil real-time.

## Komponen Baru

### SearchBar.tsx
Komponen pencarian dengan fitur:
- ✅ **Real-time search** - Hasil muncul saat mengetik
- ✅ **Fuzzy matching** - Cari berdasarkan nama atau lokasi
- ✅ **Dropdown interaktif** - Menampilkan hasil dengan animasi
- ✅ **Status badge** - Menampilkan status (PADAT/RAMAI/LANCAR)
- ✅ **Click outside to close** - Dropdown tertutup saat klik di luar
- ✅ **Clear button** - Tombol X untuk menghapus query
- ✅ **Navigation** - Klik hasil untuk ke halaman detail simpangan
- ✅ **Empty state** - Pesan jika tidak ada hasil

## Data Simpangan

Saat ini menggunakan data dummy (8 simpangan):
1. Simpangan Sarinah - Jakarta Pusat (PADAT)
2. Bundaran HI - Jakarta Pusat (LANCAR)
3. Slipi Jaya - Jakarta Barat (RAMAI)
4. Kelapa Gading - Jakarta Utara (LANCAR)
5. Taman Mini - Jakarta Timur (LANCAR)
6. Blok M - Jakarta Selatan (RAMAI)
7. Senayan - Jakarta Pusat (LANCAR)
8. Kuningan - Jakarta Selatan (PADAT)

## Cara Kerja

1. User mengetik di search bar
2. Hasil difilter secara real-time berdasarkan:
   - Nama simpangan
   - Lokasi
3. Dropdown menampilkan hasil dengan:
   - Icon traffic
   - Nama simpangan
   - Lokasi
   - Status badge (warna sesuai kondisi)
4. Klik hasil → Navigate ke `/persimpangan/{id}`
5. Klik "Lihat Semua Simpangan" → Navigate ke `/persimpangan`

## Integrasi dengan API (Future)

Untuk menghubungkan dengan API backend, update file `components/SearchBar.tsx`:

```typescript
// Ganti data dummy dengan API call
const [intersections, setIntersections] = useState([]);

useEffect(() => {
  fetch('/api/intersections')
    .then(res => res.json())
    .then(data => setIntersections(data));
}, []);
```

## Styling

- Menggunakan Framer Motion untuk animasi
- Tailwind CSS untuk styling
- Material Symbols untuk icon
- Responsive (hidden di mobile, tampil di md+)

## Status Colors

- **PADAT**: Red (bg-red-100 text-red-700)
- **RAMAI**: Yellow (bg-yellow-100 text-yellow-700)
- **LANCAR**: Green (bg-green-100 text-green-700)

## Keyboard Support (Future Enhancement)

Bisa ditambahkan:
- Arrow up/down untuk navigasi hasil
- Enter untuk select
- Escape untuk close dropdown
