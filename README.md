# Calibration Portal - Industrial Gauge Management System

A professional, enterprise-grade web application for managing industrial gauge calibration, monitoring, and compliance tracking.

## 🏭 Features

### Authentication & Authorization
- ✅ Organization-based login system
- ✅ Secure token-based authentication (JWT)
- ✅ Protected routes and session management
- ✅ User profile and logout functionality

### Dashboard & Monitoring
- 📊 Real-time KPI cards (Total Gauges, Active, Inactive, Due, Overdue)
- 📈 Interactive data visualizations (Bar charts, Pie charts)
- ⚠️ Critical alerts for overdue calibrations
- 📅 Upcoming calibration timeline
- 🔄 Live data updates with TanStack Query

### Gauge Management
- 📋 Advanced data table with search, filter, and sort
- 🏷️ Status badges and visual indicators
- ✅ Bulk selection and actions
- 📥 Export to Excel functionality
- 🔍 Global search across gauge properties
- 📱 Fully responsive design

### History & Tracking
- 📜 Complete calibration history per gauge
- 👤 Performed by tracking
- ✅ Pass/Fail/Pending status
- 📄 Certificate download links
- 🔄 Real-time updates

### UI/UX
- 🎨 Modern, clean industrial design
- 🌓 Dark mode support
- 📱 Mobile-first responsive design
- ♿ Accessible components (shadcn/ui)
- ⚡ Fast loading with proper loading states
- ❌ Comprehensive error handling
- 📭 Empty state designs

## 🛠️ Tech Stack

### Core
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server

### State Management & Data Fetching
- **TanStack Query v5** - Server state management, caching, background refetching
- **Axios** - HTTP client
- **React Router v6** - Routing

### UI Components & Styling
- **shadcn/ui** - Component library
- **Tailwind CSS v3** - Utility-first CSS
- **Radix UI** - Unstyled accessible components
- **Lucide React** - Icons
- **Recharts** - Data visualization

### Forms & Validation
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Utilities
- **js-cookie** - Cookie management
- **XLSX** - Excel export

## 📁 Project Structure

```
customerportal/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── AppSidebar.tsx  # Navigation sidebar
│   │   ├── DashboardLayout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ...
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useGauges.ts
│   │   ├── useOrganizations.ts
│   │   └── ...
│   ├── lib/                # Utilities
│   │   ├── queryClient.ts  # TanStack Query config
│   │   └── utils.ts
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── GaugeList.tsx
│   │   ├── GaugeDetail.tsx
│   │   ├── History.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   ├── services/           # API services
│   │   ├── api.service.ts  # Centralized API client
│   │   ├── auth.service.ts
│   │   └── gauge.service.ts
│   ├── types/              # TypeScript types
│   │   └── api.ts
│   ├── config/             # Configuration
│   │   └── env.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env                    # Environment variables
├── .env.example            # Environment template
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Clone the repository**
   ```bash
   cd /path/to/cportal/customerportal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://35.172.1.180:5000/api/v1
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## 🔐 API Integration

### Base URL
```
http://35.172.1.180:5000/api/v1
```

### Endpoints

#### Authentication
- `POST /auth/login` - User login
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "organization_id": "org-id"
  }
  ```

#### Organizations
- `GET /organizations` - Get all organizations

#### Gauges
- `GET /gauge/organization/{organization_id}/gauges` - Get gauges by organization
- `GET /gauge/{gauge_id}` - Get single gauge details
- `GET /gauge/{gauge_id}/history` - Get gauge calibration history

## 🎯 Key Features Implemented

### 1. Authentication Flow
- Organization selection dropdown
- Email/password login
- JWT token storage in cookies
- Auto-redirect on authentication
- Protected routes
- Logout functionality

### 2. API Architecture
- Centralized API service with Axios
- Request/response interceptors
- Automatic token attachment
- 401 handling and redirect
- Type-safe API calls

### 3. State Management
- TanStack Query for server state
- Automatic caching (5 min stale time)
- Background refetching
- Query invalidation
- Loading and error states

### 4. Table Features
- Search across multiple fields
- Multi-filter (status, type)
- Column sorting
- Pagination
- Bulk selection
- Row actions menu
- Excel export
- Responsive design

### 5. Professional UI States
- Loading skeletons
- Empty states with actions
- Error states with retry
- No search results state
- Responsive layouts

## 🎨 Design System

### Colors
- Primary: Blue (`hsl(var(--primary))`)
- Destructive: Red (for errors/overdue)
- Success: Green (for active/pass)
- Warning: Amber (for due soon)

### Typography
- Headings: Bold, tracking-tight
- Body: Base font with muted variants
- Small text: `text-sm` and `text-xs`

### Components
All components follow shadcn/ui patterns with Radix UI primitives for accessibility.

## 🔧 Configuration

### TanStack Query
```typescript
// src/lib/queryClient.ts
staleTime: 5 minutes
cacheTime: 10 minutes
retry: 1
refetchOnWindowFocus: false
```

### Tailwind CSS
- Dark mode: class-based
- Content: `./index.html`, `./src/**/*.{js,ts,jsx,tsx}`
- Plugins: `tailwindcss-animate`

## 📊 Data Flow

```
User Action
    ↓
React Component
    ↓
TanStack Query Hook (useGauges, etc.)
    ↓
Service Layer (gaugeService, authService)
    ↓
API Service (centralized axios)
    ↓
Backend API
    ↓
Response → Cache → UI Update
```

## 🐛 Troubleshooting

### Build Errors
If you encounter TypeScript errors, ensure all type imports use `type`:
```typescript
import { type MyType } from './types'
```

### API Connection Issues
1. Check the `.env` file exists with correct `VITE_API_BASE_URL`
2. Verify the API server is running
3. Check browser console for CORS errors
4. Ensure organization data is available

### Authentication Issues
1. Clear cookies and try again
2. Verify organization_id is being sent
3. Check if token is being stored
4. Review browser DevTools → Application → Cookies

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://35.172.1.180:5000/api/v1` |

## 🚀 Deployment

### Build Optimization
The app is optimized for production with:
- Code splitting
- Tree shaking
- Minification
- Asset optimization

### Recommended Hosting
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## 📄 License

Internal use only - Calibration Portal

## 👨‍💻 Development

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `App.tsx`
3. Add menu item in `AppSidebar.tsx`
4. Update breadcrumbs in `Breadcrumbs.tsx`

### Adding New API Endpoints
1. Add types in `src/types/api.ts`
2. Create service function in appropriate service file
3. Create custom hook in `src/hooks/`
4. Use hook in component

### Adding New Components
```bash
npx shadcn@latest add [component-name]
```

---

**Built with ❤️ for industrial excellence**
