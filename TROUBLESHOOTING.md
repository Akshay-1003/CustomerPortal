# Troubleshooting Guide

## 🔧 Common Issues and Solutions

### Issue: "undefined is not valid JSON" Error

**Symptoms:**
- Error in console: `Uncaught SyntaxError: "undefined" is not valid JSON`
- Error occurs in `auth.service.ts` at `getCurrentUser()`

**Cause:**
Invalid cookie data stored in browser (string "undefined" instead of actual user data)

**Solution:**

#### Option 1: Clear Cookies via Browser DevTools
1. Open the application in your browser
2. Press `F12` or right-click → "Inspect" to open DevTools
3. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
4. In the left sidebar, expand **Cookies**
5. Click on `http://localhost:5174` (or your current URL)
6. Find and delete these cookies:
   - `auth_token`
   - `user`
   - `organization_id`
7. Refresh the page

#### Option 2: Use Browser Console
1. Open the application
2. Press `F12` to open DevTools
3. Go to the **Console** tab
4. Paste and run this command:
   ```javascript
   document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"));
   ```
5. Refresh the page

#### Option 3: Logout (if accessible)
1. Click on your user profile in the sidebar
2. Select "Sign Out"
3. This will clear all cookies automatically

**Prevention:**
The code has been updated to handle this issue automatically. Invalid cookies will now be detected and cleared.

---

### Issue: Organizations Not Loading

**Symptoms:**
- Login page shows "Loading organizations..." indefinitely
- Dropdown remains empty

**Solutions:**

1. **Check API Connection**
   ```bash
   curl http://35.172.1.180:5000/api/v1/organizations
   ```
   Should return JSON with organizations array

2. **Check Network Tab**
   - Open DevTools → Network tab
   - Look for `/organizations` request
   - Check status code and response

3. **Verify Environment Variable**
   ```bash
   cat .env
   ```
   Should contain:
   ```
   VITE_API_BASE_URL=http://35.172.1.180:5000/api/v1
   ```

4. **Check CORS**
   - If you see CORS errors in console
   - Backend must allow requests from `http://localhost:5174`

---

### Issue: Login Fails After Entering Credentials

**Symptoms:**
- Error message after clicking "Sign In"
- Stays on login page

**Solutions:**

1. **Check Credentials**
   - Verify organization is selected
   - Check email format
   - Verify password

2. **Check API Response**
   - Open DevTools → Network tab
   - Look for `/auth/login` request
   - Check response for error message

3. **Common Error Messages:**
   - "Invalid credentials" → Wrong email/password
   - "Organization not found" → Invalid organization ID
   - "Network Error" → API server not responding

---

### Issue: Token Expired / Auto Logout

**Symptoms:**
- Suddenly redirected to login page
- "401 Unauthorized" errors

**Cause:**
JWT token has expired (default: 7 days)

**Solution:**
- Simply log in again
- Token will be refreshed automatically

---

### Issue: Data Not Loading / Blank Dashboard

**Symptoms:**
- Dashboard loads but shows loading spinners
- No data appears

**Solutions:**

1. **Check Organization Selection**
   - Ensure organization was selected during login
   - Check browser console for errors

2. **Check API Endpoints**
   ```bash
   # Replace {org_id} with your organization ID
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://35.172.1.180:5000/api/v1/gauge/organization/{org_id}/gauges
   ```

3. **Clear Cache and Reload**
   - Close all tabs with the app
   - Clear browser cache
   - Reopen and login

---

### Issue: Port Already in Use

**Symptoms:**
- Error when running `npm run dev`
- "Port 5173 is in use"

**Solutions:**

1. **Kill Existing Process**
   ```bash
   # Find process using port 5173
   lsof -ti:5173 | xargs kill -9
   ```

2. **Use Different Port**
   ```bash
   npm run dev -- --port 3000
   ```

3. **Check for Running Dev Servers**
   - Look in other terminal windows
   - Check if Vite is already running

---

### Issue: Build Fails

**Symptoms:**
- `npm run build` fails with errors
- TypeScript errors

**Solutions:**

1. **Clean Install**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Check TypeScript Errors**
   - Fix any reported type errors
   - Ensure type imports use `import { type TypeName }`

3. **Clear Cache**
   ```bash
   rm -rf dist .vite
   npm run build
   ```

---

### Issue: Styles Not Loading / Broken UI

**Symptoms:**
- Plain HTML without styling
- Components look broken

**Solutions:**

1. **Check Tailwind Config**
   ```bash
   # Ensure these files exist
   ls tailwind.config.ts postcss.config.mjs
   ```

2. **Restart Dev Server**
   ```bash
   # Stop dev server (Ctrl+C)
   npm run dev
   ```

3. **Check index.css**
   Verify it contains:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

---

### Issue: Dark Mode Not Working

**Symptoms:**
- Theme toggle doesn't change appearance
- Always light or always dark

**Solutions:**

1. **Clear localStorage**
   ```javascript
   // In browser console
   localStorage.clear()
   location.reload()
   ```

2. **Check Theme Provider**
   - Should wrap entire app in `main.tsx`

---

### Issue: Table Export Not Working

**Symptoms:**
- "Export Excel" button does nothing
- No file downloads

**Solutions:**

1. **Check Browser Permissions**
   - Allow downloads from `localhost`
   - Check Downloads folder

2. **Check Console for Errors**
   - Open DevTools → Console
   - Look for XLSX-related errors

---

## 🆘 Still Having Issues?

If none of these solutions work:

1. **Clear Everything and Start Fresh**
   ```bash
   # Stop dev server
   # Clear all caches
   rm -rf node_modules dist .vite
   
   # Clear browser data
   # - Delete all cookies for localhost
   # - Clear localStorage
   # - Clear cache
   
   # Reinstall
   npm install
   npm run dev
   ```

2. **Check Browser Console**
   - Look for red error messages
   - Note the error text and file names

3. **Check Terminal Output**
   - Look for build errors
   - Note any warnings

4. **Verify API Server**
   - Ensure backend is running
   - Test endpoints directly with curl

5. **Check Documentation**
   - README.md - Full documentation
   - SETUP.md - Setup guide
   - IMPLEMENTATION_SUMMARY.md - Technical details

---

## 📝 Getting Help

When reporting an issue, please include:
- Browser and version
- Error message from console
- Network tab screenshot (if API-related)
- Steps to reproduce
- Environment (.env contents - **redact sensitive info**)

---

## 🔍 Useful Browser DevTools Commands

**Clear all cookies:**
```javascript
document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"));
```

**Clear localStorage:**
```javascript
localStorage.clear()
```

**Check current auth token:**
```javascript
document.cookie
```

**Check React Query cache:**
- Look for "React Query Devtools" button in bottom-left of screen
- Click to see cached queries

---

**Most issues can be resolved by clearing cookies and cache!** 🔄





