import { apiService } from "./api.service"
import { authService } from "./auth.service"
import type {
  DailyCalibrationApiResponse,
  MonthlyCalibrationApiResponse,
} from "@/types/dashboard"

export const dashboardService = {
  async getMonthlyCalibration(params: { year: number }): Promise<MonthlyCalibrationApiResponse> {
    const clientOrgId = authService.getOrganizationId()

    return apiService.get<MonthlyCalibrationApiResponse>(
      "/dashboard/gauges/monthly-calibration",
      {
        params: {
          year: params.year,
          client_org_id: clientOrgId || undefined,
        },
      }
    )
  },

  async getDailyCalibration(params: {
    year: number
    month: number
  }): Promise<DailyCalibrationApiResponse> {
    const clientOrgId = authService.getOrganizationId()

    return apiService.get<DailyCalibrationApiResponse>(
      "/dashboard/gauges/daily-calibration",
      {
        params: {
          year: params.year,
          month: params.month,
          client_org_id: clientOrgId || undefined,
        },
      }
    )
  },
}
