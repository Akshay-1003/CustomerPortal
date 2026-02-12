import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
} from "recharts"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Activity,
  BarChart3,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronRight
} from "lucide-react"
import { Link } from "react-router-dom"
import { useGauges } from "@/hooks/useGauges"
import { authService } from "@/services/auth.service"
import {
  aggregateGaugesByMonth,
  calculateCalibrationSummary,
  analyzeOverdueGauges,
  calculateCalibrationDue,
  formatCalibrationDate,
  formatDaysUntilDue,
  parseDate,
  type MonthlyStats,
} from '@/lib/calibrationUtils'
import type { Gauge } from '@/types/api'

export function Dashboard() {
  const organizationId = authService.getOrganizationId()
  const { data: gauges, isLoading, isError, error } = useGauges()
  
  // Analytics state
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<MonthlyStats | null>(null)
  const [showMonthDetail, setShowMonthDetail] = useState(false)

  // Analytics calculations
  const monthlyData = useMemo(() => {
    if (!gauges) return []
    return aggregateGaugesByMonth(gauges, selectedYear)
  }, [gauges, selectedYear])

  const chartData = useMemo(() => {
    return monthlyData.map((month) => ({
      name: month.monthName.substring(0, 3),
      Completed: month.completed,
      Pending: month.pending,
      Overdue: month.overdue,
      Total: month.total,
    }))
  }, [monthlyData])

  const summary = useMemo(() => {
    if (!gauges) return null
    return calculateCalibrationSummary(gauges)
  }, [gauges])

  // Year options
  const yearOptions = useMemo(() => {
    const years = []
    for (let i = -2; i <= 2; i++) {
      years.push(currentYear + i)
    }
    return years
  }, [currentYear])

  const handleMonthClick = (month: MonthlyStats) => {
    if (month.total > 0) {
      setSelectedMonth(month)
      setShowMonthDetail(true)
    }
  }

  const getStatusBadge = (gauge: any) => {
    const dueInfo = calculateCalibrationDue(gauge)
    
    if (dueInfo.isCompleted) {
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
    } else if (dueInfo.isOverdue) {
      return <Badge className="bg-red-500 hover:bg-red-600">Overdue</Badge>
    } else {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Pending</Badge>
    }
  }
  
  // Calculate KPIs from real data
  const kpis = useMemo(() => {
    if (!gauges) return []

    const total = gauges.length
    const active = gauges.filter(g => g.status === 'inward_pending').length
    const inactive = gauges.filter(g => g.status === 'calibration_completed').length
    const dueSoon = gauges.filter(g => g.status === 'calibration_due').length
    const overdue = gauges.filter(g => g.status === 'calibration_expired').length

    return [
      {
        title: "Total Gauges",
        value: total.toString(),
        change: "+5.2%",
        trend: "up" as const,
        icon: Package,
        description: "Total registered gauges",
      },
      {
        title: "Active",
        value: active.toString(),
        change: "+2.1%",
        trend: "up" as const,
        icon: CheckCircle2,
        description: "Currently active",
      },
      {
        title: "Inactive",
        value: inactive.toString(),
        change: "-1.5%",
        trend: "down" as const,
        icon: XCircle,
        description: "Currently inactive",
      },
      {
        title: "Calibration Due",
        value: dueSoon.toString(),
        change: "+3.0%",
        trend: "up" as const,
        icon: Clock,
        description: "Due within 30 days",
      },
      {
        title: "Overdue",
        value: overdue.toString(),
        change: "-2.0%",
        trend: "down" as const,
        icon: AlertTriangle,
        description: "Requires immediate attention",
      },
    ]
  }, [gauges])

  const overdue = useMemo(() => {
    if (!gauges) return 0
    return gauges.filter(g => g.status === 'calibration_expired').length
  }, [gauges])

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!gauges) return []

    const statusCounts = gauges.reduce((acc: Record<string, number>, gauge: any) => {
      const status = gauge.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return [
      { 
        name: 'Completed', 
        value: statusCounts['calibration_completed'] || 0, 
        color: '#10b981',
        change: '+12%',
        trend: 'up'
      },
      { 
        name: 'Pending', 
        value: statusCounts['inward_pending'] || 0, 
        color: '#3b82f6',
        change: '+5%',
        trend: 'up'
      },
      { 
        name: 'Overdue', 
        value: statusCounts['calibration_expired'] || 0, 
        color: '#ef4444',
        change: '-8%',
        trend: 'down'
      },
      { 
        name: 'Due Soon', 
        value: statusCounts['calibration_due'] || 0, 
        color: '#f59e0b',
        change: '+2%',
        trend: 'up'
      }
    ]
  }, [gauges])
  
  // Show message if organization is not set (AFTER all hooks)
  if (!organizationId) {
    return (
      <div className="space-y-6 w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Organization Not Set</AlertTitle>
          <AlertDescription>
            Please log out and log in again to select your organization.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 w-full">
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Loading Dashboard</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Fetching system data...
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Error State
  if (isError) {
    return (
      <div className="space-y-6 w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription className="mt-2">
            {(error as any)?.response?.data?.message || (error as Error)?.message || 'Failed to load dashboard data. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-6 w-6 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Real-time monitoring and calibration management overview
          </p>
        </div>
       
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/gauge-list">
              <Package className="mr-2 h-4 w-4" />
              View All Gauges
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/transactions/inward">
              <BarChart3 className="mr-2 h-4 w-4" />
              Transactions
            </Link>
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {overdue > 0 && (
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Critical: Action Required</AlertTitle>
          <AlertDescription className="mt-2">
            <span className="font-medium">{overdue} gauge{overdue !== 1 ? 's' : ''}</span> {overdue !== 1 ? 'are' : 'is'} overdue for calibration and require immediate attention.
            <Button variant="outline" size="sm" className="mt-3 border-destructive hover:bg-destructive hover:text-destructive-foreground" asChild>
              <Link to="/gauge-list">
                View Overdue Gauges
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <div className="rounded-full bg-primary/10 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpi.value}</div>
                <div className="flex items-center text-xs mt-2">
                  {kpi.trend === "up" ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                  )}
                  <span className={kpi.trend === "up" ? "text-green-600" : "text-red-600"}>
                    {kpi.change}
                  </span>
                  <span className="ml-1 text-muted-foreground">vs last month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Analytics Overview */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{item.value}</span>
                    <div className="flex items-center text-xs">
                      {item.trend === 'up' ? (
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-600" />
                      )}
                      <span className={item.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                        {item.change}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button variant="outline" className="justify-start h-auto p-4" asChild>
                <Link to="/transactions/inward">
                  <Package className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Inward Processing</div>
                    <div className="text-sm text-muted-foreground">
                      {analyticsData.find(d => d.name === 'Completed')?.value || 0} gauges ready
                    </div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4" asChild>
                <Link to="/transactions/outward">
                  <Package className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Outward Processing</div>
                    <div className="text-sm text-muted-foreground">
                      {analyticsData.find(d => d.name === 'Pending')?.value || 0} gauges pending
                    </div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4" asChild>
                <Link to="/gauge-list">
                  <Package className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">All Gauges</div>
                    <div className="text-sm text-muted-foreground">
                      View and manage all gauges
                    </div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year-wise Calibration Plan */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Year-wise Calibration Plan ({selectedYear})
              </CardTitle>
              <CardDescription>
                Monthly calibration planning and due tracking
              </CardDescription>
            </div>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="w-[120px]">
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
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Chart */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
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
            </div>

            {/* Monthly Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((month) => (
                    <TableRow 
                      key={`${month.year}-${month.month}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleMonthClick(month)}
                    >
                      <TableCell className="font-medium">{month.monthName}</TableCell>
                      <TableCell className="text-right font-semibold">{month.total}</TableCell>
                      <TableCell className="text-right text-green-600">{month.completed}</TableCell>
                      <TableCell className="text-right text-blue-600">{month.pending}</TableCell>
                      <TableCell className="text-right text-red-600">{month.overdue}</TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={month.total === 0}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMonthClick(month)
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month Detail Modal */}
      <Dialog open={showMonthDetail} onOpenChange={setShowMonthDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMonth?.monthName} {selectedYear} - Calibration Details
            </DialogTitle>
            <DialogDescription>
              Detailed view of all gauges due for calibration in this month
            </DialogDescription>
          </DialogHeader>
          {selectedMonth && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{selectedMonth.total}</div>
                    <div className="text-sm text-muted-foreground">Total Gauges</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedMonth.completed}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedMonth.pending}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{selectedMonth.overdue}</div>
                    <div className="text-sm text-muted-foreground">Overdue</div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gauge</TableHead>
                      <TableHead>Identification</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedMonth.gauges.map((gauge) => (
                      <TableRow key={gauge.id}>
                        <TableCell className="font-medium">{gauge.master_gauge}</TableCell>
                        <TableCell>{gauge.identification_number}</TableCell>
                        <TableCell>{gauge.manf_serial_number}</TableCell>
                        <TableCell>{getStatusBadge(gauge)}</TableCell>
                        <TableCell>
                          {formatCalibrationDate(parseDate(gauge.next_calibration_date))}
                        </TableCell>
                      </TableRow>
                    ))}
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
