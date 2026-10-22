import { apiService } from "./api.service"
import { authService } from "./auth.service"
import type {
  DailyCalibrationApiResponse,
  MonthlyCalibrationApiResponse,
} from "@/types/dashboard"
import type { ThroughGroup } from "@/config/throughFilters"

export const dashboardService = {
  async getMonthlyCalibration(params: { year: number; throughGroup?: Exclude<ThroughGroup, "all"> }): Promise<MonthlyCalibrationApiResponse> {
    const clientOrgId = authService.getOrganizationId()

    return apiService.get<MonthlyCalibrationApiResponse>(
      "/dashboard/gauges/monthly-calibration",
      {
        params: {
          year: params.year,
          client_org_id: clientOrgId || undefined,
          through_group: params.throughGroup,
        },
      }
    )
  },

  async getDailyCalibration(params: {
    year: number
    month: number
    throughGroup?: Exclude<ThroughGroup, "all">
  }): Promise<DailyCalibrationApiResponse> {
    const clientOrgId = authService.getOrganizationId()

    return apiService.get<DailyCalibrationApiResponse>(
      "/dashboard/gauges/daily-calibration",
      {
        params: {
          year: params.year,
          month: params.month,
          client_org_id: clientOrgId || undefined,
          through_group: params.throughGroup,
        },
      }
    )
  },
}
