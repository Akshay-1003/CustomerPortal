import { useQuery } from "@tanstack/react-query"
import { authService } from "@/services/auth.service"
import { dashboardService } from "@/services/dashboard.service"

export function useMonthlyCalibrationDashboard(year: number) {
  const organizationId = authService.getOrganizationId()

  return useQuery({
    queryKey: ["monthly-calibration-dashboard", organizationId, year],
    queryFn: () => dashboardService.getMonthlyCalibration({ year }),
    enabled: !!organizationId && year > 0,
    staleTime: 1000 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
