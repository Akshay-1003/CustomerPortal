import { apiService } from "./api.service"
import type {
  DailyCalibrationApiResponse,
  MonthlyCalibrationApiResponse,
} from "@/types/dashboard"

export const dashboardService = {
  async getMonthlyCalibration(params: {
    year: number
    plannedOnly: boolean
  }): Promise<MonthlyCalibrationApiResponse> {
    return apiService.get<MonthlyCalibrationApiResponse>(
      "/dashboard/gauges/monthly-calibration",
      {
        params: {
          year: params.year,
          planned_only: params.plannedOnly,
        },
      }
    )
  },

  async getDailyCalibration(params: {
    year: number
    month: number
  }): Promise<DailyCalibrationApiResponse> {
    return apiService.get<DailyCalibrationApiResponse>(
      "/dashboard/gauges/daily-calibration",
      {
        params: {
          year: params.year,
          month: params.month,
        },
      }
    )
  },
}
