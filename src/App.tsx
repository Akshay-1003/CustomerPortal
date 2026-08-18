import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense, type ReactNode } from "react"
import { DashboardLayout } from "./components/DashboardLayout"
import { Login } from "./pages/Login"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { usePageTitle } from "./hooks/usePageTitle"
import { useAuth } from "./hooks/useAuth"
import { Skeleton } from "./components/ui/skeleton"
import { Card, CardContent, CardHeader } from "./components/ui/card"
import { Spinner } from "./components/ui/spinner"
import { NavigationFeedbackProvider } from "./contexts/NavigationFeedbackContext"
import { RequireCustomerPermission } from "./components/RequireCustomerPermission"
import type { CustomerPermissionModule, PermissionAction } from "./types/api"

// Lazy load page components for better code splitting
const GaugeListPage = lazy(() => import("./pages/GaugeList"))
const History = lazy(() => import("./pages/History").then(m => ({ default: m.History })))
const CalibrationCertificates = lazy(() => import("./pages/CalibrationCertificates").then(m => ({ default: m.CalibrationCertificates })))
const GaugeDetail = lazy(() => import("./pages/GaugeDetail").then(m => ({ default: m.GaugeDetail })))
const Analytics = lazy(() => import("./pages/Analytics").then(m => ({ default: m.Analytics })))
const MonthlyPlanningPage = lazy(() => import("./pages/MonthlyPlanning"))
const GaugeLifePredictionPage = lazy(() => import("./pages/gauge-health/GaugeLifePrediction").then(m => ({ default: m.GaugeLifePredictionPage })))
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })))
const InwardPage = lazy(() => import("./pages/transactions/InwardPage"))
const OutwardPage = lazy(() => import("./pages/transactions/OutwardPage"))
const HistoryCardPage = lazy(() => import("./pages/reports/HistoryCard").then(m => ({ default: m.HistoryCardPage })))
const HistoryCardDetailPage = lazy(() => import("./pages/reports/HistoryCardDetail").then(m => ({ default: m.HistoryCardDetailPage })))
const CalibrationDueReportPage = lazy(() => import("./pages/reports/CalibrationDueReport").then(m => ({ default: m.CalibrationDueReportPage })))
const GaugeMasterPage = lazy(() => import("./pages/GaugeMaster"))
const FormatNumberPage = lazy(() => import("./pages/FormatNumber"))
const NotificationsPage = lazy(() => import("./pages/Notifications").then(m => ({ default: m.Notifications })))

// Loading fallback component
const PageLoader = () => (
  <Card className="w-full border-border/70 shadow-sm">
    <CardHeader className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Spinner className="size-4 text-primary" />
        Loading page...
      </div>
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </CardContent>
  </Card>
)

const guardedPage = (
  module: CustomerPermissionModule,
  element: ReactNode,
  action: PermissionAction = "view"
) => (
  <RequireCustomerPermission module={module} action={action}>
    <Suspense fallback={<PageLoader />}>{element}</Suspense>
  </RequireCustomerPermission>
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
        <Route index element={guardedPage("customer_dashboard", <Analytics />)} />
        <Route path="gauge-list" element={guardedPage("customer_gauge_management", <GaugeListPage />)} />
        <Route path="gauge-list/create" element={guardedPage("customer_gauge_management", <GaugeMasterPage />, "edit")} />
        <Route path="gauge-management/format-numbers" element={guardedPage("customer_gauge_management", <FormatNumberPage />, "edit")} />
        <Route path="gauge/:id" element={guardedPage("customer_gauge_management", <GaugeDetail />)} />
        <Route path="gauge-list/history/:id" element={guardedPage("customer_reports", <HistoryCardDetailPage />)} />
        <Route path="history" element={guardedPage("customer_reports", <History />)} />
        <Route path="reports/history-card" element={guardedPage("customer_reports", <HistoryCardPage />)} />
        <Route path="reports/history-card/:id" element={guardedPage("customer_reports", <HistoryCardDetailPage />)} />
        <Route path="reports/calibration-due-report" element={guardedPage("customer_reports", <CalibrationDueReportPage />)} />
        <Route path="calibration-certificates" element={guardedPage("customer_calibration", <CalibrationCertificates />)} />
        <Route path="analytics" element={<Navigate to="/" replace />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="calibration-overview" element={guardedPage("customer_calibration", <MonthlyPlanningPage />)} />
        <Route path="monthly-planning" element={<Navigate to="/calibration-overview" replace />} />
        <Route path="gauge-life-prediction" element={guardedPage("customer_gauge_life_prediction", <GaugeLifePredictionPage />)} />
        <Route path="settings" element={guardedPage("customer_settings", <Settings />)} />
        <Route path="notifications" element={guardedPage("customer_notifications", <NotificationsPage />)} />
        <Route path="transactions/inward" element={guardedPage("customer_transactions", <InwardPage />)} />
        <Route path="transactions/outward" element={guardedPage("customer_transactions", <OutwardPage />)} />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <NavigationFeedbackProvider>
        <AppContent />
      </NavigationFeedbackProvider>
    </BrowserRouter>
  )
}

export default App
