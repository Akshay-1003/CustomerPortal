import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  CalibrationDueReportPrintPreview,
  type CalibrationDueReportPrintRow,
} from "@/components/reports/CalibrationDueReportPrintPreview"
import { useCalibrationPlanningOverview } from "@/hooks/useCalibrationPlanning"
import { CALIBRATION_MONTHS, toCalibrationPlanningPrintRows } from "@/lib/calibrationPlanningReport"
import { useCurrentOrganizationPrintInfo } from "@/hooks/useCurrentOrganizationPrintInfo"
import { calibrationPlanningService } from "@/services/calibrationPlanning.service"
import type { CalibrationPlanningMonth } from "@/types/calibrationPlanning"

type SummaryCard = {
  label: string
  value: number
  tone: "blue" | "green" | "amber" | "red" | "slate"
  Icon: typeof CalendarDays,
  color: "blue" | "green" | "orange" | "red" | "slate"
}

type MonthCardTone = "completed" | "overdue" | "upcoming" | "active" | "neutral"

const TONE_STYLES = {
  blue: { icon: "text-[#2563eb]", iconSurface: "bg-[#eaf1ff]", value: "text-[#1d4ed8]" },
  green: { icon: "text-[#168566]", iconSurface: "bg-[#e7f7f0]", value: "text-[#13795b]" },
  amber: { icon: "text-[#be6506]", iconSurface: "bg-[#fff4df]", value: "text-[#a65300]" },
  red: { icon: "text-[#d13d3d]", iconSurface: "bg-[#fff0ef]", value: "text-[#b83131]" },
  slate: { icon: "text-[#52627d]", iconSurface: "bg-[#eef2f7]", value: "text-[#17233b]" },
} as const

const MONTH_CARD_STYLES: Record<MonthCardTone, {
  card: string
  title: string
  badge: string
  planned: string
  completed: string
  pending: string
  overdue: string
  progress: string
  action: string
  muted: string
}> = {
  completed: {
    card: "border-[#86efac] border-t-[3px] border-t-[#4ade80] bg-[#f0fdf4]",
    title: "text-[#166534]",
    badge: "border-[#86efac] bg-[#dcfce7] text-[#166534]",
    planned: "text-[#166534]",
    completed: "text-[#15803d]",
    pending: "text-[#6b7280]",
    overdue: "text-[#6b7280]",
    progress: "bg-[#16a34a]",
    action: "text-[#15803d]",
    muted: "text-[#4b6c56]",
  },
  overdue: {
    card: "border-[#fca5a5] border-t-[3px] border-t-[#f87171] bg-[#fef2f2]",
    title: "text-[#991b1b]",
    badge: "border-[#fca5a5] bg-[#fee2e2] text-[#991b1b]",
    planned: "text-[#991b1b]",
    completed: "text-[#15803d]",
    pending: "text-[#b45309]",
    overdue: "text-[#dc2626]",
    progress: "bg-[#ef4444]",
    action: "text-[#b91c1c]",
    muted: "text-[#7f4c4c]",
  },
  upcoming: {
    card: "border-[#fcd34d] border-t-[3px] border-t-[#fbbf24] bg-[#fffbeb]",
    title: "text-[#92400e]",
    badge: "border-[#fcd34d] bg-[#fef3c7] text-[#92400e]",
    planned: "text-[#92400e]",
    completed: "text-[#15803d]",
    pending: "text-[#c2410c]",
    overdue: "text-[#dc2626]",
    progress: "bg-[#f59e0b]",
    action: "text-[#b45309]",
    muted: "text-[#7c5d28]",
  },
  active: {
    card: "border-[#93c5fd] border-t-[3px] border-t-[#60a5fa] bg-[#eff6ff]",
    title: "text-[#1d4ed8]",
    badge: "border-[#93c5fd] bg-[#dbeafe] text-[#1d4ed8]",
    planned: "text-[#1d4ed8]",
    completed: "text-[#15803d]",
    pending: "text-[#c2410c]",
    overdue: "text-[#dc2626]",
    progress: "bg-[#2563eb]",
    action: "text-[#1d4ed8]",
    muted: "text-[#4d6693]",
  },
  neutral: {
    card: "border-[#e2e8f0] border-t-[3px] border-t-[#cbd5e1] bg-[#f8fafc]",
    title: "text-[#475569]",
    badge: "border-[#cbd5e1] bg-[#f1f5f9] text-[#475569]",
    planned: "text-[#64748b]",
    completed: "text-[#64748b]",
    pending: "text-[#64748b]",
    overdue: "text-[#64748b]",
    progress: "bg-[#94a3b8]",
    action: "text-[#64748b]",
    muted: "text-[#64748b]",
  },
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Unable to load calibration planning."
}

