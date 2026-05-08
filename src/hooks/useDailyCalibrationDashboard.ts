import { useQuery } from "@tanstack/react-query"
import { dashboardService } from "@/services/dashboard.service"

export function useDailyCalibrationDashboard(year: number, month: number) {
  return useQuery({
    queryKey: ["daily-calibration-dashboard", year, month],
    queryFn: () => dashboardService.getDailyCalibration({ year, month }),
    enabled: year > 0 && month >= 1 && month <= 12,
    staleTime: 1000 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
