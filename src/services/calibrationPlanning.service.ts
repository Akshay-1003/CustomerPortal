import { apiService } from "@/services/api.service"
import type {
  CalibrationPlanningDetail,
  CalibrationPlanningDetailParams,
  CalibrationPlanningDetailResponse,
  CalibrationPlanningOverview,
} from "@/types/calibrationPlanning"

const PAGE_LIMIT = 500

function hasValidWeeklyPlan(month: CalibrationPlanningOverview["months"][number]): boolean {
  const weeklyPlan = month.weekly_plan
  return Array.isArray(weeklyPlan)
    && weeklyPlan.length === 4
    && weeklyPlan.every((count) => Number.isInteger(count) && count >= 0)
    && weeklyPlan.reduce((total, count) => total + count, 0) === month.planned
}

function getDueDateParts(value: string): { month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const month = Number(match[2])
  const day = Number(match[3])
  return month >= 1 && month <= 12 && day >= 1 && day <= 31 ? { month, day } : null
}

function buildWeeklyPlans(rows: CalibrationPlanningDetail[]): Map<number, number[]> {
  const weeklyPlans = new Map<number, number[]>()

  for (const row of rows) {
    const dueDate = getDueDateParts(row.due_date)
    if (!dueDate) continue

    const plan = weeklyPlans.get(dueDate.month) ?? [0, 0, 0, 0]
    plan[Math.min(Math.floor((dueDate.day - 1) / 7), 3)] += 1
    weeklyPlans.set(dueDate.month, plan)
  }

  return weeklyPlans
}

export const calibrationPlanningService = {
  async getOverview(year: number): Promise<CalibrationPlanningOverview> {
    const overview = await apiService.get<CalibrationPlanningOverview>("/dashboard/gauges/calibration-planning", {
      params: { year },
    })

    if (overview.months.every(hasValidWeeklyPlan)) {
      return overview
    }

    const firstPage = await this.getDetails({ year, limit: PAGE_LIMIT })
    const additionalPages = Array.from(
      { length: Math.max(0, Math.ceil(firstPage.total / PAGE_LIMIT) - 1) },
      (_, index) => this.getDetails({ year, page: index + 1, limit: PAGE_LIMIT }),
    )
    const remainingPages = await Promise.all(additionalPages)
    const weeklyPlans = buildWeeklyPlans([
      ...firstPage.data,
      ...remainingPages.flatMap((page) => page.data),
    ])

    return {
      ...overview,
      months: overview.months.map((month) => ({
        ...month,
        weekly_plan: weeklyPlans.get(month.month) ?? [0, 0, 0, 0],
      })),
    }
  },

  getDetails({
    year,
    month,
    status,
    search,
    sortBy = "due_date",
    sortDirection = "asc",
    page = 0,
    limit = 25,
  }: CalibrationPlanningDetailParams) {
    return apiService.get<CalibrationPlanningDetailResponse>("/dashboard/gauges/calibration-planning/details", {
      params: {
        year,
        month,
        status,
        search: search?.trim() || undefined,
        sort_by: sortBy,
        sort_direction: sortDirection,
        page,
        limit,
      },
    })
  },
}
