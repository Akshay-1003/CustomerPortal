import { useQuery } from "@tanstack/react-query"
import { authService } from "@/services/auth.service"
import { calibrationPlanningService } from "@/services/calibrationPlanning.service"
import type { CalibrationPlanningDetailParams } from "@/types/calibrationPlanning"
import type { ThroughGroup } from "@/hooks/useHemdeepThroughFilter"

export function useCalibrationPlanningOverview(year: number, throughGroup?: Exclude<ThroughGroup, "all">) {
  const organizationId = authService.getOrganizationId()

  return useQuery({
    queryKey: ["calibration-planning", "overview", organizationId, year, throughGroup],
    queryFn: () => calibrationPlanningService.getOverview(year, throughGroup),
    enabled: Boolean(organizationId),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

export function useCalibrationPlanningDetails(params: CalibrationPlanningDetailParams, enabled: boolean, throughGroup?: Exclude<ThroughGroup, "all">) {
  const organizationId = authService.getOrganizationId()

  return useQuery({
    queryKey: ["calibration-planning", "details", organizationId, params, throughGroup],
    queryFn: () => calibrationPlanningService.getDetails({ ...params, throughGroup }),
    enabled: Boolean(organizationId) && enabled,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
    retry: 1,
  })
}
