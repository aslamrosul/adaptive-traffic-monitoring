# Deploy ke Azure Web App

## Persiapan

### 1. Konfigurasi Azure Web App

Di Azure Portal, pastikan Web App sudah dikonfigurasi:

```bash
# Runtime Stack: Node 20 LTS
# Operating System: Linux (recommended) atau Windows
```

### 2. Application Settings di Azure

Tambahkan environment variables di Azure Portal → Configuration → Application settings:

```
AZURE_COSMOS_ENDPOINT=<your-cosmos-endpoint>
AZURE_COSMOS_KEY=<your-cosmos-key>
AZURE_COSMOS_DATABASE=TrafficMonitoring
AZURE_STORAGE_ACCOUNT_NAME=<your-storage-account>
AZURE_STORAGE_ACCOUNT_KEY=<your-storage-key>
AZURE_STORAGE_CONTAINER_NAME=avatars
WEBSITE_NODE_DEFAULT_VERSION=20-lts
```

### 3. Startup Command (untuk Linux)

Di Azure Portal → Configuration → General settings → Startup Command:

```bash
node server.js
```

## GitHub Actions Secrets

Pastikan secrets berikut sudah ada di GitHub repository:

- `AZUREAPPSERVICE_CLIENTID_AD94D725D26243C89F1964778C2DACE5`
- `AZUREAPPSERVICE_TENANTID_05B6E788989A4FC08338FFCE44D7F1CA`
- `AZUREAPPSERVICE_SUBSCRIPTIONID_CA54A5CB92EF4C4597DDA6894EABD03E`

## Deployment Process

### Otomatis via GitHub Actions

1. Push ke branch `main`:
```bash
git add .
git commit -m "Deploy to Azure"
git push origin main
```

2. Monitor di GitHub Actions tab

### Manual Deploy

```bash
# Build locally
npm run build

# Deploy menggunakan Azure CLI
az webapp up --name traffic-monitoring-app --resource-group <your-rg>
```

## Troubleshooting

### Error: Application Error

Cek logs di Azure Portal → Log stream atau:

```bash
az webapp log tail --name traffic-monitoring-app --resource-group <your-rg>
```

### Error: Module not found

Pastikan `output: 'standalone'` ada di `next.config.ts`

### Error: 502 Bad Gateway

- Cek startup command sudah benar
- Pastikan port menggunakan `process.env.PORT || 3000`
- Restart Web App

### Performance Issues

Enable Application Insights untuk monitoring:

```bash
az webapp config appsettings set --name traffic-monitoring-app \
  --resource-group <your-rg> \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=<your-key>
```

## Perbedaan dengan Vercel

| Feature | Vercel | Azure Web App |
|---------|--------|---------------|
| Build | Otomatis | Via GitHub Actions |
| Environment Variables | Dashboard | Application Settings |
| Logs | Real-time | Log Stream |
| Scaling | Otomatis | Manual/Auto-scale rules |
| Custom Domain | Mudah | Perlu DNS config |
| Cost | Free tier generous | Pay per hour |

## Next.js Standalone Output

File `next.config.ts` sudah dikonfigurasi dengan `output: 'standalone'` yang:

- Menghasilkan build minimal tanpa node_modules
- Hanya include dependencies yang dibutuhkan
- Lebih cepat startup dan lebih kecil size
- Optimal untuk container/cloud deployment

## Monitoring

Setelah deploy, monitor:

1. Application Insights (jika enabled)
2. Log Stream di Azure Portal
3. Metrics: CPU, Memory, Response Time
4. Availability Tests untuk uptime monitoring
