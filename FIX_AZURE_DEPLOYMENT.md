# Fix Azure Deployment Issues

## 🔴 Masalah yang Ditemukan:

### 1. 404 Error - `/bantuan` dan `/pengaturan`
**Penyebab:** Old code masih di-deploy di Azure  
**Solusi:** Push perubahan terbaru

### 2. 500 Error - Cosmos DB Authorization
**Error Message:**
```
The input authorization token can't serve the request. 
The wrong key is being used or the expected payload is not built as per the protocol.
```

**Penyebab:** 
- Cosmos DB key salah di Azure App Settings
- Cosmos DB key expired/regenerated
- Environment variables tidak match

## ✅ Cara Memperbaiki:

### Step 1: Verify Local Environment

```powershell
# Check .env.local
cat .env.local

# Pastikan ada:
# AZURE_COSMOS_ENDPOINT=https://traffic-cosmos-slam.documents.azure.com:443/
# AZURE_COSMOS_KEY=your-key-here
# AZURE_COSMOS_DATABASE=TrafficDB
```

### Step 2: Get Fresh Cosmos DB Key

1. Buka [Azure Portal](https://portal.azure.com)
2. Search: `traffic-cosmos-slam`
3. Klik **Keys** di menu kiri
4. Copy **PRIMARY KEY** atau **SECONDARY KEY**

### Step 3: Update Azure App Settings

**Opsi A: Via Azure Portal (Recommended)**

1. Buka [Azure Portal](https://portal.azure.com)
2. Search: `traffic-monitoring-app`
3. Klik **Configuration** di menu kiri
4. Klik **Application settings**
5. Update/Add these settings:

```
AZURE_COSMOS_ENDPOINT = https://traffic-cosmos-slam.documents.azure.com:443/
AZURE_COSMOS_KEY = [PASTE KEY FROM STEP 2]
AZURE_COSMOS_DATABASE = TrafficDB
NODE_ENV = production
```

6. Klik **Save**
7. Klik **Continue** untuk restart app

**Opsi B: Via Azure CLI**

```powershell
# Login
az login

# Set variables
$resourceGroup = "your-resource-group"
$appName = "traffic-monitoring-app"
$cosmosKey = "your-cosmos-key-here"

# Update settings
az webapp config appsettings set `
  --resource-group $resourceGroup `
  --name $appName `
  --settings `
    AZURE_COSMOS_ENDPOINT="https://traffic-cosmos-slam.documents.azure.com:443/" `
    AZURE_COSMOS_KEY="$cosmosKey" `
    AZURE_COSMOS_DATABASE="TrafficDB" `
    NODE_ENV="production"
```

### Step 4: Push Latest Code

```powershell
# Add changes
git add components/Sidebar.tsx app/profile/page.tsx components/ModalEditUser.tsx app/pengguna/page.tsx

# Commit
git commit -m "fix: Update menu links and add edit user modal"

# Push (will trigger auto-deploy)
git push origin main
```

### Step 5: Wait for Deployment

1. Buka [GitHub Actions](https://github.com/aslamrosul/adaptive-traffic-monitoring/actions)
2. Tunggu workflow selesai (biasanya 5-10 menit)
3. Check status: ✅ Success

### Step 6: Verify

```powershell
# Test API
curl https://traffic-monitoring-app-hah0g9awf6eecfgf.southeastasia-01.azurewebsites.net/api/health

# Should return:
# {"status":"ok","database":"connected"}
```

## 🔍 Troubleshooting

### Error: "The wrong key is being used"

**Solusi:**
1. Get fresh key dari Azure Portal
2. Update di Azure App Settings
3. Restart app

### Error: "404 Not Found" untuk `/bantuan` atau `/pengaturan`

**Solusi:**
1. Pastikan code sudah di-push
2. Wait for GitHub Actions deployment
3. Clear browser cache (Ctrl+Shift+Delete)
4. Hard refresh (Ctrl+F5)

### Error: "Cannot read properties of undefined"

**Solusi:**
1. Check browser console untuk detail error
2. Pastikan all dependencies installed
3. Rebuild: `npm run build`

### Deployment Stuck

**Solusi:**
```powershell
# Check deployment logs
az webapp log tail --name traffic-monitoring-app --resource-group your-resource-group

# Or via Azure Portal:
# App Service > Deployment Center > Logs
```

## 📋 Checklist

Sebelum test di production:

- [ ] ✅ Cosmos DB key updated di Azure App Settings
- [ ] ✅ Latest code pushed to GitHub
- [ ] ✅ GitHub Actions deployment success
- [ ] ✅ App restarted (automatic after settings change)
- [ ] ✅ Browser cache cleared
- [ ] ✅ Test `/api/health` endpoint
- [ ] ✅ Test `/profile?tab=settings`
- [ ] ✅ Test `/profile?tab=help`
- [ ] ✅ Test `/pengguna` (edit user)

## 🎯 Quick Fix Commands

```powershell
# 1. Commit and push
git add .
git commit -m "fix: Update menu links and Cosmos DB connection"
git push

# 2. Wait for deployment (check GitHub Actions)

# 3. Test
curl https://traffic-monitoring-app-hah0g9awf6eecfgf.southeastasia-01.azurewebsites.net/api/health

# 4. If still error, update Cosmos DB key in Azure Portal
```

## 💡 Prevention

Untuk mencegah masalah ini di masa depan:

1. **Jangan regenerate Cosmos DB keys** tanpa update di App Settings
2. **Use Key Vault** untuk store secrets (advanced)
3. **Monitor logs** di Azure Portal
4. **Test locally** sebelum push ke production

## 🆘 Still Not Working?

1. Check Azure Portal logs:
   - App Service > Log stream
   - App Service > Diagnose and solve problems

2. Check GitHub Actions logs:
   - GitHub repo > Actions > Latest workflow

3. Verify environment variables:
   - App Service > Configuration > Application settings

4. Restart app manually:
   - App Service > Overview > Restart

---

**IMPORTANT:** 
- Cosmos DB key adalah **SECRET** - jangan commit ke Git!
- Selalu update di Azure App Settings, bukan di code
- Test di local dulu sebelum deploy
