import type {
  DailyCalibrationApiResponse,
  DailyCalibrationTotals,
  NormalizedDailyCalibrationDatum,
  PeakDailyCalibrationDatum,
} from "@/types/dashboard"
import { calculatePercentages } from "@/lib/monthlyCalibrationDashboard"

export const DASHBOARD_MONTH_OPTIONS = [
  { value: 1, label: "January", shortLabel: "Jan" },
  { value: 2, label: "February", shortLabel: "Feb" },
  { value: 3, label: "March", shortLabel: "Mar" },
  { value: 4, label: "April", shortLabel: "Apr" },
  { value: 5, label: "May", shortLabel: "May" },
  { value: 6, label: "June", shortLabel: "Jun" },
  { value: 7, label: "July", shortLabel: "Jul" },
  { value: 8, label: "August", shortLabel: "Aug" },
  { value: 9, label: "September", shortLabel: "Sep" },
  { value: 10, label: "October", shortLabel: "Oct" },
  { value: 11, label: "November", shortLabel: "Nov" },
  { value: 12, label: "December", shortLabel: "Dec" },
] as const

function toSafeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function parseDateKey(dateKey: string) {
  const [yearString, monthString, dayString] = dateKey.split("-")
  const year = Number(yearString)
  const month = Number(monthString)
  const day = Number(dayString)

  return new Date(year, month - 1, day)
}

function getPeakDay(
  dailyData: NormalizedDailyCalibrationDatum[],
  accessor: (day: NormalizedDailyCalibrationDatum) => number
): PeakDailyCalibrationDatum | null {
  if (dailyData.length === 0) return null

  return dailyData.reduce<PeakDailyCalibrationDatum | null>((peak, current) => {
    const currentValue = accessor(current)
    if (!peak || currentValue > peak.value) {
      return {
        dateKey: current.dateKey,
        dateLabel: current.dateLabel,
        value: currentValue,
      }
    }
    return peak
  }, null)
}

export function normalizeDailyCalibrationResponse(
  response: DailyCalibrationApiResponse | null | undefined
): NormalizedDailyCalibrationDatum[] {
  if (!response || Object.keys(response).length === 0) {
    return []
  }

  return Object.entries(response)
    .map(([dateKey, rawValues]) => {
      const date = parseDateKey(dateKey)
      const planned = toSafeNumber(rawValues?.planned)
      const completed = toSafeNumber(rawValues?.completed)
      const pending = toSafeNumber(rawValues?.pending)
      const overdue = toSafeNumber(rawValues?.overdue)
      const percentages = calculatePercentages(planned, completed, overdue)

      return {
        dateKey,
        dateLabel: date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        shortDateLabel: date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        weekdayLabel: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        dayOfMonth: date.getDate(),
        planned,
        completed,
        pending,
        overdue,
        totalActivity: planned + completed + pending + overdue,
        hasAnyActivity: planned > 0 || completed > 0 || pending > 0 || overdue > 0,
        completionPercentage: percentages.completionPercentage,
        overduePercentage: percentages.overduePercentage,
      }
    })
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey))
}

export function calculateDailyTotals(
  dailyData: NormalizedDailyCalibrationDatum[]
): DailyCalibrationTotals {
  const planned = dailyData.reduce((sum, day) => sum + day.planned, 0)
  const completed = dailyData.reduce((sum, day) => sum + day.completed, 0)
  const pending = dailyData.reduce((sum, day) => sum + day.pending, 0)
  const overdue = dailyData.reduce((sum, day) => sum + day.overdue, 0)
  const activeDays = dailyData.filter((day) => day.hasAnyActivity).length
  const plannedDays = dailyData.filter((day) => day.planned > 0).length
  const overdueDays = dailyData.filter((day) => day.overdue > 0).length

  return {
    planned,
    completed,
    pending,
    overdue,
    activeDays,
    plannedDays,
    overdueDays,
    averageCompletedPerActiveDay: activeDays > 0 ? completed / activeDays : 0,
    peakCompletedDay: getPeakDay(dailyData, (day) => day.completed),
    peakPlannedDay: getPeakDay(dailyData, (day) => day.planned),
    peakOverdueDay: getPeakDay(dailyData, (day) => day.overdue),
    hasAnyActivity: activeDays > 0,
    ...calculatePercentages(planned, completed, overdue),
  }
}
