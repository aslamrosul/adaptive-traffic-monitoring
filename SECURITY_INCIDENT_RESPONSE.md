# 🚨 Security Incident Response - Exposed Google OAuth Credentials

## ⚠️ What Happened

Google OAuth Client ID and Client Secret were accidentally committed to `AUTH_SETUP.md` and pushed to GitHub. GitHub Push Protection blocked the push, but the credentials are in your local commit history.

## ✅ Immediate Actions Required

### 1. Regenerate Google OAuth Credentials (CRITICAL)

Since the credentials were exposed in commit history, you MUST regenerate them:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID: `955655903720-rmalbl82urom1c128ibneiseu040j6kg`
4. Click the **trash icon** to delete it
5. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
6. Application type: **Web application**
7. Name: `Traffic Monitoring App`
8. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://traffic-monitoring-app.azurewebsites.net`
9. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://traffic-monitoring-app.azurewebsites.net/api/auth/callback/google`
10. Click **CREATE**
11. Copy the new **Client ID** and **Client Secret**

### 2. Update .env.local with New Credentials

```bash
# Open .env.local and update:
GOOGLE_CLIENT_ID=your-new-client-id-here
GOOGLE_CLIENT_SECRET=your-new-client-secret-here
```

### 3. Update Azure Web App Environment Variables

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to your Web App: `traffic-monitoring-app`
3. Go to **Settings** → **Environment variables**
4. Update:
   - `GOOGLE_CLIENT_ID` = new client ID
   - `GOOGLE_CLIENT_SECRET` = new client secret
5. Click **Apply** and **Confirm**

### 4. Clean Git History

The exposed credentials are in your local commit history. You need to remove them:

```bash
# Option A: Amend the last commit (if it's the most recent commit)
git reset --soft HEAD~1
git add .
git commit -m "Complete authentication and profile integration"
git push origin main

# Option B: Interactive rebase (if it's in older commits)
git rebase -i HEAD~5  # Adjust number based on how far back
# Mark the commit with exposed credentials as 'edit'
# Remove the credentials from AUTH_SETUP.md
git add AUTH_SETUP.md
git rebase --continue
git push origin main --force
```

### 5. Verify Clean Push

After cleaning history and regenerating credentials:

```bash
# Try pushing again
git push origin main

# Should succeed without security warnings
```

---

## 🔐 Prevention for Future

### 1. Never Commit Real Credentials

Always use placeholders in documentation:
```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### 2. Use .env.local for Real Credentials

Real credentials should ONLY be in `.env.local` (which is in `.gitignore`):
```env
# .env.local (NOT committed to git)
GOOGLE_CLIENT_ID=955655903720-actual-real-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-actual-real-secret
```

### 3. Check Before Committing

Always review your changes before committing:
```bash
git diff
git status
```

### 4. Use GitHub Secret Scanning

GitHub's push protection is working correctly - it caught this issue!

---

## 📋 Checklist

- [ ] Delete old Google OAuth credentials in Google Cloud Console
- [ ] Create new Google OAuth credentials
- [ ] Update `.env.local` with new credentials
- [ ] Update Azure Web App environment variables
- [ ] Clean git commit history
- [ ] Push successfully to GitHub
- [ ] Test login with new credentials
- [ ] Verify Google OAuth still works

---

## 🧪 Test After Fix

```bash
# Start dev server
npm run dev

# Test login
# 1. Go to http://localhost:3000/login
# 2. Click "Sign in with Google"
# 3. Should work with new credentials
```

---

## 📞 Need Help?

If you're unsure about any step, ask before proceeding. Security is critical!

---

**Status:** ⚠️ CREDENTIALS EXPOSED - ACTION REQUIRED
**Priority:** 🔴 CRITICAL
**ETA:** 10-15 minutes to complete all steps
