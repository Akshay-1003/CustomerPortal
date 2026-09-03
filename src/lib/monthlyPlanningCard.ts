export type MonthlyPlanningCardStatus = "planned" | "in_progress" | "completed" | "attention"
export type MonthlyPlanningVisualState = "neutral" | "completed" | "pending" | "overdue" | "future" | "current"

type MonthlyPlanningStatusInput = {
  planned: number
  completed: number
  pending: number
  overdue: number
}

export function getMonthlyPlanningStatus({
  planned,
  completed,
  pending,
  overdue,
}: MonthlyPlanningStatusInput): MonthlyPlanningCardStatus {
  if (overdue > 0) return "attention"
  if (planned > 0 && completed >= planned && pending === 0) return "completed"
  if (completed > 0) return "in_progress"
  return "planned"
}

type MonthlyPlanningVisualStateInput = MonthlyPlanningStatusInput & {
  month: string
  year: number
}

export function getMonthlyPlanningVisualState({
  month,
  year,
  planned,
  completed,
  pending,
  overdue,
}: MonthlyPlanningVisualStateInput): MonthlyPlanningVisualState {
  const currentDate = new Date()
  const monthDate = new Date(`${month} 1, ${year}`)
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const isValidMonth = !Number.isNaN(monthDate.getTime())
  const isFuture = isValidMonth && monthDate > currentMonthStart
  const isCurrent = isValidMonth && monthDate.getFullYear() === currentDate.getFullYear() && monthDate.getMonth() === currentDate.getMonth()
  const isPast = isValidMonth && monthDate < currentMonthStart

  if (overdue > 0 || (isPast && planned > completed)) return "overdue"
  if (planned > 0 && completed >= planned && pending === 0) return "completed"
  if (isFuture) return "future"
  if (pending > 0) return "pending"
  if (isCurrent) return "current"
  return "neutral"
}
