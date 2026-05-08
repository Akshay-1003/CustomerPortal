import type {
  MonthlyCalibrationApiResponse,
  MonthlyCalibrationPercentages,
  MonthlyCalibrationTotals,
  NormalizedMonthlyCalibrationDatum,
} from "@/types/dashboard"

interface MonthMeta {
  aliases: string[]
  label: string
  shortLabel: string
  monthIndex: number
}

const MONTHS: MonthMeta[] = [
  { aliases: ["january", "jan"], label: "January", shortLabel: "Jan", monthIndex: 0 },
  { aliases: ["february", "feb"], label: "February", shortLabel: "Feb", monthIndex: 1 },
  { aliases: ["march", "mar"], label: "March", shortLabel: "Mar", monthIndex: 2 },
  { aliases: ["april", "apr"], label: "April", shortLabel: "Apr", monthIndex: 3 },
  { aliases: ["may"], label: "May", shortLabel: "May", monthIndex: 4 },
  { aliases: ["june", "jun"], label: "June", shortLabel: "Jun", monthIndex: 5 },
  { aliases: ["july", "jul"], label: "July", shortLabel: "Jul", monthIndex: 6 },
  { aliases: ["august", "aug"], label: "August", shortLabel: "Aug", monthIndex: 7 },
  { aliases: ["september", "sep", "sept"], label: "September", shortLabel: "Sep", monthIndex: 8 },
  { aliases: ["october", "oct"], label: "October", shortLabel: "Oct", monthIndex: 9 },
  { aliases: ["november", "nov"], label: "November", shortLabel: "Nov", monthIndex: 10 },
  { aliases: ["december", "dec"], label: "December", shortLabel: "Dec", monthIndex: 11 },
]

export const CALIBRATION_CHART_COLORS = {
  planned: "#2563eb",
  completed: "#16a34a",
  pending: "#d97706",
  overdue: "#dc2626",
} as const

function toSafeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function resolveMonthMeta(monthLabel: string) {
  const normalizedLabel = monthLabel.trim().toLowerCase()
  return MONTHS.find((month) => month.aliases.includes(normalizedLabel)) ?? null
}

export function sortMonths<T extends { monthIndex: number; monthLabel: string }>(months: T[]): T[] {
  return [...months].sort((left, right) => {
    if (left.monthIndex === right.monthIndex) {
      return left.monthLabel.localeCompare(right.monthLabel)
    }
    return left.monthIndex - right.monthIndex
  })
}

export function calculatePercentages(
  planned: number,
  completed: number,
  overdue: number
): MonthlyCalibrationPercentages {
  return {
    completionPercentage: planned > 0 ? (completed / planned) * 100 : 0,
    overduePercentage: planned > 0 ? (overdue / planned) * 100 : 0,
  }
}

export function normalizeMonthlyCalibrationResponse(
  response: MonthlyCalibrationApiResponse | null | undefined
): NormalizedMonthlyCalibrationDatum[] {
  if (!response || Object.keys(response).length === 0) {
    return []
  }

  const normalizedRows = Object.entries(response).map(([monthKey, rawValues], index) => {
    const monthMeta = resolveMonthMeta(monthKey)
    const planned = toSafeNumber(rawValues?.planned)
    const completed = toSafeNumber(rawValues?.completed)
    const pending = toSafeNumber(rawValues?.pending)
    const overdue = toSafeNumber(rawValues?.overdue)
    const percentages = calculatePercentages(planned, completed, overdue)

    return {
      monthLabel: monthMeta?.label ?? monthKey,
      shortMonthLabel: monthMeta?.shortLabel ?? monthKey.slice(0, 3),
      monthIndex: monthMeta?.monthIndex ?? MONTHS.length + index,
      planned,
      completed,
      pending,
      overdue,
      hasStatusFields:
        rawValues != null &&
        (Object.prototype.hasOwnProperty.call(rawValues, "completed") ||
          Object.prototype.hasOwnProperty.call(rawValues, "pending") ||
          Object.prototype.hasOwnProperty.call(rawValues, "overdue")),
      shareOfAnnualPlan: 0,
      completionPercentage: percentages.completionPercentage,
      overduePercentage: percentages.overduePercentage,
      completionProgress: Math.min(percentages.completionPercentage, 100),
      overdueProgress: Math.min(percentages.overduePercentage, 100),
    }
  })

  const sortedRows = sortMonths(normalizedRows)
  const totalPlanned = sortedRows.reduce((sum, month) => sum + month.planned, 0)

  return sortedRows.map((month) => ({
    ...month,
    shareOfAnnualPlan: totalPlanned > 0 ? (month.planned / totalPlanned) * 100 : 0,
  }))
}

export function calculateTotals(
  monthlyData: NormalizedMonthlyCalibrationDatum[]
): MonthlyCalibrationTotals {
  const planned = monthlyData.reduce((sum, month) => sum + month.planned, 0)
  const completed = monthlyData.reduce((sum, month) => sum + month.completed, 0)
  const pending = monthlyData.reduce((sum, month) => sum + month.pending, 0)
  const overdue = monthlyData.reduce((sum, month) => sum + month.overdue, 0)
  const monthsWithPlan = monthlyData.filter((month) => month.planned > 0).length
  const highestPlannedMonth =
    monthlyData.length > 0
      ? monthlyData.reduce((highest, current) => {
          if (!highest || current.planned > highest.planned) {
            return {
              monthLabel: current.monthLabel,
              planned: current.planned,
            }
          }
          return highest
        }, null as MonthlyCalibrationTotals["highestPlannedMonth"])
      : null

  return {
    planned,
    completed,
    pending,
    overdue,
    averagePlannedPerMonth: monthsWithPlan > 0 ? planned / monthsWithPlan : 0,
    monthsWithPlan,
    highestPlannedMonth,
    hasBacklogCompletion: completed > planned,
    hasDistributionData: completed > 0 || pending > 0 || overdue > 0,
    ...calculatePercentages(planned, completed, overdue),
  }
}

export function formatDashboardNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDashboardPercentage(value: number) {
  return `${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value)}%`
}
