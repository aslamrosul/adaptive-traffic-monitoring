# 🔐 NextAuth.js Authentication Setup

## ✅ Setup Lengkap

Authentication system sudah terintegrasi dengan Azure Cosmos DB menggunakan NextAuth.js dengan support:
- ✅ Email/Password (Credentials)
- ✅ Google OAuth

## 📁 File Structure

```
app/
├── api/
│   └── auth/
│       ├── [...nextauth]/
│       │   └── route.ts          # NextAuth configuration
│       └── register/
│           └── route.ts          # Registration API
├── login/
│   └── page.tsx                  # Login page
├── register/
│   └── page.tsx                  # Registration page
└── auth-error/
    └── page.tsx                  # Error page

components/
└── SessionProvider.tsx           # Session wrapper

lib/
└── azure-cosmos.ts              # Cosmos DB connection

scripts/
└── seed-admin-user.ts           # Seed admin user script
```

## 🔑 Environment Variables

Tambahkan di `.env.local`:

```env
# NextAuth

# Google OAuth


# Azure Cosmos DB (sudah ada)
AZURE_COSMOS_ENDPOINT=https://traffic-cosmos-slam.documents.azure.com:443/
AZURE_COSMOS_KEY=your-key-here
AZURE_COSMOS_DATABASE=TrafficDB
```

## 🔐 Google OAuth Setup

### Authorized JavaScript origins:
```
http://localhost:3000
https://your-app.azurewebsites.net
```

### Authorized redirect URIs:
```
http://localhost:3000/api/auth/callback/google
https://your-app.azurewebsites.net/api/auth/callback/google
```

## 👤 Demo Credentials

```
Email: admin@traffic.com
Password: admin123
```

## 🚀 Cara Menggunakan

### 1. Login dengan Email/Password

```
Email: admin@traffic.com
Password: admin123
```

### 2. Login dengan Google

1. Klik tombol "Masuk dengan Google"
2. Pilih akun Google
3. Otomatis create user baru jika belum ada
4. Redirect ke dashboard

### 3. Register User Baru

1. Buka: `http://localhost:3000/register`
2. Isi form registrasi
3. Setelah berhasil, redirect ke login

## 📝 API Endpoints

### Login (NextAuth)
```
POST /api/auth/signin
Body: { email, password }
```

### Register
```
POST /api/auth/register
Body: { name, email, password }
```

### Get Session
```
GET /api/auth/session
```

### Logout
```
POST /api/auth/signout
```

## 🔒 Password Hashing

- Menggunakan `bcryptjs` dengan salt rounds 10
- Password di-hash sebelum disimpan ke database
- Verifikasi menggunakan `bcrypt.compare()`

## 💾 Database Schema (users collection)

```typescript
{
  id: string;              // user-{timestamp}-{random}
  name: string;            // Full name
  email: string;           // Email (unique)
  password: string;        // Hashed password (empty for OAuth)
  role: string;            // admin | operator | viewer
  avatar: string;          // Avatar URL
  status: string;          // active | inactive
  provider: string;        // credentials | google
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
}
```

## 🎯 Authentication Flow

### Credentials Login:
1. User submit email & password
2. Query user dari Cosmos DB
3. Verify password dengan bcrypt
4. Create JWT session
5. Redirect ke dashboard

### Google OAuth:
1. User klik "Sign in with Google"
2. Redirect ke Google consent screen
3. Google callback dengan user info
4. Check if user exists di Cosmos DB
5. Create user baru jika belum ada
6. Create JWT session
7. Redirect ke dashboard

## 🎯 Session Management

- Strategy: JWT
- Max Age: 30 days
- Session data includes: id, email, name, role, avatar

## 🔐 Protected Routes (Coming Soon)

Untuk protect routes, gunakan middleware atau check session di component:

```typescript
import { useSession } from "next-auth/react";

export default function ProtectedPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  return <div>Protected content</div>;
}
```

## 🚀 Deployment ke Azure

Tambahkan environment variables di Azure App Service:

1. Go to Azure Portal
2. App Service > Configuration > Application settings
3. Add:
   - `NEXTAUTH_URL` = `https://your-app.azurewebsites.net`
   - `NEXTAUTH_SECRET` = (same secret)

## ✅ Testing

```bash
# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# Test login (via browser)
# Go to http://localhost:3000/login
```

## 📚 Resources

- [NextAuth.js Docs](https://next-auth.js.org/)
- [Azure Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs)
