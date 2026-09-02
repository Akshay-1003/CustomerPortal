import { useQuery } from "@tanstack/react-query"
import { authService } from "@/services/auth.service"
import { calibrationPlanningService } from "@/services/calibrationPlanning.service"
import type { CalibrationPlanningDetailParams } from "@/types/calibrationPlanning"

export function useCalibrationPlanningOverview(year: number) {
  const organizationId = authService.getOrganizationId()

  return useQuery({
    queryKey: ["calibration-planning", "overview", organizationId, year],
    queryFn: () => calibrationPlanningService.getOverview(year),
    enabled: Boolean(organizationId),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

export function useCalibrationPlanningDetails(params: CalibrationPlanningDetailParams, enabled: boolean) {
  const organizationId = authService.getOrganizationId()

  return useQuery({
    queryKey: ["calibration-planning", "details", organizationId, params],
    queryFn: () => calibrationPlanningService.getDetails(params),
    enabled: Boolean(organizationId) && enabled,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
    retry: 1,
  })
}
