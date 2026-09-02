import type { CalibrationPlanningDetail, CalibrationPlanningStatus } from "@/types/calibrationPlanning"
import type { CalibrationDueReportPrintRow } from "@/components/reports/CalibrationDueReportPrintPreview"

export const CALIBRATION_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export const CALIBRATION_STATUS_LABELS: Record<CalibrationPlanningStatus, string> = {
  completed: "Completed",
  due_soon: "Due Soon",
  upcoming: "Pending / Scheduled",
  overdue: "Overdue",
}

export function formatCalibrationDate(value?: string | null) {
  if (!value) return "N/A"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-GB")
}

export function formatPlanningDays(row: CalibrationPlanningDetail) {
  if (row.status === "completed") {
    if (row.completed_date && typeof row.days_remaining === "number" && row.days_remaining > 0) {
      return `Completed ${row.days_remaining} day${row.days_remaining === 1 ? "" : "s"} late`
    }
    return "Completed"
  }

  const days = row.days_remaining ?? 0
  if (row.status === "overdue") {
    const overdueDays = Math.abs(days)
    return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`
  }
  if (days === 0) return "Due today"
  return `${days} day${days === 1 ? "" : "s"} remaining`
}

export function toCalibrationPlanningPrintRows(rows: CalibrationPlanningDetail[]): CalibrationDueReportPrintRow[] {
  return rows.map((row, index) => ({
    serialNo: index + 1,
    gaugeName: row.gauge_name,
    identificationNo: row.identification_number || "N/A",
    calibrationFrequency: row.frequency_label,
    lastCalibrationDate: formatCalibrationDate(row.last_calibration_date),
    dueDate: formatCalibrationDate(row.due_date),
    daysWindow: formatPlanningDays(row),
    currentStatus: CALIBRATION_STATUS_LABELS[row.status],
  }))
}
