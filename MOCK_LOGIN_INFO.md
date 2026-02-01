# 🔓 Temporary Mock Login

The application is currently using **MOCK DATA** for login and API calls. No real backend is required!

## 📝 How to Login (Temporary)

### Step 1: Open the Application
Navigate to: `http://localhost:5174` (or whatever port is running)

### Step 2: Select Any Organization
Choose from the mock organizations:
- **Acme Corporation** (ACME)
- **TechCorp Industries** (TECH)
- **Global Manufacturing** (GLOB)
- **Precision Instruments** (PREC)

### Step 3: Enter Any Credentials
- **Email**: Enter ANY email (e.g., `test@example.com`)
- **Password**: Enter ANY password (e.g., `password`)

### Step 4: Click "Sign In"
- The login will succeed with mock data
- You'll be redirected to the dashboard
- Mock gauge data will be displayed

---

## ✅ What Works with Mock Data

- ✅ **Login** - Any email/password works
- ✅ **Organization Selection** - 4 mock organizations available
- ✅ **Dashboard** - Shows 25 mock gauges with KPIs and charts
- ✅ **Gauge List** - Full table with search, filter, sort, pagination
- ✅ **History** - Mock calibration history for each gauge
- ✅ **Export** - Excel export works with mock data
- ✅ **All UI Features** - Loading states, error states, responsive design

---

## 🔄 When Ready to Use Real API

When your backend endpoints are ready, you need to update **3 files**:

### 1. `src/services/auth.service.ts`

**Uncomment the real API code in `login()`:**
```typescript
async login(data: LoginRequest): Promise<LoginResponse> {
  // DELETE the mock code section
  
  // UNCOMMENT this section:
  const response = await apiService.post<LoginResponse>('/auth/login', data)
  
  if (response.access_token) {
    apiService.setAuthToken(response.access_token)
  }
  
  if (response.user) {
    Cookies.set('user', JSON.stringify(response.user), { expires: 7 })
  }
  
  return response
}
```

**Uncomment the real API code in `getOrganizations()`:**
```typescript
async getOrganizations(): Promise<Organization[]> {
  // DELETE the mock code section
  
  // UNCOMMENT this section:
  return await apiService.get<{ organizations: Organization[] }>('/organizations')
    .then(response => response.organizations)
}
```

### 2. `src/services/gauge.service.ts`

**Replace all three functions with real API calls:**
```typescript
export const gaugeService = {
  async getGaugesByOrganization(organizationId: string): Promise<Gauge[]> {
    return await apiService.get<Gauge[]>(`/gauge/organization/${organizationId}/gauges`)
  },

  async getGaugeHistory(gaugeId: string): Promise<GaugeHistory[]> {
    return await apiService.get<GaugeHistory[]>(`/gauge/${gaugeId}/history`)
  },

  async getGaugeById(gaugeId: string): Promise<Gauge> {
    return await apiService.get<Gauge>(`/gauge/${gaugeId}`)
  },
}
```

### 3. Update `.env` with Real API URL

```env
VITE_API_BASE_URL=http://your-real-api-url.com/api/v1
```

---

## 🎯 Quick Find & Replace

**Search for these comments to find all mock code:**
```
// TEMPORARY MOCK
```

**Or search for:**
```
// TODO: Replace with actual API call when endpoint is ready
```

All mock code is clearly marked with these comments!

---

## 🧪 Mock Data Details

### Organizations (4 total)
```javascript
[
  { id: 'org-1', name: 'Acme Corporation', code: 'ACME' },
  { id: 'org-2', name: 'TechCorp Industries', code: 'TECH' },
  { id: 'org-3', name: 'Global Manufacturing', code: 'GLOB' },
  { id: 'org-4', name: 'Precision Instruments', code: 'PREC' }
]
```

### Gauges (25 per organization)
- Mix of Pressure, Temperature, Flow, Level gauges
- Different statuses: Active, Inactive, Calibration Due, Overdue
- Realistic serial numbers and locations
- Manufacturers: Fluke, Omega, Rosemount, Yokogawa

### History (8 records per gauge)
- Mix of Calibration, Repair, Maintenance, Inspection
- Different technicians
- Pass/Fail/Pending results
- Mock certificate links

---

## 💡 Benefits of Mock Data

✅ **Develop UI without backend** - Frontend team can work independently  
✅ **Test all features** - Full application functionality works  
✅ **Consistent data** - Same data every time for testing  
✅ **Fast iteration** - No network delays, instant responses  
✅ **Easy switch** - Uncomment real API code when ready  

---

## ⚠️ Remember

- Mock login accepts **ANY** email and password
- Data is **generated** on each request (not persisted)
- Search/filter works on the mock data
- Export works with the mock data
- **No real backend required** for testing!

---

## 🚀 Try It Now!

1. Clear your cookies (if needed):
   ```javascript
   // Run in browser console
   document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"));
   ```

2. Refresh the page

3. Login with:
   - Organization: **Any**
   - Email: **test@example.com**
   - Password: **anything**

4. Explore the dashboard! 🎉

---

**You can now use the application without any backend! When your API is ready, just uncomment the real API code.** ✨





