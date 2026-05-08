import {
  AlertTriangle,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Info,
  Layers3,
  Target,
  Trophy,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  formatDashboardNumber,
  formatDashboardPercentage,
} from "@/lib/monthlyCalibrationDashboard"
import type { MonthlyCalibrationTotals } from "@/types/dashboard"

interface CalibrationKpiCardsProps {
  plannedOnly: boolean
  totals: MonthlyCalibrationTotals
}

interface KpiCardConfig {
  title: string
  value: string
  description: string
  icon: typeof CalendarRange
  iconClassName: string
  progress?: number
  progressClassName?: string
  note?: string
}

function formatAverage(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value)
}

function KpiCard({ title, value, description, icon: Icon, iconClassName, progress, progressClassName, note }: KpiCardConfig) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className={cn("rounded-full p-2.5", iconClassName)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{description}</p>
        {typeof progress === "number" && (
          <div className="space-y-1.5">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", progressClassName)}
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-muted-foreground">Visual progress is capped at 100%.</div>
          </div>
        )}
        {note && <p className="text-[11px] leading-relaxed text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  )
}

export function CalibrationKpiCards({ plannedOnly, totals }: CalibrationKpiCardsProps) {
  const highestPlannedMonth = totals.highestPlannedMonth

  const plannedCards: KpiCardConfig[] = [
    {
      title: "Total Planned",
      value: formatDashboardNumber(totals.planned),
      description: "Total gauges scheduled for calibration in the selected year.",
      icon: CalendarRange,
      iconClassName: "bg-blue-50 text-blue-700",
    },
    {
      title: "Average Planned / Month",
      value: formatAverage(totals.averagePlannedPerMonth),
      description: "Average planned gauges across months that have a calibration plan.",
      icon: BarChart3,
      iconClassName: "bg-slate-100 text-slate-700",
    },
    {
      title: "Highest Planned Month",
      value: highestPlannedMonth ? formatDashboardNumber(highestPlannedMonth.planned) : "--",
      description: highestPlannedMonth
        ? `${highestPlannedMonth.monthLabel} has the highest planning load.`
        : "No planned month found for the selected year.",
      icon: Trophy,
      iconClassName: "bg-amber-50 text-amber-700",
    },
    {
      title: "Months With Plan",
      value: formatDashboardNumber(totals.monthsWithPlan),
      description: "Months carrying at least one planned calibration activity.",
      icon: Layers3,
      iconClassName: "bg-emerald-50 text-emerald-700",
    },
  ]

  const fullStatusCards: KpiCardConfig[] = [
    {
      title: "Total Planned",
      value: formatDashboardNumber(totals.planned),
      description: "Total gauges planned across the visible months.",
      icon: CalendarRange,
      iconClassName: "bg-blue-50 text-blue-700",
    },
    {
      title: "Total Completed",
      value: formatDashboardNumber(totals.completed),
      description: "Actual completed calibrations recorded in the selected year.",
      icon: CheckCircle2,
      iconClassName: "bg-emerald-50 text-emerald-700",
      note: totals.hasBacklogCompletion
        ? "Completed count may include backlog or earlier planned gauges."
        : undefined,
    },
    {
      title: "Total Pending",
      value: formatDashboardNumber(totals.pending),
      description: "Planned calibrations still awaiting completion.",
      icon: Clock3,
      iconClassName: "bg-amber-50 text-amber-700",
    },
    {
      title: "Total Overdue",
      value: formatDashboardNumber(totals.overdue),
      description: "Calibrations that have crossed the planned schedule.",
      icon: AlertTriangle,
      iconClassName: "bg-red-50 text-red-700",
    },
    {
      title: "Completion %",
      value: formatDashboardPercentage(totals.completionPercentage),
      description: "Completed divided by planned for the selected period.",
      icon: Target,
      iconClassName: "bg-emerald-50 text-emerald-700",
      progress: totals.completionPercentage,
      progressClassName: "bg-emerald-600",
    },
    {
      title: "Overdue %",
      value: formatDashboardPercentage(totals.overduePercentage),
      description: "Overdue divided by planned for the selected period.",
      icon: AlertTriangle,
      iconClassName: "bg-red-50 text-red-700",
      progress: totals.overduePercentage,
      progressClassName: "bg-red-600",
    },
  ]

  return (
    <TooltipProvider delayDuration={150}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {(plannedOnly ? plannedCards : fullStatusCards).map((card) => (
          <div key={card.title} className={cn(!plannedOnly && card.title === "Completion %" ? "2xl:col-span-1" : "")}>
            <KpiCard {...card} />
            {!plannedOnly && card.title === "Completion %" && totals.hasBacklogCompletion && (
              <div className="mt-2 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                <Info className="h-3.5 w-3.5 text-amber-600" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-left underline decoration-dotted underline-offset-4">
                      Completed value is above plan
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Completed count may include backlog or earlier planned gauges.
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        ))}
      </div>
    </TooltipProvider>
  )
}
