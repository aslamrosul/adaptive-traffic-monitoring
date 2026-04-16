# User Management API Documentation

API endpoints untuk manajemen pengguna (CRUD operations).

## 📋 Endpoints

### 1. List All Users
```
GET /api/users
```

**Query Parameters:**
- `role` (optional): Filter by role (`admin` or `operator`)
- `status` (optional): Filter by status (`active` or `inactive`)

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "user_001",
      "name": "Admin Utama",
      "email": "admin@traffic.com",
      "role": "admin",
      "phone": "+62812345678",
      "location": "Jakarta",
      "status": "active",
      "reportsCreated": 0,
      "reportsCompleted": 0,
      "activeHours": 0,
      "createdAt": "2024-01-25T10:00:00Z",
      "updatedAt": "2024-01-25T10:00:00Z"
    }
  ]
}
```

---

### 2. Get Single User
```
GET /api/users/[id]
```

**Parameters:**
- `id` (required): User ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_001",
    "name": "Admin Utama",
    "email": "admin@traffic.com",
    "role": "admin",
    "phone": "+62812345678",
    "location": "Jakarta",
    "status": "active"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### 3. Create User
```
POST /api/users
```

**Request Body:**
```json
{
  "name": "Operator Baru",
  "email": "operator@traffic.com",
  "role": "operator",
  "phone": "+62812345679",
  "location": "Jakarta Selatan"
}
```

**Required Fields:**
- `name` (string)
- `email` (string)
- `role` (string): `admin` or `operator`

**Optional Fields:**
- `phone` (string)
- `location` (string)

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "user_004",
    "name": "Operator Baru",
    "email": "operator@traffic.com",
    "role": "operator",
    "phone": "+62812345679",
    "location": "Jakarta Selatan",
    "status": "active",
    "reportsCreated": 0,
    "reportsCompleted": 0,
    "activeHours": 0,
    "createdAt": "2024-01-25T10:00:00Z",
    "updatedAt": "2024-01-25T10:00:00Z"
  }
}
```

---

### 4. Update User
```
PUT /api/users/[id]
```

**Parameters:**
- `id` (required): User ID

**Request Body:**
```json
{
  "name": "Admin Utama Updated",
  "email": "admin@traffic.com",
  "role": "admin",
  "phone": "+62812345678",
  "location": "Jakarta Pusat",
  "status": "active"
}
```

**Updatable Fields:**
- `name` (string)
- `email` (string)
- `role` (string): `admin` or `operator`
- `phone` (string)
- `location` (string)
- `status` (string): `active` or `inactive`

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "user_001",
    "name": "Admin Utama Updated",
    "email": "admin@traffic.com",
    "role": "admin",
    "phone": "+62812345678",
    "location": "Jakarta Pusat",
    "status": "active",
    "updatedAt": "2024-01-25T11:00:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### 5. Delete User
```
DELETE /api/users/[id]
```

**Parameters:**
- `id` (required): User ID

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

## 🧪 Testing

### PowerShell Examples

**List all users:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users"
```

**Get single user:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users/user_001"
```

**Create user:**
```powershell
$newUser = @{
    name = "Operator Baru"
    email = "operator@traffic.com"
    role = "operator"
    phone = "+62812345679"
    location = "Jakarta"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
    -Method POST `
    -Body $newUser `
    -ContentType "application/json"
```

**Update user:**
```powershell
$updateUser = @{
    name = "Admin Updated"
    email = "admin@traffic.com"
    role = "admin"
    phone = "+62812345678"
    location = "Jakarta Pusat"
    status = "active"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users/user_001" `
    -Method PUT `
    -Body $updateUser `
    -ContentType "application/json"
```

**Delete user:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users/user_001" `
    -Method DELETE
```

---

## 🎯 Frontend Integration

### Fetch Users
```typescript
const fetchUsers = async () => {
  const response = await fetch("/api/users");
  const result = await response.json();
  
  if (result.success) {
    setUsers(result.data);
  }
};
```

### Create User
```typescript
const createUser = async (userData) => {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  
  const result = await response.json();
  
  if (result.success) {
    toast.success("User created!");
    fetchUsers(); // Refresh list
  }
};
```

### Update User
```typescript
const updateUser = async (userId, userData) => {
  const response = await fetch(`/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  
  const result = await response.json();
  
  if (result.success) {
    toast.success("User updated!");
    fetchUsers(); // Refresh list
  }
};
```

### Delete User
```typescript
const deleteUser = async (userId) => {
  const response = await fetch(`/api/users/${userId}`, {
    method: "DELETE",
  });
  
  const result = await response.json();
  
  if (result.success) {
    toast.success("User deleted!");
    fetchUsers(); // Refresh list
  }
};
```

---

## 📝 Database Schema

**Collection:** `users`  
**Partition Key:** `/email`

**Fields:**
```typescript
{
  id: string;              // Unique ID (e.g., "user_001")
  email: string;           // Email (partition key)
  name: string;            // Full name
  role: string;            // "admin" | "operator"
  phone: string;           // Phone number
  location: string;        // Location/city
  status: string;          // "active" | "inactive"
  photoURL: string;        // Avatar URL (optional)
  reportsCreated: number;  // Number of reports created
  reportsCompleted: number;// Number of reports completed
  activeHours: number;     // Total active hours
  settings: object;        // User settings (optional)
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
}
```

---

## 🔒 Security Notes

1. **Authentication:** Currently no auth - add NextAuth or similar
2. **Authorization:** Check user role before allowing operations
3. **Validation:** Validate email format, required fields
4. **Rate Limiting:** Add rate limiting to prevent abuse
5. **Audit Log:** Log all user changes for compliance

---

## 🐛 Error Handling

**Common Errors:**

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Missing required fields | Required field not provided |
| 404 | User not found | User ID doesn't exist |
| 500 | Failed to fetch/update/delete | Database error |

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## 📚 Related Files

- `app/api/users/route.ts` - List & Create
- `app/api/users/[id]/route.ts` - Get, Update, Delete
- `app/pengguna/page.tsx` - Frontend page
- `components/ModalTambahUser.tsx` - Create modal
- `components/ModalEditUser.tsx` - Edit modal

---

**Last Updated:** 2024-01-25  
**API Version:** 1.0
