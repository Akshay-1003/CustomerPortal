import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { useGauges } from '@/hooks/useGauges'
import {
  aggregateGaugesByMonth,
  calculateCalibrationSummary,
  analyzeOverdueGauges,
  calculateCalibrationDue,
  formatCalibrationDate,
  formatDaysUntilDue,
  type MonthlyStats,
} from '@/lib/calibrationUtils'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Gauge } from '@/types/api'

export function Analytics() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<MonthlyStats | null>(null)
  const [showMonthDetail, setShowMonthDetail] = useState(false)

  const { data: gauges, isLoading, isError, error } = useGauges()

  // ============================================
  // MEMOIZED CALCULATIONS
  // ============================================

  const monthlyData = useMemo(() => {
    if (!gauges) return []
    return aggregateGaugesByMonth(gauges, selectedYear)
  }, [gauges, selectedYear])

  const summary = useMemo(() => {
    if (!gauges) return null
    return calculateCalibrationSummary(gauges)
  }, [gauges])

  const overdueAnalysis = useMemo(() => {
    if (!gauges) return null
    return analyzeOverdueGauges(gauges, selectedYear)
  }, [gauges, selectedYear])

  // Chart data for visualizations
  const chartData = useMemo(() => {
    return monthlyData.map((month) => ({
      name: month.monthName.substring(0, 3), // Short month name
      Completed: month.completed,
      Pending: month.pending,
      Overdue: month.overdue,
      Total: month.total,
    }))
  }, [monthlyData])

  // Year options (current year ± 2 years)
  const yearOptions = useMemo(() => {
    const years = []
    for (let i = -2; i <= 2; i++) {
      years.push(currentYear + i)
    }
    return years
  }, [currentYear])

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleMonthClick = (month: MonthlyStats) => {
    if (month.total > 0) {
      setSelectedMonth(month)
      setShowMonthDetail(true)
    }
  }

  const getStatusBadge = (gauge: Gauge) => {
    const dueInfo = calculateCalibrationDue(gauge)
    
    if (dueInfo.isCompleted) {
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
    } else if (dueInfo.isOverdue) {
      return <Badge className="bg-red-500 hover:bg-red-600">Overdue</Badge>
    } else {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Pending</Badge>
    }
  }

  // ============================================
  // LOADING & ERROR STATES
  // ============================================

  if (isLoading) {
    return (
      <div className="space-y-6 w-full">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calibration Analytics</h2>
          <p className="text-muted-foreground">
            Month-wise calibration planning and due tracking
          </p>
        </div>
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Loading Analytics</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Processing calibration data...
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6 w-full">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calibration Analytics</h2>
          <p className="text-muted-foreground">
            Month-wise calibration planning and due tracking
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Analytics</AlertTitle>
          <AlertDescription className="mt-2">
            {(error as any)?.response?.data?.message || (error as Error)?.message || 'Failed to load analytics data.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!gauges || gauges.length === 0) {
    return (
      <div className="space-y-6 w-full">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calibration Analytics</h2>
          <p className="text-muted-foreground">
            Month-wise calibration planning and due tracking
          </p>
        </div>
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No Gauge Data Available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add gauges to your organization to see calibration analytics.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // ============================================
  // MAIN DASHBOARD UI
  // ============================================

  return (
    <div className="space-y-6 w-full">
      {/* Header with Year Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calibration Analytics</h2>
          <p className="text-muted-foreground">
            Month-wise calibration planning and due tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Year:</span>
          <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Summary Cards */}
      {summary && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gauges</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalGauges}</div>
              <p className="text-xs text-muted-foreground">Across all statuses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due This Month</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalDueThisMonth}</div>
              <p className="text-xs text-muted-foreground">Require calibration</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.totalOverdue}</div>
              <p className="text-xs text-muted-foreground">Need immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.totalCompletedThisMonth}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalUpcomingNext3Months}</div>
              <p className="text-xs text-muted-foreground">Next 3 months</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critical Alert for Oldest Overdue */}
      {summary && summary.oldestOverdueGauge.gauge && (
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Critical: Oldest Overdue Gauge</AlertTitle>
          <AlertDescription className="mt-2">
            <span className="font-medium">{summary.oldestOverdueGauge.gauge.master_gauge}</span> 
            {' '}(ID: {summary.oldestOverdueGauge.gauge.identification_number}) is{' '}
            <span className="font-bold">{summary.oldestOverdueGauge.daysPastDue} days overdue</span>.
            Immediate calibration required.
          </AlertDescription>
        </Alert>
      )}

      {/* Month-wise Stacked Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Month-wise Calibration Status ({selectedYear})</CardTitle>
          <CardDescription>
            Visual breakdown of completed, pending, and overdue calibrations by month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Completed" stackId="a" fill="#10b981" />
              <Bar dataKey="Pending" stackId="a" fill="#3b82f6" />
              <Bar dataKey="Overdue" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Calibration Load Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Calibration Load Trend ({selectedYear})</CardTitle>
          <CardDescription>
            Total number of gauges due for calibration each month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Total" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                name="Total Due"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Month-wise Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Calibration Schedule ({selectedYear})</CardTitle>
          <CardDescription>
            Click on a month to view detailed gauge list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-center">Total Due</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-center">Overdue</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((month) => (
                  <TableRow 
                    key={month.month}
                    className={month.total > 0 ? 'cursor-pointer hover:bg-muted/50' : ''}
                  >
                    <TableCell className="font-medium">{month.monthName}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{month.total}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600 font-medium">{month.completed}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-blue-600 font-medium">{month.pending}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-red-600 font-medium">{month.overdue}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {month.total > 0 ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMonthClick(month)}
                        >
                          View Details <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No data</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Analysis */}
      {overdueAnalysis && overdueAnalysis.totalOverdue > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Overdue Analysis</CardTitle>
            <CardDescription>
              Detailed breakdown of overdue calibrations requiring immediate action
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">Total Overdue Gauges</p>
                <p className="text-2xl font-bold text-red-600">{overdueAnalysis.totalOverdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>

            {overdueAnalysis.criticalOverdue.length > 0 && (
              <div className="p-4 border-2 border-red-500 rounded-lg">
                <p className="text-sm font-semibold text-red-600 mb-2">
                  🚨 Critical: {overdueAnalysis.criticalOverdue.length} gauges overdue by more than 30 days
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {overdueAnalysis.criticalOverdue.slice(0, 5).map((gauge) => {
                    const dueInfo = calculateCalibrationDue(gauge)
                    return (
                      <div key={gauge.id} className="flex justify-between">
                        <span>{gauge.master_gauge} ({gauge.identification_number})</span>
                        <span className="font-medium">{formatDaysUntilDue(dueInfo.daysUntilDue)}</span>
                      </div>
                    )
                  })}
                  {overdueAnalysis.criticalOverdue.length > 5 && (
                    <p className="text-xs text-muted-foreground italic pt-2">
                      And {overdueAnalysis.criticalOverdue.length - 5} more...
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Month Detail Dialog */}
      <Dialog open={showMonthDetail} onOpenChange={setShowMonthDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMonth?.monthName} {selectedYear} - Calibration Details
            </DialogTitle>
            <DialogDescription>
              {selectedMonth?.total} gauge(s) due for calibration this month
            </DialogDescription>
          </DialogHeader>

          {selectedMonth && selectedMonth.gauges.length > 0 && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{selectedMonth.completed}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedMonth.pending}</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{selectedMonth.overdue}</p>
                </div>
              </div>

              {/* Gauge List */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gauge</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedMonth.gauges.map((gauge) => {
                      const dueInfo = calculateCalibrationDue(gauge)
                      return (
                        <TableRow key={gauge.id}>
                          <TableCell className="font-medium">{gauge.master_gauge}</TableCell>
                          <TableCell className="text-xs">{gauge.identification_number}</TableCell>
                          <TableCell>{formatCalibrationDate(dueInfo.dueDate)}</TableCell>
                          <TableCell>{getStatusBadge(gauge)}</TableCell>
                          <TableCell className="text-xs">{formatDaysUntilDue(dueInfo.daysUntilDue)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
