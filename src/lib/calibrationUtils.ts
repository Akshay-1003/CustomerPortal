import { differenceInDays, format, isValid, addMonths, isBefore, isAfter, isSameMonth, parseISO } from 'date-fns'
import type { Gauge } from '@/types/api'

/* =====================================================
   CALIBRATION STATUS TYPES
   ===================================================== */

export type CalibrationStatus = 'completed' | 'pending' | 'overdue'

export interface CalibrationDueInfo {
  status: CalibrationStatus
  dueDate: Date | null
  daysUntilDue: number | null
  isOverdue: boolean
  isPending: boolean
  isCompleted: boolean
}

export interface MonthlyStats {
  month: number // 0-11 (Jan-Dec)
  year: number
  monthName: string
  total: number
  completed: number
  pending: number
  overdue: number
  gauges: Gauge[]
}

export interface CalibrationSummary {
  totalGauges: number
  totalDueThisMonth: number
  totalOverdue: number
  totalCompletedThisMonth: number
  totalUpcomingNext3Months: number
  oldestOverdueGauge: {
    gauge: Gauge | null
    daysPastDue: number
  }
}

/* =====================================================
   DATE UTILITIES
   ===================================================== */

/**
 * Safely parse a date string to Date object
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null
  
  try {
    const parsed = parseISO(dateString)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Calculate next calibration date from certificate issue date and frequency
 */
export function calculateNextCalibrationDate(
  certificateIssueDate: string | null | undefined,
  frequency: number,
  frequencyUnit: string
): Date | null {
  const issueDate = parseDate(certificateIssueDate)
  if (!issueDate || !frequency) return null

  // Only support months for now (most common case)
  if (frequencyUnit === 'months') {
    return addMonths(issueDate, frequency)
  }

  return null
}

/* =====================================================
   CALIBRATION DUE CALCULATION
   ===================================================== */

/**
 * Calculate calibration due information for a gauge
 * 
 * Priority:
 * 1. Use next_calibration_date if available
 * 2. Calculate from certificate_issue_date + frequency if next_calibration_date missing
 * 3. Return null if insufficient data
 */
export function calculateCalibrationDue(gauge: Gauge): CalibrationDueInfo {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to start of day

  // Try to get due date from gauge
  let dueDate: Date | null = null

  // Priority 1: Use next_calibration_date
  if (gauge.next_calibration_date) {
    dueDate = parseDate(gauge.next_calibration_date)
  }

  // Priority 2: Calculate from certificate_issue_date + frequency
  if (!dueDate && gauge.certificate_issue_date && gauge.calibration_frequency) {
    dueDate = calculateNextCalibrationDate(
      gauge.certificate_issue_date,
      gauge.calibration_frequency,
      gauge.calibration_frequency_unit || 'months'
    )
  }

  // If no due date can be determined
  if (!dueDate) {
    return {
      status: 'pending',
      dueDate: null,
      daysUntilDue: null,
      isOverdue: false,
      isPending: true,
      isCompleted: false,
    }
  }

  // Calculate days until due (negative if overdue)
  const daysUntilDue = differenceInDays(dueDate, today)

  // Determine status
  let status: CalibrationStatus

  // Check if calibration is completed
  if (gauge.status === 'calibration_completed') {
    status = 'completed'
  } 
  // If due date has passed and not completed → overdue
  else if (isBefore(dueDate, today)) {
    status = 'overdue'
  } 
  // Otherwise → pending
  else {
    status = 'pending'
  }

  return {
    status,
    dueDate,
    daysUntilDue,
    isOverdue: status === 'overdue',
    isPending: status === 'pending',
    isCompleted: status === 'completed',
  }
}

/* =====================================================
   MONTH-WISE AGGREGATION
   ===================================================== */

/**
 * Get all months in a year (Jan-Dec)
 */
export function getMonthsInYear(year: number): MonthlyStats[] {
  const months: MonthlyStats[] = []
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  for (let month = 0; month < 12; month++) {
    months.push({
      month,
      year,
      monthName: monthNames[month],
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      gauges: [],
    })
  }

  return months
}

/**
 * Aggregate gauges into month-wise statistics for a given year
 */
export function aggregateGaugesByMonth(gauges: Gauge[], year: number): MonthlyStats[] {
  const monthlyStats = getMonthsInYear(year)

  gauges.forEach((gauge) => {
    const dueInfo = calculateCalibrationDue(gauge)

    // Skip gauges without due dates
    if (!dueInfo.dueDate) return

    // Check if due date falls in the target year
    const dueYear = dueInfo.dueDate.getFullYear()
    if (dueYear !== year) return

    // Get the month index (0-11)
    const monthIndex = dueInfo.dueDate.getMonth()

    // Add to the appropriate month
    const monthStat = monthlyStats[monthIndex]
    monthStat.total++
    monthStat.gauges.push(gauge)

    // Increment status counts
    if (dueInfo.isCompleted) {
      monthStat.completed++
    } else if (dueInfo.isOverdue) {
      monthStat.overdue++
    } else if (dueInfo.isPending) {
      monthStat.pending++
    }
  })

  return monthlyStats
}

