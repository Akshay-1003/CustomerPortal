import { apiService } from "@/services/api.service"
import type {
  CalibrationPlanningDetailParams,
  CalibrationPlanningDetailResponse,
  CalibrationPlanningOverview,
} from "@/types/calibrationPlanning"

export const calibrationPlanningService = {
  getOverview(year: number) {
    return apiService.get<CalibrationPlanningOverview>("/dashboard/gauges/calibration-planning", {
      params: { year },
    })
  },

  getDetails({
    year,
    month,
    status,
    search,
    sortBy = "due_date",
    sortDirection = "asc",
    page = 0,
    limit = 25,
  }: CalibrationPlanningDetailParams) {
    return apiService.get<CalibrationPlanningDetailResponse>("/dashboard/gauges/calibration-planning/details", {
      params: {
        year,
        month,
        status,
        search: search?.trim() || undefined,
        sort_by: sortBy,
        sort_direction: sortDirection,
        page,
        limit,
      },
    })
  },
}
