import { useQuery } from "@tanstack/react-query"
import { authService } from "@/services/auth.service"
import { dashboardService } from "@/services/dashboard.service"
import type { ThroughGroup } from "@/config/throughFilters"

export function useMonthlyCalibrationDashboard(year: number, throughGroup?: Exclude<ThroughGroup, "all">) {
  const organizationId = authService.getOrganizationId()

  return useQuery({
    queryKey: ["monthly-calibration-dashboard", organizationId, year, throughGroup],
    queryFn: () => dashboardService.getMonthlyCalibration({ year, throughGroup }),
    enabled: !!organizationId && year > 0,
    staleTime: 1000 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
