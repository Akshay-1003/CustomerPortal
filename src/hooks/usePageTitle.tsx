import { useEffect } from "react"
import { useLocation, useParams } from "react-router-dom"

const routeTitles: Record<string, string> = {
  "/": "Dashboard | Calibration Portal",
  "/gauge-list": "Gauge List | Calibration Portal",
  "/gauge-list/create": "Add Existing Gauge | Calibration Portal",
  "/gauge-management/format-numbers": "Format Numbers | Calibration Portal",
  "/reports/history-card": "History Card | Calibration Portal",
  "/reports/calibration-due-report": "Calibration Planning | Calibration Portal",
  "/history": "History | Calibration Portal",
  "/calibration-certificates": "Calibration Certificates | Calibration Portal",
  "/analytics": "Dashboard | Calibration Portal",
  "/dashboard": "Dashboard | Calibration Portal",
  "/monthly-planning": "Calibration Overview | Calibration Portal",
  "/calibration-overview": "Calibration Overview | Calibration Portal",
  "/gauge-life-prediction": "Gauge Life Prediction | Calibration Portal",
  "/settings": "Settings | Calibration Portal",
}

export function usePageTitle() {
  const location = useLocation()
  const params = useParams()

  useEffect(() => {
    let title = routeTitles[location.pathname]
    
    // Handle dynamic routes like /gauge/:id
    if (!title && location.pathname.startsWith("/gauge/")) {
      const gaugeId = params.id || "Details"
      title = `Gauge ${gaugeId} | Calibration Portal`
    }
    
    document.title = title || "Calibration Portal"
  }, [location.pathname, params])
}
