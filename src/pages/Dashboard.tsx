import { useMemo } from "react"
import { Link } from "react-router-dom"
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, Clock, Loader2, TrendingUp, TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAllGauges } from "@/hooks/useGauges"
import {
  analyzeOverdueGauges,
  calculateCalibrationDue,
  calculateCalibrationSummary,
  formatCalibrationDate,
  formatDaysUntilDue,
} from "@/lib/calibrationUtils"
import type { Gauge } from "@/types/api"

function DashboardMetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
}: {
  title: string
  value: string | number
  description: string
  icon: typeof CalendarDays
  iconClassName: string
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className={`rounded-full p-2.5 ${iconClassName}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function GaugeListPreview({
  title,
  description,
  gauges,
  emptyText,
}: {
  title: string
  description: string
  gauges: Gauge[]
  emptyText: string
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {gauges.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="space-y-3">
            {gauges.map((gauge) => {
              const dueInfo = calculateCalibrationDue(gauge)

              return (
                <div
                  key={gauge.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{gauge.master_gauge}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {gauge.identification_number || "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {formatCalibrationDate(dueInfo.dueDate)}
                    </p>
                  </div>
                  <Badge variant="outline">{formatDaysUntilDue(dueInfo.daysUntilDue)}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const currentYear = new Date().getFullYear()
  const { data: gauges = [], isLoading, isError, error } = useAllGauges()

  const summary = useMemo(() => {
    if (gauges.length === 0) return null
    return calculateCalibrationSummary(gauges)
  }, [gauges])

  const overdueAnalysis = useMemo(() => {
    if (gauges.length === 0) return null
    return analyzeOverdueGauges(gauges, currentYear)
  }, [gauges, currentYear])

  const upcomingGauges = useMemo(() => {
    return gauges
      .map((gauge) => ({ gauge, dueInfo: calculateCalibrationDue(gauge) }))
      .filter(({ dueInfo }) => !dueInfo.isOverdue && !dueInfo.isCompleted && dueInfo.daysUntilDue !== null)
      .filter(({ dueInfo }) => (dueInfo.daysUntilDue ?? 0) <= 30)
      .sort((left, right) => (left.dueInfo.daysUntilDue ?? 0) - (right.dueInfo.daysUntilDue ?? 0))
      .slice(0, 5)
      .map(({ gauge }) => gauge)
  }, [gauges])

  const criticalOverdue = useMemo(() => {
    return (overdueAnalysis?.criticalOverdue ?? [])
      .slice()
      .sort((left, right) => {
        const leftDays = Math.abs(calculateCalibrationDue(left).daysUntilDue ?? 0)
        const rightDays = Math.abs(calculateCalibrationDue(right).daysUntilDue ?? 0)
        return rightDays - leftDays
      })
      .slice(0, 5)
  }, [overdueAnalysis])

  if (isLoading) {
    return (
      <Card className="w-full border-border/70 shadow-sm">
        <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Loading dashboard</h2>
            <p className="text-sm text-muted-foreground">Preparing your calibration summary and alerts.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unable to load dashboard</AlertTitle>
        <AlertDescription>
          {(error as Error)?.message || "Failed to load dashboard summary."}
        </AlertDescription>
      </Alert>
    )
  }

  if (!summary) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            A quick summary of calibration health, alerts, and next actions.
          </p>
        </div>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">No gauges available</h2>
              <p className="text-sm text-muted-foreground">
                Add gauges first, then use Calibration Overview and Monthly Planning for deeper tracking.
              </p>
            </div>
            <Button asChild>
              <Link to="/gauge-list">Open Gauge List</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <TrendingUp className="h-3.5 w-3.5" />
          Executive Summary
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            Monitor high-level calibration health, urgent alerts, and quick next actions without entering
            planning or operational detail.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-border/70 shadow-sm xl:col-span-1">
          <CardHeader>
            <CardTitle>Navigation Guide</CardTitle>
            <CardDescription>Each calibration menu now has a distinct purpose.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-sm font-medium">Dashboard</p>
              <p className="mt-1 text-xs text-muted-foreground">Summary, alerts, and quick links.</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-sm font-medium">Calibration Overview</p>
              <p className="mt-1 text-xs text-muted-foreground">Operational status, due gauges, and month-wise execution.</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-sm font-medium">Monthly Planning</p>
              <p className="mt-1 text-xs text-muted-foreground">Year/month planning and date-wise planning activity.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Open the right page for the right job.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Button asChild variant="outline" className="justify-between">
              <Link to="/analytics">
                Calibration Overview
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link to="/monthly-planning">
                Monthly Planning
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link to="/gauge-list">
                Gauge List
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DashboardMetricCard
          title="Total Gauges"
          value={summary.totalGauges}
          description="All gauges currently available in your organization."
          icon={CalendarDays}
          iconClassName="bg-blue-50 text-blue-700"
        />
        <DashboardMetricCard
          title="Due This Month"
          value={summary.totalDueThisMonth}
          description="Gauges expected to be calibrated in the current month."
          icon={Clock}
          iconClassName="bg-slate-100 text-slate-700"
        />
        <DashboardMetricCard
          title="Overdue"
          value={summary.totalOverdue}
          description="Gauges that have already crossed their due date."
          icon={TriangleAlert}
          iconClassName="bg-red-50 text-red-700"
        />
        <DashboardMetricCard
          title="Completed This Month"
          value={summary.totalCompletedThisMonth}
          description="Gauges already completed during the current month."
          icon={CheckCircle2}
          iconClassName="bg-emerald-50 text-emerald-700"
        />
        <DashboardMetricCard
          title="Upcoming 3 Months"
          value={summary.totalUpcomingNext3Months}
          description="Upcoming gauges that need attention soon."
          icon={TrendingUp}
          iconClassName="bg-amber-50 text-amber-700"
        />
      </div>

      {summary.oldestOverdueGauge.gauge ? (
        <Alert variant="destructive" className="border-2">
          <TriangleAlert className="h-5 w-5" />
          <AlertTitle>Priority Alert</AlertTitle>
          <AlertDescription>
            <span className="font-medium">{summary.oldestOverdueGauge.gauge.master_gauge}</span> (
            {summary.oldestOverdueGauge.gauge.identification_number}) is{" "}
            <span className="font-semibold">{summary.oldestOverdueGauge.daysPastDue} days overdue</span>.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <GaugeListPreview
          title="Critical Overdue Gauges"
          description="Most urgent overdue gauges that need immediate operational attention."
          gauges={criticalOverdue}
          emptyText="No critical overdue gauges were found."
        />
        <GaugeListPreview
          title="Due Soon"
          description="Upcoming calibrations in the next 30 days to help teams prepare in advance."
          gauges={upcomingGauges}
          emptyText="No gauges are due in the next 30 days."
        />
      </div>
    </div>
  )
}
