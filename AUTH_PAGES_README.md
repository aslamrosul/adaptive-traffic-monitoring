# Authentication Pages - Login & Register

## 📄 Deskripsi

Halaman login dan register untuk sistem Aerial Command dengan desain modern, animasi Framer Motion, dan validasi form.

## 🗂️ Struktur File

### Halaman

- **`app/login/page.tsx`** - Halaman login
- **`app/register/page.tsx`** - Halaman register

### Komponen yang Diupdate

- **`components/LandingNav.tsx`** - Navbar dengan 2 tombol (Login & Daftar)

## 🎨 Fitur Login Page

### Form Fields

1. **Email**
   - Icon: mail
   - Type: email
   - Placeholder: "nama@email.com"
   - Required: Yes

2. **Password**
   - Icon: lock
   - Type: password (toggle visibility)
   - Placeholder: "••••••••"
   - Required: Yes
   - Toggle show/hide password

### Additional Features

- **Remember Me** checkbox
- **Forgot Password** link
- **Social Login** buttons (Google & Facebook)
- **Loading State** dengan spinner
- **Toast Notifications** untuk feedback
- **Link ke Register** page

### Validasi

- Email dan password harus diisi
- Toast error jika field kosong
- Toast success saat login berhasil
- Redirect ke `/dashboard` setelah login

## 🎨 Fitur Register Page

### Form Fields

1. **Nama Lengkap**
   - Icon: person
   - Type: text
   - Placeholder: "John Doe"
   - Required: Yes

2. **Email**
   - Icon: mail
   - Type: email
   - Placeholder: "nama@email.com"
   - Required: Yes

3. **Password**
   - Icon: lock
   - Type: password (toggle visibility)
   - Placeholder: "Minimal 8 karakter"
   - Required: Yes
   - Min length: 8 characters

4. **Konfirmasi Password**
   - Icon: lock_reset
   - Type: password (toggle visibility)
   - Placeholder: "Ulangi password"
   - Required: Yes
   - Must match password

### Additional Features

- **Terms & Conditions** checkbox (required)
- **Social Register** buttons (Google & Facebook)
- **Loading State** dengan spinner
- **Toast Notifications** untuk feedback
- **Link ke Login** page

### Validasi

- Semua field harus diisi
- Password minimal 8 karakter
- Password dan konfirmasi harus cocok
- Harus setuju dengan syarat & ketentuan
- Toast error untuk setiap validasi gagal
- Toast success saat register berhasil
- Redirect ke `/dashboard` setelah register

## 🎭 Design Elements

### Layout

- **Background**: Gradient from-blue-50 via-white to-slate-50
- **Container**: max-w-md, centered
- **Card**: White background, rounded-2xl, shadow-xl
- **Padding**: p-8 untuk form card

### Logo & Title

- **Logo**: Traffic icon (filled) + "Aerial Command" text
- **Title**: text-3xl font-bold
- **Subtitle**: text-slate-600

### Form Styling

- **Input**: Border slate-300, focus ring-2 ring-blue-500
- **Icon**: Absolute left-3, text-slate-400
- **Button**: bg-blue-600, shadow-lg, hover translate-y
- **Spacing**: space-y-6 (login), space-y-5 (register)

### Colors

- **Primary**: blue-600
- **Text**: slate-900 (heading), slate-600 (body)
- **Border**: slate-300
- **Focus**: blue-500
- **Error**: red-600 (via toast)
- **Success**: green-600 (via toast)

## 🎬 Animations

### Page Load

```tsx
Container: initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         duration: 0.5s

Form Card: initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          duration: 0.5s, delay: 0.1s
```

### Button Hover

- **Translate**: hover:-translate-y-0.5
- **Shadow**: shadow-lg → hover:shadow-xl
- **Background**: bg-blue-600 → hover:bg-blue-700

### Loading State

- **Spinner**: Rotating border animation
- **Text**: "Memproses..."
- **Disabled**: opacity-50, cursor-not-allowed

## 🔗 Navigation Flow

### Landing Page → Auth

```
Landing Navbar:
├── Login Button → /login
└── Daftar Button → /register
```

### Auth Pages → Dashboard

```
Login Page:
├── Submit Form → /dashboard (success)
├── Register Link → /register
└── Back Link → /landing

Register Page:
├── Submit Form → /dashboard (success)
├── Login Link → /login
└── Back Link → /landing
```

## 🔐 Authentication Logic

### Login (Simulasi)

```typescript
1. Validate: email && password
2. Show loading state (1.5s)
3. Success: Toast + redirect to /dashboard
4. Error: Toast error message
```

### Register (Simulasi)

```typescript
1. Validate: all fields filled
2. Check: agreedToTerms === true
3. Check: password.length >= 8
4. Check: password === confirmPassword
5. Show loading state (1.5s)
6. Success: Toast + redirect to /dashboard
7. Error: Toast error message
```

