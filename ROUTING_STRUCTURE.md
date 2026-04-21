# 🗺️ Routing Structure - Complete Guide

## 📊 Route Hierarchy

```
/ (root)
├── /landing          → Landing page (public)
├── /login            → Login page (public)
├── /register         → Register page (public)
├── /auth-error       → Auth error page (public)
│
└── Protected Routes (require authentication):
    ├── /dashboard    → Main dashboard (was "/" before)
    ├── /Analist      → Analytics page
    ├── /persimpangan → Intersections list
    │   └── /persimpangan/[id] → Intersection detail
    ├── /pengguna     → User management
    ├── /profile      → User profile
    │   ├── ?tab=overview
    │   ├── ?tab=settings
    │   └── ?tab=help
    ├── /tim          → Team page
    ├── /notifikasi   → Notifications
    └── /laporan      → Reports
```

## 🔄 Routing Flow

### 1. Root Route (`/`)
**File:** `app/page.tsx`

**Logic:**
```typescript
if (session exists) {
  redirect("/dashboard")  // Logged in users → Dashboard
} else {
  redirect("/landing")    // Not logged in → Landing page
}
```

**Purpose:** Smart router that directs users based on authentication status

---

### 2. Public Routes (No Authentication Required)

#### `/landing`
- **File:** `app/landing/page.tsx`
- **Purpose:** Marketing/landing page with hero section
- **Features:**
  - Hero section with "Aerial Command" branding
  - CTA buttons: "Masuk ke Dashboard" & "Daftar Sekarang"
  - 3 feature cards (IoT, AI, Cloud)
  - Auto-redirect to `/` if already logged in

#### `/login`
- **File:** `app/login/page.tsx`
- **Purpose:** User authentication
- **Features:**
  - Email/password login
  - Google OAuth login
  - Link to register page

#### `/register`
- **File:** `app/register/page.tsx`
- **Purpose:** New user registration
- **Features:**
  - Email/password registration
  - Google OAuth registration
  - Link to login page

#### `/auth-error`
- **File:** `app/auth-error/page.tsx`
- **Purpose:** Display authentication errors
- **When shown:** OAuth errors, session errors

---

### 3. Protected Routes (Authentication Required)

All these routes are protected by `middleware.ts`:

#### `/dashboard` ⭐ (Main Dashboard)
- **File:** `app/dashboard/page.tsx`
- **Purpose:** Main dashboard after login
- **Components:**
  - Sidebar navigation
  - Header with search & profile
  - Dashboard stats (4 cards)
  - Traffic trend chart
  - Intersection grid
  - Alerts panel
- **Was:** Previously at `/` (root)
- **Now:** Moved to `/dashboard` for cleaner routing

#### `/Analist`
- **File:** `app/Analist/page.tsx`
- **Purpose:** Analytics and data visualization
- **Features:**
  - Traffic analytics
  - Charts and graphs
  - Data insights

#### `/persimpangan`
- **File:** `app/persimpangan/page.tsx`
- **Purpose:** List of all intersections
- **Features:**
  - Grid of intersection cards
  - Status indicators
  - Quick actions

#### `/persimpangan/[id]`
- **File:** `app/persimpangan/[id]/page.tsx`
- **Purpose:** Detailed view of single intersection
- **Features:**
  - Real-time traffic data
  - Lane-by-lane breakdown
  - Control panel
  - Historical data

#### `/pengguna`
- **File:** `app/pengguna/page.tsx`
- **Purpose:** User management (admin only)
- **Features:**
  - User list
  - Add/edit/delete users
  - Role management

#### `/profile`
- **File:** `app/profile/page.tsx`
- **Purpose:** User profile management
- **Query Params:**
  - `?tab=overview` - Profile overview (default)
  - `?tab=settings` - Settings
  - `?tab=help` - Help & support
- **Features:**
  - View/edit profile
  - Change avatar
  - Update settings

#### `/tim`
- **File:** `app/tim/page.tsx`
- **Purpose:** Team information page
- **Features:**
  - Team member cards
  - Contact information

#### `/notifikasi`
- **File:** `app/notifikasi/page.tsx`
- **Purpose:** Notifications center
- **Features:**
  - List of notifications
  - Mark as read
  - Filter by type

#### `/laporan`
- **File:** `app/laporan/page.tsx`
- **Purpose:** Reports management
- **Features:**
  - Create reports
  - View report history
  - Export reports

---

## 🔒 Middleware Protection

**File:** `middleware.ts`

