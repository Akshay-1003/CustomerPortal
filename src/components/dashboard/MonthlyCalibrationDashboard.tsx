import { useMemo, useState } from "react"
import { AxiosError } from "axios"
import { Activity, AlertCircle, CalendarDays, RefreshCw, ShieldCheck, Users } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  calculateTotals,
  normalizeMonthlyCalibrationResponse,
} from "@/lib/monthlyCalibrationDashboard"
import { useMonthlyCalibrationDashboard } from "@/hooks/useMonthlyCalibrationDashboard"
import type { NormalizedMonthlyCalibrationDatum } from "@/types/dashboard"
import { CalibrationDashboardFilters } from "./CalibrationDashboardFilters"
import { CalibrationDetailsDrawer } from "./CalibrationDetailsDrawer"
import { CalibrationKpiCards } from "./CalibrationKpiCards"
import { CalibrationMonthTable } from "./CalibrationMonthTable"
import { DailyCalibrationAnalysisSection } from "./DailyCalibrationAnalysisSection"
import { MonthlyPlannedChart } from "./MonthlyPlannedChart"
import { MonthlyStatusGroupedChart } from "./MonthlyStatusGroupedChart"
import { OverdueTrendChart } from "./OverdueTrendChart"
import { PlannedDistributionTrendChart } from "./PlannedDistributionTrendChart"
import { PlanVsCompletedTrendChart } from "./PlanVsCompletedTrendChart"
import { StatusDistributionChart } from "./StatusDistributionChart"

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const apiMessage = (error.response?.data as { message?: string } | undefined)?.message
    return apiMessage || error.message || "Failed to load calibration dashboard."
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Failed to load calibration dashboard."
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-border/70 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-6">
          <Skeleton className="mb-4 h-6 w-56" />
          <Skeleton className="h-[320px] w-full" />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-6">
          <Skeleton className="mb-4 h-6 w-64" />
          <Skeleton className="h-[420px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export function MonthlyCalibrationDashboard() {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [plannedOnly, setPlannedOnly] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<NormalizedMonthlyCalibrationDatum | null>(null)
  const [selectedDailyMonth, setSelectedDailyMonth] = useState(currentMonth)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { data, isLoading, isFetching, isError, error, refetch } = useMonthlyCalibrationDashboard(
    selectedYear,
    plannedOnly
  )

  const yearOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => currentYear - 3 + index)
  }, [currentYear])

  const monthlyData = useMemo(() => normalizeMonthlyCalibrationResponse(data), [data])
  const totals = useMemo(() => calculateTotals(monthlyData), [monthlyData])
  const isEmpty = !isLoading && monthlyData.length === 0

  const handleViewDetails = (month: NormalizedMonthlyCalibrationDatum) => {
    setSelectedMonth(month)
    setSelectedDailyMonth(month.monthIndex + 1)
    setIsDrawerOpen(true)
  }

  return (
    <div className="space-y-6 w-full">
      <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-muted/30 shadow-sm">
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Activity className="h-3.5 w-3.5" />
              Gauges Calibration Dashboard
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Monthly calibration planning and execution intelligence
                </h1>
                <Badge variant={plannedOnly ? "primary" : "outline"}>
                  {plannedOnly ? "Plan View" : "Status View"}
                </Badge>
              </div>
              <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                Built for Vendor, Customer, Quality Head, and Gauges Head teams to monitor planned load,
                completed work, pending backlog, and overdue exposure in one clean enterprise view.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Planning discipline
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Track where calibration demand is concentrated before capacity becomes a risk.
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-blue-600" />
                Shared management view
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Keep operations, quality, and customer stakeholders aligned on the same monthly picture.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CalibrationDashboardFilters
        year={selectedYear}
        plannedOnly={plannedOnly}
        yearOptions={yearOptions}
        isRefreshing={isFetching}
        onYearChange={setSelectedYear}
        onPlannedOnlyChange={setPlannedOnly}
        onRefresh={() => {
          void refetch()
        }}
      />

      {isLoading ? (
        <DashboardLoadingSkeleton />
      ) : isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load calibration dashboard</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{getErrorMessage(error)}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : isEmpty ? (
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <CalendarDays className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">No calibration data found for selected year.</h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Try a different year, switch the view mode, or refresh the dashboard to fetch the latest calibration planning data.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <CalibrationKpiCards plannedOnly={plannedOnly} totals={totals} />

          {plannedOnly ? (
            <>
              <MonthlyPlannedChart data={monthlyData} />
              <PlannedDistributionTrendChart data={monthlyData} />
            </>
          ) : (
            <>
              <MonthlyStatusGroupedChart data={monthlyData} />
              <div className="grid gap-6 xl:grid-cols-2">
                <PlanVsCompletedTrendChart data={monthlyData} />
                <OverdueTrendChart data={monthlyData} />
                {totals.hasDistributionData && (
                  <div className="xl:col-span-2">
                    <StatusDistributionChart totals={totals} />
                  </div>
                )}
              </div>
            </>
          )}

          <CalibrationMonthTable
            plannedOnly={plannedOnly}
            data={monthlyData}
            onViewDetails={handleViewDetails}
          />
        </>
      )}

      <DailyCalibrationAnalysisSection
        selectedYear={selectedYear}
        selectedMonth={selectedDailyMonth}
        yearOptions={yearOptions}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedDailyMonth}
      />

      <CalibrationDetailsDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        month={selectedMonth}
        plannedOnly={plannedOnly}
        year={selectedYear}
      />
    </div>
  )
}
