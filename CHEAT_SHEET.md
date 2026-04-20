# Backend Cheat Sheet - Quick Reference

## 🚀 Quick Commands

```powershell
# Setup everything (first time)
.\scripts\setup-database.ps1

# Start development
npm run dev

# Test APIs
.\scripts\test-api.ps1

# Backup data
npm run db:export

# Restore data
npm run db:import exports/cosmos-backup-2024-01-25
```

## 🔗 Azure Portal Quick Links

- **Portal**: https://portal.azure.com
- **Cosmos DB**: Search `traffic-cosmos-slam` → Data Explorer
- **Web App**: Search `traffic-monitoring-app` → Logs

## 📊 Collections & Partition Keys

| Collection | Partition Key | Purpose |
|------------|---------------|---------|
| users | /email | Users data |
| intersections | /deviceId | Intersections |
| traffic_data | /intersectionId | Traffic data |
| reports | /intersectionId | Reports |
| notifications | /userId | Notifications |
| events | /intersectionId | Events |
| device_status | /deviceId | IoT status |
| analytics_daily | /intersectionId | Analytics |

## 🌐 API Endpoints

### Users
```powershell
GET    /api/users
GET    /api/users?role=admin
POST   /api/users
```

### Intersections
```powershell
GET    /api/intersections
GET    /api/intersections/[id]
POST   /api/intersections
```

### Reports
```powershell
GET    /api/reports
GET    /api/reports?intersectionId=int_001
POST   /api/reports
```

### Profile
```powershell
GET    /api/profile
PUT    /api/profile
POST   /api/profile/avatar
DELETE /api/profile/avatar
```

### Settings
```powershell
GET    /api/settings?userId=xxx
PUT    /api/settings?userId=xxx
```

### Help
```powershell
GET    /api/help/faqs
GET    /api/help/faqs?search=sensor
GET    /api/help/guides
```

## 📝 Common SQL Queries (Azure Data Explorer)

```sql
-- List all users
SELECT * FROM c

-- Filter by role
SELECT * FROM c WHERE c.role = "admin"

-- Count items
SELECT VALUE COUNT(1) FROM c

-- Sort by date
SELECT * FROM c ORDER BY c.createdAt DESC

-- Check for missing fields
SELECT c.id, c.name, IS_DEFINED(c.settings) as hasSettings FROM c
```

## 🔧 PowerShell API Testing

### GET Request
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users"
```

### POST Request
```powershell
$body = @{
    email = "test@example.com"
    name = "Test User"
    role = "operator"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### PUT Request
```powershell
$update = @{
    name = "Updated Name"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users/user_001" `
    -Method PUT `
    -Body $update `
    -ContentType "application/json"
```

## 📦 JSON Templates

### User
```json
{
  "id": "user_xxx",
  "email": "user@example.com",
  "name": "User Name",
  "role": "operator",
  "phone": "+62812345678",
  "status": "active",
  "reportsCreated": 0,
  "reportsCompleted": 0,
  "activeHours": 0,
  "createdAt": "2024-01-25T10:00:00Z",
  "updatedAt": "2024-01-25T10:00:00Z"
}
```

### Intersection
```json
{
  "id": "int_xxx",
  "name": "Simpang Name",
  "address": "Jl. Address",
  "location": { "lat": -6.2088, "lng": 106.8456 },
  "deviceId": "device-xxx",
  "status": "active",
  "lanes": {
    "count": 4,
    "directions": ["north", "east", "south", "west"]
  },
  "config": {
    "mode": "auto",
    "threshold": { "low": 50, "medium": 100, "high": 200, "critical": 300 },
    "alertEnabled": true,
    "cycleTime": { "min": 30, "max": 120 }
  },
  "createdAt": "2024-01-25T10:00:00Z",
  "updatedAt": "2024-01-25T10:00:00Z"
}
```

### Report
```json
{
  "id": "rpt_xxx",
  "intersectionId": "int_001",
  "type": "congestion",
  "priority": "high",
  "status": "submitted",
  "title": "Report Title",
  "description": "Report description",
  "reportedBy": {
    "userId": "user_001",
    "userName": "User Name",
    "userEmail": "user@example.com",
    "userRole": "operator"
  },
  "createdAt": "2024-01-25T10:00:00Z",
  "updatedAt": "2024-01-25T10:00:00Z"
}
```

## 🎯 Common Tasks

### Add User
```powershell
# Via Portal: users > New Item > Paste JSON > Save
# Via API:
$user = @{ email="new@example.com"; name="New User"; role="operator" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method POST -Body $user -ContentType "application/json"
```

### Update Intersection Status
```powershell
# Via Portal: intersections > Items > Click item > Edit status > Update
# Via API:
$update = @{ status="maintenance" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/intersections/int_001" -Method PUT -Body $update -ContentType "application/json"
```

### Create Report
```powershell
$report = @{
    intersectionId = "int_001"
    type = "congestion"
    priority = "high"
    title = "Traffic Jam"
    description = "Heavy traffic"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/reports" -Method POST -Body $report -ContentType "application/json"
```

## 🐛 Troubleshooting

### Database Connection Error
```powershell
# Check .env.local
cat .env.local

# Test connection
npm run db:setup
```

### API Returns Empty
```powershell
# Seed data
npm run db:seed

# Verify in portal
# Azure Portal > Data Explorer > TrafficDB > users > Items
```

### Frontend Not Updating
```powershell
# 1. Check API
.\scripts\test-api.ps1

# 2. Check data in portal
# 3. Clear browser cache (Ctrl+Shift+Delete)
# 4. Hard refresh (Ctrl+F5)
```

## 📚 Documentation

- `QUICK_START.md` - Quick start guide
- `AZURE_DATA_EXPLORER_GUIDE.md` - Azure portal guide
- `DATABASE_SETUP_GUIDE.md` - Setup guide
- `BACKEND_COMPLETE_SUMMARY.md` - Complete summary
- `API_DOCUMENTATION.md` - API reference

## 🔐 Environment Variables

```env
# .env.local
AZURE_COSMOS_ENDPOINT=https://traffic-cosmos-slam.documents.azure.com:443/
AZURE_COSMOS_KEY=your-key-here
AZURE_COSMOS_DATABASE=TrafficDB
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_IOT_HUB_NAME=traffic-iot-slam
NODE_ENV=development
```

## 🎓 Learning Path

1. ✅ Setup database: `.\scripts\setup-database.ps1`
2. ✅ View data: Azure Portal > Data Explorer
3. ✅ Test APIs: `.\scripts\test-api.ps1`
4. ✅ Edit data: Portal > Items > Edit
5. ✅ Backup: `npm run db:export`
6. ✅ Deploy: Push to GitHub (auto-deploy)

---

**Pro Tips:**
- Always backup before major changes: `npm run db:export`
- Test locally before deploying: `npm run dev`
- Use Azure Data Explorer for quick edits
- Use scripts for bulk operations
- Check logs in Azure Portal for debugging
