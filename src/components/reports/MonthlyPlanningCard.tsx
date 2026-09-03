import type { KeyboardEvent } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Gauge,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  getMonthlyPlanningStatus,
  getMonthlyPlanningVisualState,
  type MonthlyPlanningCardStatus,
  type MonthlyPlanningVisualState,
} from "@/lib/monthlyPlanningCard"
import { cn } from "@/lib/utils"

export type MonthlyPlanningCardVariant = "compact" | "detailed"

type MonthlyPlanningCardProps = {
  month: string
  year: number
  planned: number
  completed: number
  pending?: number
  overdue: number
  weeklyPlan?: number[]
  status?: MonthlyPlanningCardStatus
  variant?: MonthlyPlanningCardVariant
  onViewPlan: () => void
}

type MetricProps = {
  label: string
  value: number
  Icon: LucideIcon
  valueClassName: string
  iconClassName: string
  className?: string
}

const statusStyles: Record<MonthlyPlanningCardStatus, { label: string; className: string }> = {
  planned: {
    label: "Planned",
    className: "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]",
  },
  in_progress: {
    label: "In progress",
    className: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
  },
  completed: {
    label: "Completed",
    className: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
  },
  attention: {
    label: "Attention",
    className: "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
  },
}

const visualStyles: Record<MonthlyPlanningVisualState, {
  card: string
  header: string
  headerBorder: string
  calendarBorder: string
  calendarMonth: string
  calendarIcon: string
  totalBadge: string
  progress: string
  summary: string
}> = {
  neutral: {
    card: "border-[#dce4ed] bg-white",
    header: "bg-[#fafcff]",
    headerBorder: "border-[#e7edf4]",
    calendarBorder: "border-[#dce4ed]",
    calendarMonth: "bg-[#64748b]",
    calendarIcon: "text-[#40536d]",
    totalBadge: "border-[#d7e0ea] bg-white text-[#52627d]",
    progress: "bg-[#94a3b8]",
    summary: "text-[#627089]",
  },
  completed: {
    card: "border-[#b7e6c9] bg-white",
    header: "bg-[#f2fcf6]",
    headerBorder: "border-[#d2f1dd]",
    calendarBorder: "border-[#a9dfbf]",
    calendarMonth: "bg-[#168566]",
    calendarIcon: "text-[#13795b]",
    totalBadge: "border-[#a9dfbf] bg-white text-[#13795b]",
    progress: "bg-[#168566]",
    summary: "text-[#3d715f]",
  },
  pending: {
    card: "border-[#f6cf99] bg-white",
    header: "bg-[#fff9f0]",
    headerBorder: "border-[#f7e0bd]",
    calendarBorder: "border-[#f2c67f]",
    calendarMonth: "bg-[#e87813]",
    calendarIcon: "text-[#b85f0d]",
    totalBadge: "border-[#f2c67f] bg-white text-[#b85f0d]",
    progress: "bg-[#e87813]",
    summary: "text-[#8d5a22]",
  },
  overdue: {
    card: "border-[#f0b5b5] bg-white",
    header: "bg-[#fff6f6]",
    headerBorder: "border-[#f8d3d3]",
    calendarBorder: "border-[#edabab]",
    calendarMonth: "bg-[#dc3d3d]",
    calendarIcon: "text-[#bd3030]",
    totalBadge: "border-[#edabab] bg-white text-[#bd3030]",
    progress: "bg-[#dc3d3d]",
    summary: "text-[#9c4646]",
  },
  future: {
    card: "border-[#bfd5fb] bg-[#fcfdff] opacity-95",
    header: "bg-[#f4f8ff]",
    headerBorder: "border-[#d9e6fb]",
    calendarBorder: "border-[#a8c7f5]",
    calendarMonth: "bg-[#2563eb]",
    calendarIcon: "text-[#1d4ed8]",
    totalBadge: "border-[#a8c7f5] bg-white text-[#1d4ed8]",
    progress: "bg-[#2563eb]",
    summary: "text-[#4d6693]",
  },
  current: {
    card: "border-[#7ca8f8] bg-white ring-1 ring-[#c8dcff]",
    header: "bg-[#f3f7ff]",
    headerBorder: "border-[#d3e2ff]",
    calendarBorder: "border-[#8fb7fa]",
    calendarMonth: "bg-[#1d4ed8]",
    calendarIcon: "text-[#1d4ed8]",
    totalBadge: "border-[#8fb7fa] bg-white text-[#1d4ed8]",
    progress: "bg-[#1d4ed8]",
    summary: "text-[#34578d]",
  },
}

