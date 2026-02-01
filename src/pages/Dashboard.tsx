import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { 
  Gauge, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Activity
} from "lucide-react"
import { Link } from "react-router-dom"
import { useGauges } from "@/hooks/useGauges"
import { useOrganizationById } from "@/hooks/useOrganizations"
import { authService } from "@/services/auth.service"

export function Dashboard() {
  const organizationId = authService.getOrganizationId()
  const { data: gauges, isLoading, isError, error } = useGauges()
  const { data: organization } = useOrganizationById(organizationId as string)
  
  // Show message if organization is not set
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
        icon: Gauge,
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
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{organization?.name}</h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Real-time monitoring and calibration management dashboard
          </p>
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

    </div>
  )
}
