export type MonthlyCalibrationApiResponse = Record<
  string,
  {
    planned: number
    completed?: number
    pending?: number
    overdue?: number
  }
>

export type DailyCalibrationApiResponse = Record<
  string,
  {
    planned: number
    completed?: number
    pending?: number
    overdue?: number
  }
>

export interface NormalizedMonthlyCalibrationDatum {
  monthLabel: string
  shortMonthLabel: string
  monthIndex: number
  planned: number
  completed: number
  pending: number
  overdue: number
  hasStatusFields: boolean
  shareOfAnnualPlan: number
  completionPercentage: number
  overduePercentage: number
  completionProgress: number
  overdueProgress: number
}

export interface MonthlyCalibrationPercentages {
  completionPercentage: number
  overduePercentage: number
}

export interface HighestPlannedMonth {
  monthLabel: string
  planned: number
}

export interface MonthlyCalibrationTotals extends MonthlyCalibrationPercentages {
  planned: number
  completed: number
  pending: number
  overdue: number
  averagePlannedPerMonth: number
  monthsWithPlan: number
  highestPlannedMonth: HighestPlannedMonth | null
  hasBacklogCompletion: boolean
  hasDistributionData: boolean
}

export interface NormalizedDailyCalibrationDatum {
  dateKey: string
  dateLabel: string
  shortDateLabel: string
  weekdayLabel: string
  dayOfMonth: number
  planned: number
  completed: number
  pending: number
  overdue: number
  totalActivity: number
  hasAnyActivity: boolean
  completionPercentage: number
  overduePercentage: number
}

export interface PeakDailyCalibrationDatum {
  dateKey: string
  dateLabel: string
  value: number
}

export interface DailyCalibrationTotals extends MonthlyCalibrationPercentages {
  planned: number
  completed: number
  pending: number
  overdue: number
  activeDays: number
  plannedDays: number
  overdueDays: number
  averageCompletedPerActiveDay: number
  peakCompletedDay: PeakDailyCalibrationDatum | null
  peakPlannedDay: PeakDailyCalibrationDatum | null
  peakOverdueDay: PeakDailyCalibrationDatum | null
  hasAnyActivity: boolean
}
