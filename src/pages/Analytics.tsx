import { useMemo, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Cpu,
  Loader2,
  TrendingUp,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAllGauges } from "@/hooks/useGauges"
import { useMonthlyCalibrationDashboard } from "@/hooks/useMonthlyCalibrationDashboard"
import { analyzeOverdueGauges, calculateCalibrationDue, formatDaysUntilDue } from "@/lib/calibrationUtils"
import { calculateTotals, formatDashboardNumber, normalizeMonthlyCalibrationResponse } from "@/lib/monthlyCalibrationDashboard"

function DashboardMetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  valueClassName,
}: {
  title: string
  value: string | number
  description: string
  icon: typeof CalendarRange
  iconClassName: string
  valueClassName?: string
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`text-2xl font-semibold tracking-tight ${valueClassName || ""}`}>{value}</div>
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

export function Analytics() {
  const today = new Date()
  const currentYear = today.getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const yearOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => currentYear - 3 + index)
  }, [currentYear])

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
  } = useMonthlyCalibrationDashboard(selectedYear)

  const {
    data: gaugeItems = [],
    isLoading: isGaugeLoading,
    isError: isGaugeError,
    error: gaugeError,
  } = useAllGauges()

  const monthlyData = useMemo(() => normalizeMonthlyCalibrationResponse(dashboardData), [dashboardData])
  const totals = useMemo(() => calculateTotals(monthlyData), [monthlyData])

  const overdueAnalysis = useMemo(() => {
    if (gaugeItems.length === 0) return null
    return analyzeOverdueGauges(gaugeItems, selectedYear)
  }, [gaugeItems, selectedYear])

  const isLoading = isDashboardLoading || isGaugeLoading
  const isError = isDashboardError || isGaugeError
  const error = dashboardError || gaugeError
  const isEmpty = !isLoading && monthlyData.length === 0

  if (isLoading) {
    return (
      <div className="space-y-6 w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor calibration health, selected-year progress, and urgent workload in one view.
            </p>
          </div>
        </div>
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Loading Dashboard</h3>
              <p className="mt-1 text-sm text-muted-foreground">Preparing the selected year summary...</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6 w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor calibration health, selected-year progress, and urgent workload in one view.
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription className="mt-2">
            {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              (error as Error)?.message ||
              "Failed to load dashboard data."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="space-y-6 w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor calibration health, selected-year progress, and urgent workload in one view.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Year:</span>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((yearOption) => (
                  <SelectItem key={yearOption} value={yearOption.toString()}>
                    {yearOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <CalendarRange className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No calibration data found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No dashboard totals are available for the selected year {selectedYear}.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor calibration health, selected-year progress, and urgent workload in one view.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Year:</span>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((yearOption) => (
                <SelectItem key={yearOption} value={yearOption.toString()}>
                  {yearOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Total Planned"
          value={formatDashboardNumber(totals.planned)}
          description={`Total gauges planned for calibration in ${selectedYear}.`}
          icon={CalendarRange}
          iconClassName="bg-blue-50 text-blue-700"
        />
        <DashboardMetricCard
          title="Completed"
          value={formatDashboardNumber(totals.completed)}
          description={`API-reported completed calibrations in ${selectedYear}.`}
          icon={CheckCircle2}
          iconClassName="bg-emerald-50 text-emerald-700"
          valueClassName="text-emerald-600"
        />
        <DashboardMetricCard
          title="Upcoming"
          value={formatDashboardNumber(totals.pending)}
          description={`Pending or upcoming calibrations still open in ${selectedYear}.`}
          icon={TrendingUp}
          iconClassName="bg-amber-50 text-amber-700"
        />
        <DashboardMetricCard
          title="Overdue"
          value={formatDashboardNumber(totals.overdue)}
          description={`API-reported overdue calibrations in ${selectedYear}.`}
          icon={AlertTriangle}
          iconClassName="bg-red-50 text-red-700"
          valueClassName="text-red-600"
        />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Track Gauge and Instrument Status</CardTitle>
          <CardDescription>
            Lifecycle status visibility, movement tracking, and richer instrument-state monitoring are being prepared.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Cpu className="h-3.5 w-3.5" />
                  Coming Soon
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">Advanced gauge and instrument status tracking</h3>
                <p className="text-sm text-muted-foreground sm:text-base">
                  We are still completing this module. It will cover operational state, movement visibility,
                  instrument readiness, and richer lifecycle tracking in a future update.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:max-w-md">
                <div className="rounded-xl border border-background bg-background/80 p-4">
                  <p className="text-sm font-medium">Movement Tracking</p>
                  <p className="mt-1 text-xs text-muted-foreground">Inward, outward, and usage status visibility.</p>
                </div>
                <div className="rounded-xl border border-background bg-background/80 p-4">
                  <p className="text-sm font-medium">Instrument Health</p>
                  <p className="mt-1 text-xs text-muted-foreground">Readiness, service state, and lifecycle insights.</p>
                </div>
                <div className="rounded-xl border border-background bg-background/80 p-4">
                  <p className="text-sm font-medium">Alerts</p>
                  <p className="mt-1 text-xs text-muted-foreground">Better operational alerts and status summaries.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {overdueAnalysis && overdueAnalysis.totalOverdue > 0 && (
        <Card className="border-red-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-red-600">Overdue Attention</CardTitle>
            <CardDescription>
              A quick view of the most critical overdue calibrations for the selected year {selectedYear}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-red-50 p-4">
              <div>
                <p className="text-sm font-medium text-red-900">Total Overdue Gauges</p>
                <p className="text-2xl font-bold text-red-600">{overdueAnalysis.totalOverdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>

            {overdueAnalysis.criticalOverdue.length > 0 && (
              <div className="rounded-lg border-2 border-red-500 p-4">
                <p className="mb-2 text-sm font-semibold text-red-600">
                  Critical: {overdueAnalysis.criticalOverdue.length} gauges overdue by more than 30 days
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {overdueAnalysis.criticalOverdue.slice(0, 5).map((gauge) => {
                    const dueInfo = calculateCalibrationDue(gauge)
                    return (
                      <div key={gauge.id} className="flex justify-between gap-4">
                        <span>{gauge.master_gauge} ({gauge.identification_number || "N/A"})</span>
                        <span className="font-medium">{formatDaysUntilDue(dueInfo.daysUntilDue)}</span>
                      </div>
                    )
                  })}
                  {overdueAnalysis.criticalOverdue.length > 5 && (
                    <p className="pt-2 text-xs italic text-muted-foreground">
                      And {overdueAnalysis.criticalOverdue.length - 5} more...
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
