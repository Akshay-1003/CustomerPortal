import {
  AlertTriangle,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Layers3,
  Trophy,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDashboardNumber } from "@/lib/monthlyCalibrationDashboard"
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
  note?: string
}

function formatAverage(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value)
}

function KpiCard({ title, value, description, icon: Icon, iconClassName, note }: KpiCardConfig) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className={`rounded-full p-2.5 ${iconClassName}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{description}</p>
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
      description: "API-reported calibrations completed in the selected year.",
      icon: CheckCircle2,
      iconClassName: "bg-emerald-50 text-emerald-700",
      note: totals.hasBacklogCompletion
        ? "Completed is higher than planned because the API appears to include backlog or gauges planned in other periods."
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
      description: "API-reported overdue calibrations for the selected year.",
      icon: AlertTriangle,
      iconClassName: "bg-red-50 text-red-700",
      note: totals.hasOverdueEqualToPlan
        ? "The current API response is returning overdue equal to planned for this selected year."
        : undefined,
    },
  ]

  return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(plannedOnly ? plannedCards : fullStatusCards).map((card) => (
          <div key={card.title}>
            <KpiCard {...card} />
          </div>
        ))}
      </div>
  )
}
