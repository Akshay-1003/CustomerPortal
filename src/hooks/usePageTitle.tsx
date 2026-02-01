import { useEffect } from "react"
import { useLocation, useParams } from "react-router-dom"

const routeTitles: Record<string, string> = {
  "/": "Dashboard | Calibration Portal",
  "/gauge-list": "Gauge List | Calibration Portal",
  "/history": "History | Calibration Portal",
  "/calibration-certificates": "Calibration Certificates | Calibration Portal",
  "/analytics": "Analytics | Calibration Portal",
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

