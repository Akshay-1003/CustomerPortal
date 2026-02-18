import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { DashboardLayout } from "./components/DashboardLayout"
import { Dashboard } from "./pages/Dashboard"
import GaugeListPage from "./pages/GaugeList"
import { History } from "./pages/History"
import { CalibrationCertificates } from "./pages/CalibrationCertificates"
import { GaugeDetail } from "./pages/GaugeDetail"
import { Analytics } from "./pages/Analytics"
import { Settings } from "./pages/Settings"
import { Login } from "./pages/Login"
import InwardPage from "./pages/transactions/InwardPage"
import OutwardPage from "./pages/transactions/OutwardPage"
import { HistoryCardPage } from "./pages/reports/HistoryCard"
import { HistoryCardDetailPage } from "./pages/reports/HistoryCardDetail"
import { CalibrationDueReportPage } from "./pages/reports/CalibrationDueReport"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { usePageTitle } from "./hooks/usePageTitle"
import { useAuth } from "./contexts/AuthContext"

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
        <Route index element={<Dashboard />} />
        <Route path="gauge-list" element={<GaugeListPage />} />
        <Route path="gauge/:id" element={<GaugeDetail />} />
        <Route path="gauge-list/history/:id" element={<HistoryCardDetailPage />} />
        <Route path="history" element={<History />} />
        <Route path="reports/history-card" element={<HistoryCardPage />} />
        <Route path="reports/history-card/:id" element={<HistoryCardDetailPage />} />
        <Route path="reports/calibration-due-report" element={<CalibrationDueReportPage />} />
        <Route path="calibration-certificates" element={<CalibrationCertificates />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="transactions/inward" element={<InwardPage />} />
        <Route path="transactions/outward" element={<OutwardPage />} />
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
