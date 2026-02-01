# ⚡ Quick Start Guide

Get the Calibration Portal running in 5 minutes!

## 🎯 Prerequisites
- Node.js v18+ installed
- Terminal/Command line access

## 🚀 Steps

### 1. Navigate to Project
```bash
cd /Users/akshayprakashpatil/project/cportal/customerportal
```

### 2. Create Environment File

Create `.env` file with this content:
```env
VITE_API_BASE_URL=http://35.172.1.180:5000/api/v1
```

**Quick command:**
```bash
echo "VITE_API_BASE_URL=http://35.172.1.180:5000/api/v1" > .env
```

### 3. Install & Run

**First time:**
```bash
npm install && npm run dev
```

**Subsequent runs:**
```bash
npm run dev
```

### 4. Open Application
Navigate to: **http://localhost:5173** (or the port shown in terminal)

### 5. Login
1. Select your organization from dropdown
2. Enter email and password
3. Click "Sign In"

---

## 🎨 What You'll See

### Login Page
- Professional gradient background
- Organization selector
- Email/password fields
- Loading states

### Dashboard
- 5 KPI cards (Total, Active, Inactive, Due, Overdue)
- Gauge type distribution chart
- Status breakdown pie chart
- Upcoming calibrations list
- Critical alerts

### Gauge List
- Advanced searchable table
- Filters (status, type)
- Pagination
- Export to Excel
- Row actions

### History
- Select gauge from dropdown
- View calibration records
- Download certificates
- Paginated results

---

## 📱 Features

✅ Real-time data from API  
✅ Search & filter  
✅ Dark mode toggle  
✅ Mobile responsive  
✅ Export to Excel  
✅ Professional UI  

---

## 🔧 Troubleshooting

**Issue: Port in use**
```bash
# Kill existing process or use different port
npm run dev -- --port 3000
```

**Issue: API connection fails**
```bash
# Check .env file exists
cat .env

# Should output:
# VITE_API_BASE_URL=http://35.172.1.180:5000/api/v1
```

**Issue: Organizations not loading**
- Ensure backend API is running
- Check browser console for errors
- Verify network connection

---

## 📖 Full Documentation

- **README.md** - Complete documentation
- **SETUP.md** - Detailed setup guide
- **IMPLEMENTATION_SUMMARY.md** - Technical details

---

**That's it! You're ready to go! 🎉**





