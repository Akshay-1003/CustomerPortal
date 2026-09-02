export type CalibrationPlanningStatus = "completed" | "due_soon" | "upcoming" | "overdue"

export type CalibrationPlanningCounts = {
  total_planned: number
  completed: number
  due_soon: number
  upcoming: number
  overdue: number
}

export type CalibrationPlanningMonth = {
  month: number
  planned: number
  completed: number
  due_soon: number
  upcoming: number
  overdue: number
}

export type CalibrationPlanningOverview = {
  year: number
  summary: CalibrationPlanningCounts
  months: CalibrationPlanningMonth[]
}

export type CalibrationPlanningDetail = {
  id: string
  gauge_id: string
  gauge_name: string
  identification_number?: string | null
  calibration_frequency: number
  calibration_frequency_unit: string
  frequency_label: string
  last_calibration_date: string
  due_date: string
  completed_date?: string | null
  days_remaining?: number | null
  status: CalibrationPlanningStatus
}

export type CalibrationPlanningDetailResponse = {
  year: number
  month?: number | null
  summary: CalibrationPlanningCounts
  data: CalibrationPlanningDetail[]
  total: number
  page: number
  limit: number
}

export type CalibrationPlanningDetailParams = {
  year: number
  month?: number
  status?: CalibrationPlanningStatus
  search?: string
  sortBy?: "due_date" | "gauge_name" | "identification_number" | "status"
  sortDirection?: "asc" | "desc"
  page?: number
  limit?: number
}
