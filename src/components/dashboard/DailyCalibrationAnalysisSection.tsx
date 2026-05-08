import { useMemo } from "react"
import { AxiosError } from "axios"
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Gauge,
  RefreshCw,
  Target,
  TriangleAlert,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDailyCalibrationDashboard } from "@/hooks/useDailyCalibrationDashboard"
import {
  calculateDailyTotals,
  DASHBOARD_MONTH_OPTIONS,
  normalizeDailyCalibrationResponse,
} from "@/lib/dailyCalibrationDashboard"
import {
  CALIBRATION_CHART_COLORS,
  formatDashboardNumber,
  formatDashboardPercentage,
} from "@/lib/monthlyCalibrationDashboard"

interface DailyCalibrationAnalysisSectionProps {
  selectedYear: number
  selectedMonth: number
  yearOptions: number[]
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
}

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const apiMessage = (error.response?.data as { message?: string } | undefined)?.message
    return apiMessage || error.message || "Failed to load daily calibration analysis."
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Failed to load daily calibration analysis."
}

function DailySectionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="border-border/70 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-6">
          <Skeleton className="mb-4 h-6 w-60" />
          <Skeleton className="h-[340px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

function getDailyStatus(planned: number, completed: number, pending: number, overdue: number) {
  if (overdue > 0) return { label: "Overdue Risk", className: "border-red-200 bg-red-50 text-red-700" }
  if (pending > 0) return { label: "Pending Load", className: "border-amber-200 bg-amber-50 text-amber-700" }
  if (planned > 0 && completed >= planned) return { label: "On Track", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
  if (planned === 0 && completed > 0) return { label: "Backlog Closed", className: "border-blue-200 bg-blue-50 text-blue-700" }
  return { label: "No Activity", className: "border-slate-200 bg-slate-50 text-slate-700" }
}

export function DailyCalibrationAnalysisSection({
  selectedYear,
  selectedMonth,
  yearOptions,
  onYearChange,
  onMonthChange,
}: DailyCalibrationAnalysisSectionProps) {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useDailyCalibrationDashboard(selectedYear, selectedMonth)

  const dailyData = useMemo(() => normalizeDailyCalibrationResponse(data), [data])
  const totals = useMemo(() => calculateDailyTotals(dailyData), [dailyData])
  const selectedMonthLabel =
    DASHBOARD_MONTH_OPTIONS.find((month) => month.value === selectedMonth)?.label ?? `Month ${selectedMonth}`
  const isEmpty = !isLoading && dailyData.length === 0

  const kpiCards = [
    {
      title: "Planned Days",
      value: formatDashboardNumber(totals.plannedDays),
      helper: "Dates carrying at least one planned calibration task.",
      icon: CalendarDays,
      iconClassName: "bg-blue-50 text-blue-700",
    },
    {
      title: "Active Days",
      value: formatDashboardNumber(totals.activeDays),
      helper: "Dates with plan, completion, pending, or overdue activity.",
      icon: Gauge,
      iconClassName: "bg-slate-100 text-slate-700",
    },
    {
      title: "Peak Completed Day",
      value: totals.peakCompletedDay ? formatDashboardNumber(totals.peakCompletedDay.value) : "--",
      helper: totals.peakCompletedDay ? totals.peakCompletedDay.dateLabel : "No completion data for selected month.",
      icon: BarChart3,
      iconClassName: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Overdue Days",
      value: formatDashboardNumber(totals.overdueDays),
      helper: "Dates where overdue gauges created immediate execution pressure.",
      icon: TriangleAlert,
      iconClassName: "bg-red-50 text-red-700",
    },
    {
      title: "Completion %",
      value: formatDashboardPercentage(totals.completionPercentage),
      helper: "Month-level completion against day-wise planned workload.",
      icon: Target,
      iconClassName: "bg-emerald-50 text-emerald-700",
    },
  ]

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <CalendarDays className="h-3.5 w-3.5" />
              Daily Calibration Analysis
            </div>
            <div>
              <CardTitle>Date-wise calibration planning, completion, pending, and overdue activity</CardTitle>
              <CardDescription className="mt-1">
                Select a month and year to inspect which exact dates carried calibration load, completion output, and overdue risk.
              </CardDescription>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="daily-calibration-year">Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => onYearChange(Number(value))}>
                <SelectTrigger id="daily-calibration-year" className="w-full bg-background">
                  <SelectValue placeholder="Select year" />
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

            <div className="space-y-2">
              <Label htmlFor="daily-calibration-month">Month</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => onMonthChange(Number(value))}>
                <SelectTrigger id="daily-calibration-month" className="w-full bg-background">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {DASHBOARD_MONTH_OPTIONS.map((monthOption) => (
                    <SelectItem key={monthOption.value} value={monthOption.value.toString()}>
                      {monthOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="opacity-0">Refresh</Label>
              <Button type="button" variant="outline" className="w-full" onClick={() => void refetch()} disabled={isFetching}>
                <RefreshCw className={isFetching ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{selectedMonthLabel} {selectedYear}</Badge>
          <Badge variant="outline">Daily operational status API</Badge>
          <Badge variant="outline">Graphical and tabular view</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <DailySectionSkeleton />
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unable to load daily calibration analysis</AlertTitle>
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
            <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <CalendarDays className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No daily calibration data found</h3>
                <p className="max-w-xl text-sm text-muted-foreground">
                  No date-wise calibration activity was returned for {selectedMonthLabel} {selectedYear}.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {kpiCards.map((card) => {
                const Icon = card.icon
                return (
                  <Card key={card.title} className="border-border/70 shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                        <div className="text-2xl font-semibold tracking-tight">{card.value}</div>
                      </div>
                      <div className={`rounded-full p-2.5 ${card.iconClassName}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs leading-relaxed text-muted-foreground">{card.helper}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Tabs defaultValue="graphical" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="graphical">Graphical View</TabsTrigger>
                <TabsTrigger value="tabular">Tabular View</TabsTrigger>
              </TabsList>

              <TabsContent value="graphical" className="space-y-6">
                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Daily Calibration Activity Chart</CardTitle>
                    <CardDescription>
                      Compare planned, completed, pending, and overdue gauges date by date across the selected month.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[360px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }} barGap={6}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis dataKey="dayOfMonth" tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, borderColor: "#dbe4f0" }}
                            formatter={(value: number | string | undefined, name: string | undefined) => [
                              formatDashboardNumber(Number(value ?? 0)),
                              name ?? "Value",
                            ]}
                            labelFormatter={(label) => `Day ${label}`}
                          />
                          <Legend />
                          <Bar dataKey="planned" name="Planned" fill={CALIBRATION_CHART_COLORS.planned} radius={[6, 6, 0, 0]} />
                          <Bar dataKey="completed" name="Completed" fill={CALIBRATION_CHART_COLORS.completed} radius={[6, 6, 0, 0]} />
                          <Bar dataKey="pending" name="Pending" fill={CALIBRATION_CHART_COLORS.pending} radius={[6, 6, 0, 0]} />
                          <Bar dataKey="overdue" name="Overdue" fill={CALIBRATION_CHART_COLORS.overdue} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card className="border-border/70 shadow-sm">
                    <CardHeader>
                      <CardTitle>Planned vs Completed Trend</CardTitle>
                      <CardDescription>
                        Spot days where actual completion outperformed or trailed the planned schedule.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dailyData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="dayOfMonth" tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{ borderRadius: 12, borderColor: "#dbe4f0" }}
                              formatter={(value: number | string | undefined, name: string | undefined) => [
                                formatDashboardNumber(Number(value ?? 0)),
                                name ?? "Value",
                              ]}
                              labelFormatter={(label) => `Day ${label}`}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="planned"
                              name="Planned"
                              stroke={CALIBRATION_CHART_COLORS.planned}
                              strokeWidth={3}
                              dot={{ r: 3.5, fill: CALIBRATION_CHART_COLORS.planned }}
                            />
                            <Line
                              type="monotone"
                              dataKey="completed"
                              name="Completed"
                              stroke={CALIBRATION_CHART_COLORS.completed}
                              strokeWidth={3}
                              dot={{ r: 3.5, fill: CALIBRATION_CHART_COLORS.completed }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/70 shadow-sm">
                    <CardHeader>
                      <CardTitle>Pending and Overdue Risk Trend</CardTitle>
                      <CardDescription>
                        Isolate the dates where risk accumulated because pending work or overdue gauges stayed unresolved.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dailyData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="dayOfMonth" tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{ borderRadius: 12, borderColor: "#dbe4f0" }}
                              formatter={(value: number | string | undefined, name: string | undefined) => [
                                formatDashboardNumber(Number(value ?? 0)),
                                name ?? "Value",
                              ]}
                              labelFormatter={(label) => `Day ${label}`}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="pending"
                              name="Pending"
                              stroke={CALIBRATION_CHART_COLORS.pending}
                              strokeWidth={3}
                              dot={{ r: 3.5, fill: CALIBRATION_CHART_COLORS.pending }}
                            />
                            <Line
                              type="monotone"
                              dataKey="overdue"
                              name="Overdue"
                              stroke={CALIBRATION_CHART_COLORS.overdue}
                              strokeWidth={3}
                              dot={{ r: 3.5, fill: CALIBRATION_CHART_COLORS.overdue }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="tabular" className="space-y-6">
                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Date-wise Calibration Table</CardTitle>
                    <CardDescription>
                      Day-by-day calibration planning and execution details for {selectedMonthLabel} {selectedYear}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden rounded-lg border border-border/70">
                      <div className="max-h-[520px] overflow-auto">
                        <Table className="min-w-[1120px]">
                          <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableHead className="sticky top-0 z-10 bg-background/95 backdrop-blur">Date</TableHead>
                              <TableHead className="sticky top-0 z-10 bg-background/95 backdrop-blur">Day</TableHead>
                              <TableHead className="sticky top-0 z-10 bg-background/95 text-right backdrop-blur">Planned</TableHead>
                              <TableHead className="sticky top-0 z-10 bg-background/95 text-right backdrop-blur">Completed</TableHead>
                              <TableHead className="sticky top-0 z-10 bg-background/95 text-right backdrop-blur">Pending</TableHead>
                              <TableHead className="sticky top-0 z-10 bg-background/95 text-right backdrop-blur">Overdue</TableHead>
                              <TableHead className="sticky top-0 z-10 bg-background/95 text-right backdrop-blur">Completion %</TableHead>
                              <TableHead className="sticky top-0 z-10 bg-background/95 text-right backdrop-blur">Overdue %</TableHead>
                              <TableHead className="sticky top-0 z-10 bg-background/95 backdrop-blur">Daily Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dailyData.map((day) => {
                              const status = getDailyStatus(day.planned, day.completed, day.pending, day.overdue)

                              return (
                                <TableRow key={day.dateKey} className="hover:bg-muted/20">
                                  <TableCell className="font-medium">{day.dateLabel}</TableCell>
                                  <TableCell>{day.weekdayLabel}</TableCell>
                                  <TableCell className="text-right">{formatDashboardNumber(day.planned)}</TableCell>
                                  <TableCell className="text-right text-emerald-700">{formatDashboardNumber(day.completed)}</TableCell>
                                  <TableCell className="text-right text-amber-700">{formatDashboardNumber(day.pending)}</TableCell>
                                  <TableCell className="text-right text-red-700">{formatDashboardNumber(day.overdue)}</TableCell>
                                  <TableCell className="text-right">{formatDashboardPercentage(day.completionPercentage)}</TableCell>
                                  <TableCell className="text-right text-red-700">{formatDashboardPercentage(day.overduePercentage)}</TableCell>
                                  <TableCell>
                                    <Badge className={status.className}>{status.label}</Badge>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  )
}
