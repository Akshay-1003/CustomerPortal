import { useQuery } from "@tanstack/react-query"
import { dashboardService } from "@/services/dashboard.service"

export function useMonthlyCalibrationDashboard(year: number, plannedOnly: boolean) {
  return useQuery({
    queryKey: ["monthly-calibration-dashboard", year, plannedOnly],
    queryFn: () => dashboardService.getMonthlyCalibration({ year, plannedOnly }),
    staleTime: 1000 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
