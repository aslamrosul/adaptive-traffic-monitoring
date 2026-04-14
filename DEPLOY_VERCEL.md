# Deploy ke Vercel - Panduan Lengkap

## ✅ Build Berhasil
TypeScript type checking passed dan build completed successfully!

## Cara Deploy ke Vercel

### Opsi 1: Deploy via Vercel Dashboard (Recommended)

1. **Login ke Vercel**
   - Buka https://vercel.com
   - Login dengan GitHub account Anda

2. **Import Project**
   - Klik "Add New..." → "Project"
   - Pilih repository: `adaptive-traffic-monitoring`
   - Klik "Import"

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Environment Variables** (Optional)
   Jika ada environment variables, tambahkan di sini:
   ```
   # Contoh (sesuaikan dengan kebutuhan):
   # DATABASE_URL=your_database_url
   # API_KEY=your_api_key
   ```

5. **Deploy**
   - Klik "Deploy"
   - Tunggu proses build & deploy (2-5 menit)
   - Selesai! 🎉

### Opsi 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Atau langsung production:
   ```bash
   vercel --prod
   ```

## Konfigurasi Vercel (vercel.json)

Jika perlu konfigurasi khusus, buat file `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

## Catatan Penting untuk Production

### 1. File Upload (Avatar)
⚠️ **PENTING**: Vercel filesystem adalah read-only!

Untuk production, Anda perlu menggunakan cloud storage:

**Pilihan Storage:**
- **Cloudinary** (Recommended - Free tier generous)
- **AWS S3**
- **Vercel Blob Storage**
- **Supabase Storage**

**Implementasi Cloudinary (Contoh):**

```bash
npm install cloudinary
```

Update `app/api/profile/avatar/route.ts`:
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload ke Cloudinary instead of local filesystem
const result = await cloudinary.uploader.upload(file, {
  folder: 'avatars',
  public_id: `avatar-${userId}`,
});
```

### 2. Database
Saat ini menggunakan in-memory storage. Untuk production:

**Pilihan Database:**
- **Vercel Postgres** (Recommended)
- **Supabase** (PostgreSQL + Storage)
- **MongoDB Atlas**
- **PlanetScale** (MySQL)

### 3. Environment Variables
Tambahkan di Vercel Dashboard:
- Settings → Environment Variables
- Tambahkan semua API keys dan secrets

### 4. Domain Custom (Optional)
- Settings → Domains
- Tambahkan domain custom Anda
- Update DNS records sesuai instruksi

## Auto-Deploy dari Git

Setelah setup awal, setiap push ke branch akan auto-deploy:

- **Push ke `main`** → Deploy ke Production
- **Push ke branch lain** → Deploy ke Preview URL

## Monitoring & Logs

1. **Deployment Logs**
   - Dashboard → Deployments → Klik deployment
   - Lihat build logs dan runtime logs

2. **Analytics**
   - Dashboard → Analytics
   - Lihat traffic, performance, dll

3. **Error Tracking**
   - Integrasikan dengan Sentry (optional)

## Troubleshooting

### Build Failed
```bash
# Test build locally dulu
npm run build

# Check TypeScript errors
npm run type-check
```

### Runtime Errors
- Check Vercel logs di dashboard
- Pastikan environment variables sudah set
- Check API routes di `/api/*`

### Image Loading Issues
- Pastikan `next.config.ts` sudah configure image domains
- Check network tab di browser

## Performance Tips

1. **Enable Edge Runtime** (Optional)
   ```typescript
   // app/api/profile/route.ts
   export const runtime = 'edge';
   ```

2. **Add Caching**
   ```typescript
   export const revalidate = 60; // Cache 60 seconds
   ```

3. **Optimize Images**
   - Gunakan Next.js Image component (sudah ✅)
   - Set proper sizes dan quality

## Checklist Pre-Deploy

- [x] Build berhasil (`npm run build`)
- [x] TypeScript check passed
- [x] No console errors di development
- [x] Test semua fitur locally
- [ ] Setup cloud storage untuk avatars (production)
- [ ] Setup database (production)
- [ ] Prepare environment variables
- [ ] Test di berbagai browser
- [ ] Test responsive design

## Post-Deploy

1. **Test Production URL**
   - Test semua pages
   - Test profile upload (akan error jika belum setup cloud storage)
   - Test API endpoints

2. **Setup Monitoring**
   - Enable Vercel Analytics
   - Setup error tracking

3. **Share URL**
   - Production URL: `https://your-project.vercel.app`
   - Custom domain (jika ada)

## Resources

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Cloudinary Next.js](https://cloudinary.com/documentation/next_integration)

---

**Status**: ✅ Ready to Deploy
**Build**: Passing
**TypeScript**: No Errors
**Next Steps**: Deploy to Vercel!
