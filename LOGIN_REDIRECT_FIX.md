# 🔧 Login Redirect & Organization Data Fix

## ✅ Fixes Applied

### 1. **Enhanced Login Flow**
- Added proper state update delays
- Ensured organization_id is saved correctly
- Added comprehensive error handling
- Added debugging console logs

### 2. **Organization ID Handling**
- Ensures organization_id is saved from response
- Falls back to login form value if not in response
- Saves organization_id in both user object and separate cookie
- Verifies organization_id is available before data fetching

### 3. **Redirect Timing**
- Added delay after login to ensure state is updated
- Proper React Router navigation
- AuthContext properly updates user state
- ProtectedRoute checks authentication correctly

---

## 🔍 Debugging Steps

### Check Browser Console

After login, check the console for these logs:

1. **Login Request**
   ```
   Logging in with: { email: "...", organization_id: "..." }
   ```

2. **Login Response**
   ```
   Login response: { access_token: "...", user: {...} }
   Token saved
   User data saved: {...}
   Organization ID saved: "..."
   ```

3. **AuthContext**
   ```
   AuthContext init - Current user: {...}
   AuthContext init - Organization ID: "..."
   ```

4. **Data Fetching**
   ```
   useGauges - Organization ID: "..."
   Fetching gauges for organization: "..."
   ```

---

## 🐛 Common Issues & Solutions

### Issue 1: Not Redirecting After Login

**Symptoms:**
- Login succeeds but stays on login page
- No redirect to dashboard

**Check:**
1. Open browser console (F12)
2. Look for "Login successful, redirecting..." message
3. Check if there are any errors

**Solution:**
- Verify login response includes `user` object
- Check if `organization_id` is in the response
- Ensure cookies are being set (check Application tab → Cookies)

### Issue 2: Organization ID Not Available

**Symptoms:**
- Dashboard shows "Organization Not Set" error
- No data loading

**Check:**
1. Console: Look for "useGauges - Organization ID: null"
2. Application tab → Cookies → Check for `organization_id` cookie
3. Check `user` cookie contains `organization_id`

**Solution:**
- Verify API response includes `user.organization_id`
- Check if organization_id is being saved in cookies
- Try logging out and logging in again

### Issue 3: Data Not Loading

**Symptoms:**
- Dashboard loads but shows loading spinner forever
- No gauges displayed

**Check:**
1. Console: Look for "Fetching gauges for organization: ..."
2. Network tab: Check API call to `/gauge/organization/{id}/gauges`
3. Verify organization_id in the API call URL

**Solution:**
- Ensure organization_id is correct
- Check API endpoint is correct
- Verify token is being sent with request
- Check API response format

---

## 🔄 Login Flow (Step by Step)

### 1. User Submits Form
```
Login.tsx → onSubmit()
  ↓
Calls login() from AuthContext
  ↓
authService.login() → API call
```

### 2. API Response
```
POST auth/customer/login
Response: {
  access_token: "token",
  user: {
    id: "user-id",
    email: "email",
    name: "name",
    organization_id: "org-id"
  }
}
```

### 3. Save Data
```
authService.login():
  - Save access_token → cookie
  - Save user → cookie
  - Save organization_id → cookie (separate)
```

### 4. Update State
```
AuthContext.login():
  - setUser(response.user)
  - setOrganizationId(response.user.organization_id)
  - Wait 100ms for state update
```

### 5. Redirect
```
Login.tsx:
  - Wait 300ms
  - navigate('/', { replace: true })
```

### 6. Dashboard Loads
```
ProtectedRoute:
  - Check isAuthenticated
  - If true → Show Dashboard
  - If false → Redirect to /login
```

### 7. Data Fetching
```
Dashboard → useGauges():
  - Get organization_id from authService
  - Call API: /gauge/organization/{org_id}/gauges
  - Display data
```

---

## 📋 Verification Checklist

After login, verify:

- [ ] Console shows "Login successful, redirecting..."
- [ ] Redirects to dashboard (`/`)
- [ ] Dashboard loads (not stuck on loading)
- [ ] Console shows organization_id
- [ ] Cookies contain:
  - [ ] `auth_token`
  - [ ] `user` (with organization_id)
  - [ ] `organization_id`
- [ ] Network tab shows API call to `/gauge/organization/{id}/gauges`
- [ ] Data displays on dashboard

---

## 🔧 Manual Debugging

### Check Cookies
```javascript
// In browser console
console.log('Token:', document.cookie.match(/auth_token=([^;]+)/)?.[1])
console.log('User:', document.cookie.match(/user=([^;]+)/)?.[1])
console.log('Org ID:', document.cookie.match(/organization_id=([^;]+)/)?.[1])
```

### Check Auth State
```javascript
// In browser console (after login)
// Check if user is in context
// This requires React DevTools
```

### Check API Response
1. Open Network tab (F12)
2. Find `/auth/customer/login` request
3. Check Response tab
4. Verify structure matches expected format

---

## 🚨 If Still Not Working

### Step 1: Clear Everything
```javascript
// In browser console
localStorage.clear()
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
})
location.reload()
```

### Step 2: Check API Response Format

The API should return:
```json
{
  "access_token": "string",
  "token_type": "Bearer",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "organization_id": "string"
  }
}
```

If format is different, update `LoginResponse` type in `src/types/api.ts`

### Step 3: Verify Endpoint

Current endpoint: `auth/customer/login`

Full URL: `{baseURL}/auth/customer/login`

Base URL: `http://35.172.1.180:5000/api/v1`

---

## 📝 Code Changes Summary

### Files Modified

1. **`src/services/auth.service.ts`**
   - Added console logs for debugging
   - Ensured organization_id is saved from response or form data
   - Better error handling

2. **`src/contexts/AuthContext.tsx`**
   - Added delay after login for state update
   - Better organization_id handling
   - Console logs for debugging

3. **`src/pages/Login.tsx`**
   - Added delay before redirect
   - Better error handling
   - Console logs for debugging

4. **`src/hooks/useGauges.ts`**
   - Added console logs
   - Better error handling
   - Organization ID verification

---

## ✅ Expected Behavior

After successful login:

1. ✅ Console shows login success message
2. ✅ Cookies are set (token, user, organization_id)
3. ✅ Redirects to dashboard after ~300ms
4. ✅ Dashboard loads
5. ✅ Organization ID is available
6. ✅ API call is made with organization_id
7. ✅ Data displays on dashboard

---

## 🎯 Next Steps

1. **Test Login**
   - Use real credentials
   - Check console logs
   - Verify cookies are set

2. **Check API Response**
   - Verify response structure
   - Ensure organization_id is included

3. **Monitor Network**
   - Check API calls
   - Verify organization_id in URLs

4. **Check Dashboard**
   - Should load data
   - Should show organization-specific data

---

**The login redirect and organization data flow should now work correctly! 🎉**

**Check the browser console for debugging information if issues persist.**





