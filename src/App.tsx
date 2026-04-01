import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import { DashboardLayout } from "./components/DashboardLayout"
import { Login } from "./pages/Login"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { usePageTitle } from "./hooks/usePageTitle"
import { useAuth } from "./contexts/AuthContext"
import { Skeleton } from "./components/ui/skeleton"
import { Card, CardContent, CardHeader } from "./components/ui/card"

// Lazy load page components for better code splitting
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })))
const GaugeListPage = lazy(() => import("./pages/GaugeList"))
const History = lazy(() => import("./pages/History").then(m => ({ default: m.History })))
const CalibrationCertificates = lazy(() => import("./pages/CalibrationCertificates").then(m => ({ default: m.CalibrationCertificates })))
const GaugeDetail = lazy(() => import("./pages/GaugeDetail").then(m => ({ default: m.GaugeDetail })))
const Analytics = lazy(() => import("./pages/Analytics").then(m => ({ default: m.Analytics })))
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })))
const InwardPage = lazy(() => import("./pages/transactions/InwardPage"))
const OutwardPage = lazy(() => import("./pages/transactions/OutwardPage"))
const HistoryCardPage = lazy(() => import("./pages/reports/HistoryCard").then(m => ({ default: m.HistoryCardPage })))
const HistoryCardDetailPage = lazy(() => import("./pages/reports/HistoryCardDetail").then(m => ({ default: m.HistoryCardDetailPage })))
const CalibrationDueReportPage = lazy(() => import("./pages/reports/CalibrationDueReport").then(m => ({ default: m.CalibrationDueReportPage })))
const GaugeMasterPage = lazy(() => import("./pages/GaugeMaster"))
const FormatNumberPage = lazy(() => import("./pages/FormatNumber"))

// Loading fallback component
const PageLoader = () => (
  <Card className="w-full">
    <CardHeader>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="aspect-video w-full" />
    </CardContent>
  </Card>
)

function AppContent() {
  usePageTitle()
  const { isAuthenticated } = useAuth()
  
  return (
    <Routes>
      {/* Public Route */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }   
      >
        <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route path="gauge-list" element={<Suspense fallback={<PageLoader />}><GaugeListPage /></Suspense>} />
        <Route path="gauge-list/create" element={<Suspense fallback={<PageLoader />}><GaugeMasterPage /></Suspense>} />
        <Route path="gauge-management/format-numbers" element={<Suspense fallback={<PageLoader />}><FormatNumberPage /></Suspense>} />
        <Route path="gauge/:id" element={<Suspense fallback={<PageLoader />}><GaugeDetail /></Suspense>} />
        <Route path="gauge-list/history/:id" element={<Suspense fallback={<PageLoader />}><HistoryCardDetailPage /></Suspense>} />
        <Route path="history" element={<Suspense fallback={<PageLoader />}><History /></Suspense>} />
        <Route path="reports/history-card" element={<Suspense fallback={<PageLoader />}><HistoryCardPage /></Suspense>} />
        <Route path="reports/history-card/:id" element={<Suspense fallback={<PageLoader />}><HistoryCardDetailPage /></Suspense>} />
        <Route path="reports/calibration-due-report" element={<Suspense fallback={<PageLoader />}><CalibrationDueReportPage /></Suspense>} />
        <Route path="calibration-certificates" element={<Suspense fallback={<PageLoader />}><CalibrationCertificates /></Suspense>} />
        <Route path="analytics" element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
        <Route path="transactions/inward" element={<Suspense fallback={<PageLoader />}><InwardPage /></Suspense>} />
        <Route path="transactions/outward" element={<Suspense fallback={<PageLoader />}><OutwardPage /></Suspense>} />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