**Protected Routes:**
```typescript
matcher: [
  "/dashboard/:path*",    // ✅ Dashboard and sub-routes
  "/Analist/:path*",      // ✅ Analytics
  "/persimpangan/:path*", // ✅ Intersections
  "/pengguna/:path*",     // ✅ User management
  "/profile/:path*",      // ✅ Profile
  "/tim/:path*",          // ✅ Team
  "/notifikasi/:path*",   // ✅ Notifications
  "/laporan/:path*",      // ✅ Reports
]
```

**Not Protected:**
- `/` - Handles its own redirect
- `/landing` - Public landing page
- `/login` - Public login page
- `/register` - Public register page
- `/auth-error` - Public error page
- `/api/*` - API routes (handled separately)

**Redirect on Unauthorized:**
```typescript
pages: {
  signIn: "/login",  // Redirect here if not authenticated
}
```

---

## 🧭 Navigation Components

### Sidebar Menu
**File:** `components/Sidebar.tsx`

**Menu Items:**
```typescript
[
  { icon: "dashboard", label: "Dasbor", href: "/dashboard" },      // ✅ Fixed
  { icon: "traffic", label: "Persimpangan", href: "/persimpangan" },
  { icon: "analytics", label: "Analist", href: "/Analist" },
  { icon: "group_work", label: "Tim Kami", href: "/tim" },
  { icon: "group", label: "Manajemen Pengguna", href: "/pengguna" },
]
```

**Bottom Links:**
- "Pengaturan" → `/profile?tab=settings`
- "Bantuan" → `/profile?tab=help`

### Profile Dropdown
**File:** `components/ProfileDropdown.tsx`

**Menu Items:**
- "Profil Saya" → `/profile`
- "Pengaturan" → `/profile?tab=settings`
- "Bantuan" → `/profile?tab=help`
- "Keluar" → Sign out → `/landing`

---

## 🔄 User Journey

### First Time Visitor
```
1. Visit any URL
2. Middleware checks: no session
3. Redirect to /login
4. User sees login page
5. Can click "Daftar Sekarang" → /register
```

### Returning User (Not Logged In)
```
1. Visit / (root)
2. Root page checks: no session
3. Redirect to /landing
4. User sees landing page
5. Click "Masuk ke Dashboard" → /login
6. Login successful
7. Redirect to /dashboard ✅
```

### Logged In User
```
1. Visit / (root)
2. Root page checks: session exists
3. Redirect to /dashboard ✅
4. User sees dashboard
5. Can navigate via sidebar to other pages
```

### Direct Protected Route Access (Not Logged In)
```
1. Visit /dashboard directly
2. Middleware checks: no session
3. Redirect to /login
4. After login: redirect back to /dashboard
```

---

## 📝 Changes Made

### Before:
```
/ (root) → Dashboard page directly
Sidebar: "Dasbor" → "/"
Problem: Middleware conflict, infinite redirect
```

### After:
```
/ (root) → Smart redirect (landing or dashboard)
/dashboard → Dashboard page
Sidebar: "Dasbor" → "/dashboard" ✅
Solution: Clean separation, no conflicts
```

---

## ✅ Verification Checklist

- [x] Root `/` redirects correctly based on auth status
- [x] Landing page `/landing` accessible without login
- [x] Login page `/login` accessible without login
- [x] Dashboard `/dashboard` requires authentication
- [x] Sidebar "Dasbor" links to `/dashboard`
- [x] All protected routes require authentication
- [x] Middleware doesn't protect root `/`
- [x] No infinite redirect loops
- [x] Profile dropdown links work
- [x] Logout redirects to `/landing`

---

## 🧪 Testing Routes

```bash
# Start dev server
npm run dev

# Test each route:
http://localhost:3000/              # → /landing (not logged in)
http://localhost:3000/landing       # ✅ Landing page
http://localhost:3000/login         # ✅ Login page
http://localhost:3000/register      # ✅ Register page
http://localhost:3000/dashboard     # → /login (not logged in)

# After login:
http://localhost:3000/              # → /dashboard ✅
http://localhost:3000/dashboard     # ✅ Dashboard
http://localhost:3000/Analist       # ✅ Analytics
http://localhost:3000/persimpangan  # ✅ Intersections
http://localhost:3000/profile       # ✅ Profile
```

---

## 📦 Package.json Scripts

All scripts are properly configured:
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "db:*": "Database management scripts",
  "test:api": "API testing"
}
```

No routing-related scripts needed - Next.js handles routing automatically based on file structure.

---

**Status:** ✅ All routes properly configured  
**Conflicts:** ✅ None  
**Ready:** ✅ Yes
