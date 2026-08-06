import { useQuery } from "@tanstack/react-query"
import { authService } from "@/services/auth.service"
import { dashboardService } from "@/services/dashboard.service"

export function useDailyCalibrationDashboard(year: number, month: number) {
  const organizationId = authService.getOrganizationId()

  return useQuery({
    queryKey: ["daily-calibration-dashboard", organizationId, year, month],
    queryFn: () => dashboardService.getDailyCalibration({ year, month }),
    enabled: !!organizationId && year > 0 && month >= 1 && month <= 12,
    staleTime: 1000 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
