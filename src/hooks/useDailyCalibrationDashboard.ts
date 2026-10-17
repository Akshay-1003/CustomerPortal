import { useQuery } from "@tanstack/react-query"
import { authService } from "@/services/auth.service"
import { dashboardService } from "@/services/dashboard.service"
import type { ThroughGroup } from "@/hooks/useHemdeepThroughFilter"

export function useDailyCalibrationDashboard(year: number, month: number, throughGroup?: Exclude<ThroughGroup, "all">) {
  const organizationId = authService.getOrganizationId()

  return useQuery({
    queryKey: ["daily-calibration-dashboard", organizationId, year, month, throughGroup],
    queryFn: () => dashboardService.getDailyCalibration({ year, month, throughGroup }),
    enabled: !!organizationId && year > 0 && month >= 1 && month <= 12,
    staleTime: 1000 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