function Metric({ label, value, Icon, valueClassName, iconClassName, className }: MetricProps) {
  return (
    <div className={cn("flex min-w-0 flex-col items-center px-2 first:pl-0 last:pr-0 sm:px-3 sm:border-r sm:border-[#e2e8f0] sm:last:border-r-0", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} aria-label={`${label}: ${value.toLocaleString()}`} className="inline-flex cursor-help rounded-sm p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]">
            <Icon className={cn("h-5 w-5 shrink-0", iconClassName)} aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{label}: {value.toLocaleString()}</TooltipContent>
      </Tooltip>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", valueClassName)}>{value.toLocaleString()}</p>
    </div>
  )
}

function normalizeWeeklyPlan(weeklyPlan: number[] | undefined) {
  return Array.from({ length: 4 }, (_, index) => Math.max(0, Math.round(weeklyPlan?.[index] ?? 0)))
}

function WorkloadBlocks({ value, max }: { value: number; max: number }) {
  const segments = 10
  const filled = max > 0 ? Math.max(value > 0 ? 1 : 0, Math.round((value / max) * segments)) : 0

  return (
    <span className="grid grid-cols-10 gap-1" aria-hidden="true">
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 rounded-sm",
            index < filled ? "bg-[#f6ae4c]" : "bg-[#f6ead8]"
          )}
        />
      ))}
    </span>
  )
}

