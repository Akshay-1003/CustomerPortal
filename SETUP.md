# Setup Guide - Calibration Portal

Complete setup instructions for the Calibration Portal application.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

Verify installations:
```bash
node --version  # Should be v18+
npm --version   # Should be v8+
```

## 🔧 Step-by-Step Setup

### 1. Navigate to Project Directory
```bash
cd /Users/akshayprakashpatil/project/cportal/customerportal
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages including:
- React, TypeScript, Vite
- TanStack Query
- shadcn/ui components
- Tailwind CSS
- Axios, React Hook Form, Zod
- And more...

### 3. Create Environment File

Create a `.env` file in the project root (`customerportal/.env`):

```env
VITE_API_BASE_URL=https://api.metrologydesk.com/api/v1
```

> **Note:** The `.env` file is gitignored for security. Use `.env.example` as a template.

### 4. Verify Configuration Files

Ensure these files exist and are properly configured:

#### `vite.config.ts`
```typescript
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

#### `tailwind.config.ts`
Should include:
- `darkMode: ["class"]`
- Content paths for `./index.html` and `./src/**/*.{js,ts,jsx,tsx}`
- Theme extensions
- `tailwindcss-animate` plugin

#### `postcss.config.mjs`
```javascript
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwindcss,
    autoprefixer,
  ],
};
```

### 5. Start Development Server
```bash
npm run dev
```

You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 6. Open in Browser
Navigate to: `http://localhost:5173`

You should see the **Login Page**.

## 🔐 First Login

### Get Organization List
The login page will automatically fetch organizations from:
```
GET https://api.metrologydesk.com/api/v1/organizations
```

### Login Credentials
Use credentials provided by your system administrator:
1. Select your organization from the dropdown
2. Enter your email
3. Enter your password
4. Click "Sign In"

### What Happens on Login
1. POST request to `/auth/login` with credentials
2. Receive JWT token and user data
3. Token stored in secure cookie
4. Redirect to Dashboard
5. API calls now include authentication token

## 🏗️ Project Structure Overview

```
customerportal/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── ui/         # shadcn/ui components
│   │   └── ...         # Custom components
│   ├── contexts/       # React contexts (Auth, etc.)
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities and configs
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── types/          # TypeScript definitions
│   └── config/         # App configuration
├── .env                # Environment variables (create this)
├── .env.example        # Environment template
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── tailwind.config.ts  # Tailwind config
└── vite.config.ts      # Vite config
```

## 🚀 Available Scripts

### Development
```bash
npm run dev
```
Starts the development server with hot reload at `http://localhost:5173`

### Build
```bash
npm run build
```
Creates an optimized production build in the `dist/` folder

### Preview
```bash
npm run preview
```
Preview the production build locally

### Lint
```bash
npm run lint
```
Run ESLint to check code quality

## 🔍 Troubleshooting

### Issue: "Failed to fetch organizations"
**Solution:**
1. Check if backend API is running
2. Verify `VITE_API_BASE_URL` in `.env`
3. Check browser console for CORS errors
4. Test API directly: `curl https://api.metrologydesk.com/api/v1/organizations`

### Issue: Build fails with TypeScript errors
**Solution:**
1. Run `npm install` to ensure all dependencies are installed
2. Check for type import errors - use `import { type TypeName }`
3. Clear cache: `rm -rf node_modules dist .vite && npm install`

### Issue: Port 5173 already in use
**Solution:**
1. Kill the process using port 5173
2. Or specify a different port:
   ```bash
   npm run dev -- --port 3000
   ```

### Issue: Styles not loading
**Solution:**
1. Verify `tailwind.config.ts` exists
2. Check `postcss.config.mjs` exists
3. Ensure `@tailwind` directives are in `src/index.css`
4. Restart dev server

### Issue: Login successful but redirects to login
**Solution:**
1. Check browser cookies - should have `auth_token`
2. Verify token is not expired
3. Clear cookies and try again
4. Check browser console for errors

## 🎯 Next Steps

After successful setup:

1. **Explore the Dashboard**
   - View KPI cards
   - Check gauge distribution charts
   - Review upcoming calibrations

2. **Manage Gauges**
   - Navigate to Gauge List
   - Search and filter gauges
   - View gauge details

3. **Check History**
   - View calibration history
   - Download certificates
   - Track compliance

4. **Configure Settings**
   - Update profile
   - Configure notifications
   - Manage preferences

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🆘 Getting Help

If you encounter issues:
1. Check the browser console for errors
2. Review the Network tab for failed API calls
3. Check the terminal for build errors
4. Consult this documentation
5. Contact your system administrator

## 🔒 Security Notes

- Never commit `.env` file to version control
- Keep your authentication tokens secure
- Use HTTPS in production
- Regularly update dependencies
- Follow password best practices

## ✅ Verification Checklist

Before starting development, ensure:
- [ ] Node.js v18+ installed
- [ ] Dependencies installed (`node_modules` exists)
- [ ] `.env` file created with correct API URL
- [ ] Dev server starts without errors
- [ ] Login page loads
- [ ] Organizations dropdown populates
- [ ] Can successfully log in
- [ ] Dashboard displays data

---

**Ready to build! 🚀**