/* =====================================================
   SUMMARY CALCULATIONS
   ===================================================== */

/**
 * Calculate high-level summary statistics
 */
export function calculateCalibrationSummary(gauges: Gauge[]): CalibrationSummary {
  const today = new Date()
  const threeMonthsFromNow = addMonths(today, 3)

  let totalDueThisMonth = 0
  let totalOverdue = 0
  let totalCompletedThisMonth = 0
  let totalUpcomingNext3Months = 0
  let oldestOverdueGauge: { gauge: Gauge | null; daysPastDue: number } = {
    gauge: null,
    daysPastDue: 0,
  }

  gauges.forEach((gauge) => {
    const dueInfo = calculateCalibrationDue(gauge)

    if (!dueInfo.dueDate) return

    // Check if due this month
    if (isSameMonth(dueInfo.dueDate, today)) {
      totalDueThisMonth++

      if (dueInfo.isCompleted) {
        totalCompletedThisMonth++
      }
    }

    // Check if overdue
    if (dueInfo.isOverdue) {
      totalOverdue++

      const daysPastDue = Math.abs(dueInfo.daysUntilDue || 0)
      if (daysPastDue > oldestOverdueGauge.daysPastDue) {
        oldestOverdueGauge = {
          gauge,
          daysPastDue,
        }
      }
    }

    // Check if upcoming in next 3 months (and not overdue)
    if (
      !dueInfo.isOverdue &&
      !dueInfo.isCompleted &&
      isAfter(dueInfo.dueDate, today) &&
      isBefore(dueInfo.dueDate, threeMonthsFromNow)
    ) {
      totalUpcomingNext3Months++
    }
  })

  return {
    totalGauges: gauges.length,
    totalDueThisMonth,
    totalOverdue,
    totalCompletedThisMonth,
    totalUpcomingNext3Months,
    oldestOverdueGauge,
  }
}

/* =====================================================
   OVERDUE ANALYSIS
   ===================================================== */

export interface OverdueStats {
  totalOverdue: number
  overdueByMonth: MonthlyStats[]
  criticalOverdue: Gauge[] // Overdue by more than 30 days
}

/**
 * Analyze overdue gauges in detail
 */
export function analyzeOverdueGauges(gauges: Gauge[], year: number): OverdueStats {
  const monthlyStats = getMonthsInYear(year)
  const criticalOverdue: Gauge[] = []
  let totalOverdue = 0

  gauges.forEach((gauge) => {
    const dueInfo = calculateCalibrationDue(gauge)

    if (!dueInfo.isOverdue || !dueInfo.dueDate) return

    totalOverdue++

    // Check if critically overdue (more than 30 days)
    if (dueInfo.daysUntilDue && Math.abs(dueInfo.daysUntilDue) > 30) {
      criticalOverdue.push(gauge)
    }

    // Categorize by original due month
    const dueYear = dueInfo.dueDate.getFullYear()
    if (dueYear !== year) return

    const monthIndex = dueInfo.dueDate.getMonth()
    const monthStat = monthlyStats[monthIndex]

    monthStat.overdue++
    monthStat.total++
    monthStat.gauges.push(gauge)
  })

  return {
    totalOverdue,
    overdueByMonth: monthlyStats.filter((m) => m.overdue > 0),
    criticalOverdue,
  }
}

/* =====================================================
   FORMATTING UTILITIES
   ===================================================== */

/**
 * Format a date for display
 */
export function formatCalibrationDate(date: Date | null): string {
  if (!date) return 'N/A'
  return format(date, 'MMM dd, yyyy')
}

/**
 * Format days until due for display
 */
export function formatDaysUntilDue(days: number | null): string {
  if (days === null) return 'N/A'
  
  if (days < 0) {
    return `${Math.abs(days)} days overdue`
  } else if (days === 0) {
    return 'Due today'
  } else if (days === 1) {
    return '1 day remaining'
  } else {
    return `${days} days remaining`
  }
}

/**
 * Get status color for badges
 */
export function getStatusColor(status: CalibrationStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500 hover:bg-green-600'
    case 'pending':
      return 'bg-blue-500 hover:bg-blue-600'
    case 'overdue':
      return 'bg-red-500 hover:bg-red-600'
    default:
      return 'bg-gray-500 hover:bg-gray-600'
  }
}