export function MonthlyPlanningCard({
  month,
  year,
  planned,
  completed,
  pending: pendingProp,
  overdue,
  weeklyPlan,
  status: statusProp,
  variant = "compact",
  onViewPlan,
}: MonthlyPlanningCardProps) {
  const pending = pendingProp ?? Math.max(planned - completed - overdue, 0)
  const completionPercentage = planned > 0 ? Math.round((completed / planned) * 100) : 0
  const status = statusProp ?? getMonthlyPlanningStatus({ planned, completed, pending, overdue })
  const statusStyle = statusStyles[status]
  const visualState = getMonthlyPlanningVisualState({ month, year, planned, completed, pending, overdue })
  const visualStyle = visualStyles[visualState]
  const weeklyCounts = normalizeWeeklyPlan(weeklyPlan)
  const weeklyTotal = weeklyCounts.reduce((total, count) => total + count, 0)
  const weeklyTotalMatches = weeklyTotal === planned
  const maximumWeeklyCount = Math.max(...weeklyCounts, 0)
  const hasPlan = planned > 0
  const isDetailed = variant === "detailed"
  const monthDate = new Date(`${month} 1, ${year}`)
  const currentDate = new Date()
  const isCurrentMonth = !Number.isNaN(monthDate.getTime())
    && monthDate.getFullYear() === currentDate.getFullYear()
    && monthDate.getMonth() === currentDate.getMonth()

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onViewPlan()
    }
  }

  return (
    <Card
      tabIndex={0}
      aria-label={`View ${month} ${year} calibration plan`}
      className={cn(
        "group cursor-pointer overflow-hidden text-[#102445] shadow-[0_4px_14px_rgba(15,35,65,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-100 hover:shadow-[0_10px_22px_rgba(15,35,65,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2",
        visualStyle.card,
        isCurrentMonth && "shadow-[0_8px_20px_rgba(37,99,235,0.14)]",
        isDetailed ? "rounded-2xl" : "rounded-xl"
      )}
      onClick={onViewPlan}
      onKeyDown={handleCardKeyDown}
    >
      <div className={cn("border-b", visualStyle.header, visualStyle.headerBorder, isDetailed ? "p-5 sm:p-6" : "p-4")}>
        <div className="flex items-start gap-3">
          <div className={cn("shrink-0 overflow-hidden rounded-lg border bg-white text-center shadow-sm", visualStyle.calendarBorder, isDetailed ? "w-14" : "w-11")}>
            <div className={cn("font-semibold tracking-wide text-white", visualStyle.calendarMonth, isDetailed ? "py-1 text-xs" : "py-0.5 text-[10px]")}>{month.slice(0, 3).toUpperCase()}</div>
            <CalendarDays className={cn("mx-auto", visualStyle.calendarIcon, isDetailed ? "my-2 h-6 w-6" : "my-1.5 h-5 w-5")} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={cn("truncate font-semibold text-[#102445]", isDetailed ? "text-2xl" : "text-lg")}>{month}</h2>
              {hasPlan && <Badge variant="outline" className={cn("uppercase tracking-[0.08em]", statusStyle.className)}>{statusStyle.label}</Badge>}
            </div>
            <p className={cn("mt-1 text-[#60708a]", isDetailed ? "text-sm" : "text-xs")}>{hasPlan ? "Monthly calibration schedule" : "No calibrations scheduled"}</p>
          </div>
          <Badge variant="outline" className={cn("shrink-0 font-semibold", visualStyle.totalBadge, isDetailed ? "gap-1.5 px-3 py-1 text-sm" : "gap-1 px-2 py-0.5 text-xs")}>
            <Gauge className={isDetailed ? "h-4 w-4" : "h-3.5 w-3.5"} />
            <span className="whitespace-nowrap">{planned.toLocaleString()} gauges</span>
          </Badge>
        </div>
      </div>

      <CardContent className={cn(isDetailed ? "space-y-5 p-5 sm:p-6" : "space-y-4 p-4")}>
        <TooltipProvider delayDuration={200}>
          <div className={cn("grid grid-cols-2 gap-y-3 sm:grid-cols-4 sm:gap-y-0", !isDetailed && "text-sm")}>
            <Metric label="Planned" value={planned} Icon={CalendarDays} iconClassName="text-[#2563eb]" valueClassName="text-[#1d4ed8]" />
            <Metric label="Completed" value={completed} Icon={CheckCircle2} iconClassName="text-[#168566]" valueClassName="text-[#13795b]" className="sm:pl-3" />
            <Metric label="Pending" value={pending} Icon={Clock3} iconClassName="text-[#d97706]" valueClassName="text-[#c25c08]" className="sm:pl-3" />
            <Metric label="Overdue" value={overdue} Icon={AlertTriangle} iconClassName="text-[#dc2626]" valueClassName="text-[#c62828]" className="sm:pl-3" />
          </div>
        </TooltipProvider>

        {hasPlan && (
          <div className={cn("rounded-lg border border-[#e4e9ef] bg-[#fffefd]", isDetailed ? "p-4" : "p-3")}>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
              {weeklyCounts.map((count, index) => (
                <div key={index} className={cn("min-w-0", index > 0 && "sm:border-l sm:border-[#e1e7ee] sm:pl-3")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#18345b]">W{index + 1}</span>
                    {isDetailed && <span className="text-xs text-[#66758d]">{count.toLocaleString()} planned</span>}
                  </div>
                  <div className="mt-2"><WorkloadBlocks value={count} max={maximumWeeklyCount} /></div>
                  {!isDetailed && <p className="mt-1 text-[11px] text-[#66758d]">{count.toLocaleString()} planned</p>}
                </div>
              ))}
            </div>
            {!weeklyTotalMatches && (
              <p className="mt-3 text-xs font-medium text-[#b45309]" role="status">
                Weekly schedule totals {weeklyTotal.toLocaleString()}; the monthly plan is {planned.toLocaleString()}.
              </p>
            )}
          </div>
        )}

        <div className={cn("gap-3", isDetailed ? "grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" : "space-y-3")}>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-[#344560]">Completion</span>
              <span className="shrink-0 font-semibold text-[#102445]">{completionPercentage}% completed</span>
            </div>
            <Progress value={completionPercentage} className="h-2 bg-[#e9eef4]" indicatorClassName={visualStyle.progress} aria-label={`${month} completion: ${completionPercentage}%`} />
          </div>
          {isDetailed && (
            <Button
              type="button"
              className="w-full bg-[#98b7fa] font-semibold text-white hover:bg-[#1d4ed8] focus-visible:ring-[#2563eb] sm:w-auto"
              onClick={(event) => {
                event.stopPropagation()
                onViewPlan()
              }}
            >
              View Plan <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className={cn("flex min-w-0 items-center gap-2 border-t border-[#e9eef3] pt-3 text-xs", visualStyle.summary)}>
          <ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 leading-4">
            {hasPlan
              ? `${planned.toLocaleString()} calibration${planned === 1 ? "" : "s"} scheduled - ${overdue > 0 || pending > 0 ? "Action required" : "On track"}`
              : "No gauges planned for this month"}
          </span>
          {!isDetailed && (
            <Button
              type="button"
              size="sm"
              className="h-9 shrink-0 bg-[#2563eb] px-3 font-semibold text-white hover:bg-[#1d4ed8] focus-visible:ring-[#2563eb]"
              onClick={(event) => {
                event.stopPropagation()
                onViewPlan()
              }}
            >
              View Plan <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function MonthlyPlanningCardSkeleton({ variant = "compact" }: { variant?: MonthlyPlanningCardVariant }) {
  const isDetailed = variant === "detailed"

  return (
    <Card className={cn("overflow-hidden border-[#dce4ed] bg-white shadow-none", isDetailed ? "rounded-2xl" : "rounded-xl")} aria-label="Loading monthly calibration plan">
      <div className={cn("border-b border-[#f0e4d2] bg-[#fffaf3]", isDetailed ? "p-5 sm:p-6" : "p-4")}>
        <div className="flex items-center gap-3"><Skeleton className={isDetailed ? "h-14 w-14" : "h-11 w-11"} /><div className="space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-3 w-44" /></div></div>
      </div>
      <CardContent className={cn("space-y-4", isDetailed ? "p-5 sm:p-6" : "p-4")}>
        <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-12" />)}</div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}