## 📱 Responsive Design

### Breakpoints

- **Mobile**: Full width, padding p-4
- **Desktop**: max-w-md, centered

### Mobile Navbar

- **Login Button**: Border blue-600, text-center
- **Daftar Button**: bg-blue-600, text-white
- **Spacing**: pt-4 space-y-2

### Desktop Navbar

- **Login Button**: Border blue-600, inline
- **Daftar Button**: bg-blue-600, inline
- **Spacing**: gap-3

## 🎨 Social Login Buttons

### Google

- **Icon**: SVG with brand colors (#4285F4, #34A853, #FBBC05, #EA4335)
- **Text**: "Google"
- **Style**: Border slate-300, hover:bg-slate-50

### Facebook

- **Icon**: SVG with brand color (#1877F2)
- **Text**: "Facebook"
- **Style**: Border slate-300, hover:bg-slate-50

### Layout

- **Grid**: grid-cols-2 gap-3
- **Divider**: "Atau masuk/daftar dengan"

## 🔔 Toast Notifications

### Success Messages

- ✅ "Login berhasil! Mengarahkan ke dashboard..."
- ✅ "Registrasi berhasil! Mengarahkan ke dashboard..."

### Error Messages

- ❌ "Email dan password harus diisi!"
- ❌ "Password tidak cocok!"
- ❌ "Password minimal 8 karakter!"
- ❌ "Anda harus menyetujui syarat dan ketentuan"

## 🔧 Customization

### Mengubah Redirect Target

```typescript
// Di handleLogin atau handleRegister
router.push("/dashboard"); // Ganti dengan route lain
```

### Mengubah Loading Duration

```typescript
setTimeout(() => {
  // Logic
}, 1500); // Ganti durasi (ms)
```

### Menambah Validasi

```typescript
if (customValidation) {
  toast.error("Custom error message");
  return;
}
```

### Integrasi dengan Backend API

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      toast.success("Login berhasil!");
      router.push("/dashboard");
    } else {
      toast.error(data.error || "Login gagal");
    }
  } catch (error) {
    toast.error("Terjadi kesalahan");
  } finally {
    setIsLoading(false);
  }
};
```

## 📦 Dependencies

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Hot Toast** - Notifications
- **Material Symbols** - Icons

## ✅ Checklist Implementasi

- [x] Halaman login dibuat
- [x] Halaman register dibuat
- [x] Form validation
- [x] Password toggle visibility
- [x] Remember me checkbox
- [x] Terms & conditions checkbox
- [x] Social login buttons (UI only)
- [x] Loading states
- [x] Toast notifications
- [x] Responsive design
- [x] Framer Motion animations
- [x] Navbar updated (2 buttons)
- [x] Mobile menu updated
- [x] Navigation links
- [x] No diagnostic errors

## 🎯 Next Steps

1. **Backend Integration**
   - Buat API endpoints: `/api/auth/login`, `/api/auth/register`
   - Implementasi JWT authentication
   - Session management

2. **Social Login**
   - Integrasi Google OAuth
   - Integrasi Facebook Login
   - NextAuth.js setup

3. **Password Reset**
   - Halaman forgot password
   - Email verification
   - Reset password flow

4. **Email Verification**
   - Send verification email
   - Verify email endpoint
   - Resend verification

5. **Security**
   - CSRF protection
   - Rate limiting
   - Password hashing (bcrypt)
   - Input sanitization

6. **UX Improvements**
   - Password strength indicator
   - Real-time validation
   - Better error messages
   - Success animations

## 🔒 Security Notes

- Password tidak di-log ke console
- Form menggunakan HTTPS (production)
- Input sanitization diperlukan di backend
- Implementasi rate limiting untuk prevent brute force
- Password harus di-hash dengan bcrypt/argon2
- JWT token harus disimpan dengan aman (httpOnly cookies)

## 📝 Testing Checklist

### Login Page

- [ ] Email validation
- [ ] Password validation
- [ ] Remember me functionality
- [ ] Forgot password link
- [ ] Social login buttons
- [ ] Loading state
- [ ] Success redirect
- [ ] Error handling
- [ ] Mobile responsive
- [ ] Back to landing link

### Register Page

- [ ] All fields validation
- [ ] Password match validation
- [ ] Password length validation
- [ ] Terms checkbox validation
- [ ] Social register buttons
- [ ] Loading state
- [ ] Success redirect
- [ ] Error handling
- [ ] Mobile responsive
- [ ] Back to landing link

### Navigation

- [ ] Landing → Login
- [ ] Landing → Register
- [ ] Login → Register
- [ ] Register → Login
- [ ] Auth → Dashboard (success)
- [ ] Auth → Landing (back)
