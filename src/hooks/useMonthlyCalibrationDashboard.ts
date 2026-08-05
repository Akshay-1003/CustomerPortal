import { useQuery } from "@tanstack/react-query"
import { dashboardService } from "@/services/dashboard.service"

export function useMonthlyCalibrationDashboard(year: number) {
  return useQuery({
    queryKey: ["monthly-calibration-dashboard", year],
    queryFn: () => dashboardService.getMonthlyCalibration({ year }),
    staleTime: 1000 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