function completionPercentage(month: CalibrationPlanningMonth) {
  return month.planned > 0 ? Math.round((month.completed / month.planned) * 100) : 0
}

function getMonthCardTone(month: CalibrationPlanningMonth, selectedYear: number) {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const isPast = selectedYear < currentYear || (selectedYear === currentYear && month.month < currentMonth)
  const isCurrent = selectedYear === currentYear && month.month === currentMonth
  const pending = month.upcoming + month.due_soon

  if (month.overdue > 0) return "overdue"
  if (month.planned === 0) return "neutral"
  if (isPast && month.completed < month.planned) return "overdue"
  if (month.completed === month.planned && pending === 0) return "completed"
  if (isCurrent) return "active"
  if (selectedYear > currentYear || (selectedYear === currentYear && month.month > currentMonth)) return "upcoming"
  return "active"
}

export function CalibrationDueReportPage() {
  const currentYear = new Date().getFullYear()
  const { organizationName, organizationAddress } = useCurrentOrganizationPrintInfo()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false)
  const [exportRows, setExportRows] = useState<CalibrationDueReportPrintRow[]>([])
  const [isPreparingExport, setIsPreparingExport] = useState(false)
  const { data, isLoading, isFetching, isError, error, refetch } = useCalibrationPlanningOverview(selectedYear)

  const yearOptions = useMemo(
    () => Array.from({ length: 9 }, (_, index) => currentYear - 4 + index),
    [currentYear]
  )

  const summaryCards: SummaryCard[] = [
    { label: "Total Planned", value: data?.summary.total_planned ?? 0, Icon: CalendarDays, tone: "slate", color: "blue" },
    { label: "Completed", value: data?.summary.completed ?? 0, Icon: CheckCircle2, tone: "green" ,color: "green"},
    { label: "Pending", value: (data?.summary.upcoming ?? 0) + (data?.summary.due_soon ?? 0), Icon: Clock3, tone: "amber",color:"orange" },
    { label: "Overdue", value: data?.summary.overdue ?? 0, Icon: AlertTriangle, tone: "red" ,color: "red"},
  ]

  const handleAnnualExport = async () => {
    setIsPreparingExport(true)
    try {
      const response = await calibrationPlanningService.getDetails({ year: selectedYear, limit: 500 })
      if (response.data.length === 0) {
        toast.error("No gauges are available for this export.")
        return
      }
      setExportRows(toCalibrationPlanningPrintRows(response.data))
      setIsExportPreviewOpen(true)
    } catch (exportError) {
      toast.error(getErrorMessage(exportError))
    } finally {
      setIsPreparingExport(false)
    }
  }

  if (isError) {
    return (
      <Card className="border-[#f2c9c9] bg-[#fff8f8] shadow-none">
        <CardContent className="flex flex-row items-center justify-between gap-4 p-5">
          <div>
            <p className="font-semibold text-[#9f2727]">Unable to load calibration planning</p>
            <p className="mt-1 text-sm text-[#8b5f5f]">{getErrorMessage(error)}</p>
          </div>
          <Button variant="destructive" onClick={() => void refetch()}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5 text-[#17233b]">
      <section className="flex flex-col gap-4 border-b border-[#e6ebf2] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2563eb]">Reports</p>
          <h1 className="mt-1 text-2xl font-semibold">Calibration Planning</h1>
          <p className="mt-1 text-sm text-[#6b7a92]">Annual workload, completion progress, and calibration exceptions in one view.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger aria-label="Planning year" className="w-[148px] border-[#d8e0ec] bg-white shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            disabled={(data?.summary.total_planned ?? 0) === 0 || isPreparingExport}
            onClick={() => void handleAnnualExport()}
          >
            {isPreparingExport ? <Spinner /> : <Download className="h-4 w-4" />}
            Export annual plan
          </Button>
          <Button size="icon" variant="ghost" aria-label="Refresh planning" disabled={isFetching} onClick={() => void refetch()}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, Icon, tone ,color}) => {
          const style = TONE_STYLES[tone]
          return (
            <Card key={label} className={`rounded-lg border-[#e5eaf1] bg-${color}-100 shadow-sm ${isLoading ? "animate-pulse" : ""}`}>
              <CardContent className="flex items-start justify-between p-4">
                <div>
                  <p className={`text-sm text-${color}-700`}>{label}</p>
                  <div className={`mt-2 text-2xl font-semibold ${style.value}`}>
                    {isLoading ? <Spinner className="h-5 w-5" /> : value}
                  </div>
                </div>
                <span className={`rounded-lg p-2.5 ${style.iconSurface}`}><Icon className={`h-4 w-4 ${style.icon}`} /></span>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Card className="rounded-lg border-[#e1e7f0] bg-white shadow-sm">
        <CardHeader className="flex flex-col items-start gap-2 space-y-0 border-b border-[#edf1f6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg text-[#17233b]">{selectedYear} calibration planning sheet</CardTitle>
            <p className="mt-1 text-sm text-[#6b7a92]">Annual calibration plan by month.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 text-[#4d6693]"><span className="h-2 w-2 rounded-full bg-[#2563eb]" />Planned</span>
            <span className="inline-flex items-center gap-1.5 text-[#4d6693]"><span className="h-2 w-2 rounded-full bg-[#16a34a]" />Completed</span>
            <span className="inline-flex items-center gap-1.5 text-[#4d6693]"><span className="h-2 w-2 rounded-full bg-[#f97316]" />Pending</span>
            <span className="inline-flex items-center gap-1.5 text-[#4d6693]"><span className="h-2 w-2 rounded-full bg-[#ef4444]" />Overdue</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center"><Spinner className="h-5 w-5 text-primary" /></div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(data?.months ?? []).map((month) => {
                const completion = completionPercentage(month)
                const pending = month.upcoming + month.due_soon
                const tone = getMonthCardTone(month, selectedYear)
                const style = MONTH_CARD_STYLES[tone]
                return (
                  <Link
                    key={month.month}
                    to={`/reports/calibration-due-report/${selectedYear}/${month.month}`}
                    aria-label={`View ${CALIBRATION_MONTHS[month.month - 1]} ${selectedYear} calibration plan`}
                    className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
                  >
                    <Card className={`min-h-[178px] rounded-lg shadow-none transition-shadow group-hover:shadow-sm ${style.card}`}>
                      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 px-4 pb-2 pt-3">
                        <CardTitle className={`text-base ${style.title}`}>{CALIBRATION_MONTHS[month.month - 1]}</CardTitle>
                        <Badge variant="outline" className={`h-6 px-2 text-[11px] font-semibold ${style.badge}`}>{month.planned} gauges</Badge>
                      </CardHeader>
                      <CardContent className="space-y-3 px-4 pb-3 pt-0">
                        {tone === "neutral" && <p className={`text-xs ${style.muted}`}>No gauges planned</p>}
                        <div className="grid grid-cols-4 gap-2">
                          <div><p className={`text-[11px] font-medium ${style.muted}`}>Planned</p><p className={`mt-1 text-sm font-semibold ${style.planned}`}>{month.planned}</p></div>
                          <div><p className={`text-[11px] font-medium ${style.muted}`}>Completed</p><p className={`mt-1 text-sm font-semibold ${style.completed}`}>{month.completed}</p></div>
                          <div><p className={`text-[11px] font-medium ${style.muted}`}>Pending</p><p className={`mt-1 text-sm font-semibold ${style.pending}`}>{pending}</p></div>
                          <div><p className={`text-[11px] font-medium ${style.muted}`}>Overdue</p><p className={`mt-1 text-sm font-semibold ${style.overdue}`}>{month.overdue}</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`shrink-0 text-[11px] font-medium ${style.muted}`}>Completion</span>
                          <Progress value={completion} indicatorClassName={style.progress} className="h-2 bg-white/75" aria-label={`${CALIBRATION_MONTHS[month.month - 1]} completion`} />
                          <span className={`w-9 text-right text-[11px] font-semibold ${style.title}`}>{completion}%</span>
                        </div>
                        <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${style.action}`}>
                          View Plan <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CalibrationDueReportPrintPreview
        open={isExportPreviewOpen}
        onOpenChange={setIsExportPreviewOpen}
        rows={exportRows}
        companyName={organizationName}
        companyAddress={organizationAddress}
        selectedPeriodLabel={`Calibration Planning ${selectedYear}`}
      />
    </div>
  )
}
