# Frontend Dynamic Update - Summary

Dokumentasi perubahan frontend dari static ke dynamic (mengambil data dari backend API).

## ✅ Halaman yang Sudah Diperbaiki

### 1. Manajemen Pengguna (`/pengguna`)

**Sebelum:** Static array `initialUsers`  
**Sesudah:** Fetch dari `/api/users`

**Perubahan:**
- ✅ `useEffect` untuk fetch data saat component mount
- ✅ Loading state dengan spinner
- ✅ Empty state jika tidak ada data
- ✅ Search functionality (filter by name/email)
- ✅ Add user via POST `/api/users`
- ✅ Delete user (local state, bisa ditambahkan DELETE endpoint)
- ✅ Dynamic statistics (total, active, offline)

**API Endpoints:**
```typescript
GET  /api/users           // List all users
POST /api/users           // Add new user
```

**Data Structure:**
```typescript
{
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator";
  status: "active" | "inactive";
  phone: string;
  location: string;
}
```

---

### 2. Peta Simpangan (`/peta`)

**Sebelum:** Static array `markers`  
**Sesudah:** Fetch dari `/api/intersections`

**Perubahan:**
- ✅ `useEffect` untuk fetch data saat component mount
- ✅ Loading state dengan overlay
- ✅ Dynamic marker positioning based on lat/lng
- ✅ Status color mapping (active=green, maintenance=amber, offline=red)
- ✅ Dynamic tooltip dengan data real dari backend
- ✅ Fallback positioning jika tidak ada lat/lng

**API Endpoints:**
```typescript
GET /api/intersections    // List all intersections
```

**Data Structure:**
```typescript
{
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  deviceId: string;
  status: "active" | "maintenance" | "offline";
  lanes: { count: number; directions: string[] };
  config: { mode: string; ... };
}
```

**Helper Functions:**
```typescript
getStatusColor(status)    // Returns color class
getStatusLabel(status)    // Returns Indonesian label
getPosition(index, total) // Fallback positioning
```

---

### 3. Bantuan (HelpContent)

**Sebelum:** Static arrays `faqs` dan `guides`  
**Sesudah:** Fetch dari `/api/help/faqs` dan `/api/help/guides`

**Perubahan:**
- ✅ `useEffect` untuk fetch FAQs dan Guides
- ✅ Separate loading states untuk FAQs dan Guides
- ✅ Dynamic FAQ categories dan questions
- ✅ Dynamic guides dengan icon dan color dari backend
- ✅ Search functionality (bisa ditambahkan filter)

**API Endpoints:**
```typescript
GET /api/help/faqs        // List all FAQs
GET /api/help/guides      // List all guides
```

**Data Structure FAQs:**
```typescript
{
  category: string;
  questions: [
    {
      id: string;
      question: string;
      answer: string;
      tags: string[];
    }
  ];
}
```

**Data Structure Guides:**
```typescript
{
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
}
```

---

## 🎯 Benefits

### Performance
- ✅ Data selalu up-to-date dari database
- ✅ Loading states untuk better UX
- ✅ Error handling dengan toast notifications

### Maintainability
- ✅ Single source of truth (database)
- ✅ Easy to update data via API
- ✅ No need to redeploy for data changes

### Scalability
- ✅ Support untuk pagination (bisa ditambahkan)
- ✅ Support untuk filtering dan search
- ✅ Ready untuk real-time updates (WebSocket)

---

## 🔄 Data Flow

```
Database (Cosmos DB)
    ↓
API Routes (/app/api/*)
    ↓
Frontend (fetch on mount)
    ↓
Display with loading/error states
```

---

## 🧪 Testing

### Test Manajemen Pengguna
```powershell
# 1. Start dev server
npm run dev

# 2. Seed data
npm run db:seed

# 3. Open browser
http://localhost:3000/pengguna

# 4. Check:
# - Loading spinner appears
# - Users list displays
# - Search works
# - Add user works
# - Delete user works
```

### Test Peta
```powershell
# 1. Open browser
http://localhost:3000/peta

# 2. Check:
# - Loading overlay appears
# - Markers display on map
# - Hover shows tooltip
# - Status colors correct
```

### Test Bantuan
```powershell
# 1. Open browser
http://localhost:3000/profile
# (Bantuan is in profile page tabs)

# 2. Check:
# - FAQs load from API
# - Guides load from API
# - Accordion works
# - Search works
```

---

## 📝 Code Changes Summary

### app/pengguna/page.tsx
```typescript
// Added:
- useState for users, loading, searchQuery
- useEffect to fetch users
- fetchUsers() function
- handleAddUser() with API call
- filteredUsers for search
- Loading and empty states in JSX

// Changed:
- Static initialUsers → Dynamic fetch
- Status "Aktif"/"Offline" → "active"/"inactive"
- Role display mapping
```

### app/peta/page.tsx
```typescript
// Added:
- "use client" directive
- useState for intersections, loading
- useEffect to fetch intersections
- fetchIntersections() function
- getStatusColor() helper
- getStatusLabel() helper
- getPosition() helper for fallback
- Loading overlay in JSX

// Changed:
- Static markers → Dynamic intersections
- Fixed positioning based on lat/lng
- Dynamic tooltip content
```

### components/HelpContent.tsx
```typescript
// Added:
- useState for faqs, guides, loading states
- useEffect to fetch both
- fetchFaqs() function
- fetchGuides() function
- Loading states in JSX

// Changed:
- Static faqs → Dynamic fetch
- Static guides → Dynamic fetch
- FAQ structure: q/a → question/answer
```

---

## 🚀 Next Steps

### Enhancements yang Bisa Ditambahkan:

1. **Pagination**
   ```typescript
   const [page, setPage] = useState(1);
   const [limit] = useState(10);
   // Fetch with ?page=1&limit=10
   ```

2. **Real-time Updates**
   ```typescript
   // WebSocket or polling
   useEffect(() => {
     const interval = setInterval(fetchData, 5000);
     return () => clearInterval(interval);
   }, []);
   ```

3. **Advanced Search**
   ```typescript
   // Backend search with query params
   fetch(`/api/users?search=${query}&role=${role}`)
   ```

4. **Caching**
   ```typescript
   // Use SWR or React Query
   import useSWR from 'swr';
   const { data, error } = useSWR('/api/users', fetcher);
   ```

5. **Optimistic Updates**
   ```typescript
   // Update UI immediately, rollback on error
   setUsers([...users, newUser]);
   try {
     await api.post('/users', newUser);
   } catch {
     setUsers(users); // Rollback
   }
   ```

---

## 🐛 Troubleshooting

### Data Tidak Muncul
```powershell
# 1. Check API works
.\scripts\test-api.ps1

# 2. Check browser console for errors
# F12 → Console tab

# 3. Check network tab
# F12 → Network tab → Look for API calls

# 4. Verify data exists in database
npm run db:check
```

### Loading Terus-menerus
```typescript
// Check useEffect dependencies
useEffect(() => {
  fetchData();
}, []); // Empty array = run once on mount
```

### CORS Error
```typescript
// Add to next.config.ts
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
      ],
    },
  ];
}
```

---

## 📚 Related Documentation

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API endpoints reference
- [DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md) - Database setup
- [BACKEND_COMPLETE_SUMMARY.md](./BACKEND_COMPLETE_SUMMARY.md) - Backend summary

---

**Updated:** 2024-01-25  
**Status:** ✅ Complete - All 3 pages now dynamic
