import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertTriangle,
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
  Icon: typeof CalendarDays
}

const TONE_STYLES = {
  blue: { icon: "text-[#2563eb]", iconSurface: "bg-[#eaf1ff]", value: "text-[#1d4ed8]" },
  green: { icon: "text-[#168566]", iconSurface: "bg-[#e7f7f0]", value: "text-[#13795b]" },
  amber: { icon: "text-[#be6506]", iconSurface: "bg-[#fff4df]", value: "text-[#a65300]" },
  red: { icon: "text-[#d13d3d]", iconSurface: "bg-[#fff0ef]", value: "text-[#b83131]" },
  slate: { icon: "text-[#52627d]", iconSurface: "bg-[#eef2f7]", value: "text-[#17233b]" },
} as const

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Unable to load calibration planning."
}

function completionPercentage(month: CalibrationPlanningMonth) {
  return month.planned > 0 ? Math.round((month.completed / month.planned) * 100) : 0
}

function MonthStatusSummary({ month }: { month: CalibrationPlanningMonth }) {
  const pending = month.upcoming + month.due_soon
  const statuses = [
    month.completed > 0 ? { label: `Completed ${month.completed}`, className: "border-[#b8e5d5] bg-[#ecf9f3] text-[#13795b]" } : null,
    pending > 0 ? { label: `Pending ${pending}`, className: "border-[#f5d69b] bg-[#fff7e8] text-[#a65300]" } : null,
    month.overdue > 0 ? { label: `Overdue ${month.overdue}`, className: "border-[#f4c4c0] bg-[#fff1f0] text-[#b83131]" } : null,
  ].filter(Boolean) as Array<{ label: string; className: string }>

  if (statuses.length === 0) {
    return <p className="text-xs text-[#7a879c]">No calibrations scheduled</p>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {statuses.map((status) => (
        <Badge key={status.label} variant="outline" className={`h-6 px-2 text-[11px] font-medium ${status.className}`}>
          {status.label}
        </Badge>
      ))}
    </div>
  )
}

export function CalibrationDueReportPage() {
  const navigate = useNavigate()
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
    { label: "Total Planned", value: data?.summary.total_planned ?? 0, Icon: CalendarDays, tone: "slate" },
    { label: "Completed", value: data?.summary.completed ?? 0, Icon: CheckCircle2, tone: "green" },
    { label: "Pending", value: (data?.summary.upcoming ?? 0) + (data?.summary.due_soon ?? 0), Icon: Clock3, tone: "amber" },
    { label: "Overdue", value: data?.summary.overdue ?? 0, Icon: AlertTriangle, tone: "red" },
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
        {summaryCards.map(({ label, value, Icon, tone }) => {
          const style = TONE_STYLES[tone]
          return (
            <Card key={label} className="rounded-lg border-[#e4eaf2] bg-white shadow-sm">
              <CardContent className="flex items-start justify-between p-4">
                <div>
                  <p className="text-sm text-[#6b7a92]">{label}</p>
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
            <CardTitle className="text-lg text-[#17233b]">{selectedYear} calibration calendar</CardTitle>
            <p className="mt-1 text-sm text-[#6b7a92]">Select a month to view its gauges, certificate references, and downloadable report.</p>
          </div>
          <Badge variant="primary" className="font-medium">{data?.summary.total_planned ?? 0} planned</Badge>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center"><Spinner className="h-5 w-5 text-primary" /></div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(data?.months ?? []).map((month) => {
                const completion = completionPercentage(month)
                const openMonth = () => navigate(`/reports/calibration-due-report/${selectedYear}/${month.month}`)
                return (
                  <Card
                    key={month.month}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${CALIBRATION_MONTHS[month.month - 1]} ${selectedYear} calibration plan`}
                    className="min-h-[188px] cursor-pointer rounded-lg border-[#e5eaf1] bg-white text-left shadow-none transition-shadow hover:border-[#9db8ff] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
                    onClick={openMonth}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        openMonth()
                      }
                    }}
                  >
                    <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 px-4 pb-0 pt-4">
                      <div>
                        <CardTitle className="text-base text-[#17233b]">{CALIBRATION_MONTHS[month.month - 1]}</CardTitle>
                        <p className="mt-1 text-sm text-[#6b7a92]">{month.planned} planned gauge{month.planned === 1 ? "" : "s"}</p>
                      </div>
                      {month.overdue > 0 && <Badge variant="outline" className="border-[#f4c4c0] bg-[#fff1f0] text-[#b83131]">{month.overdue} overdue</Badge>}
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 pb-4 pt-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#62718a]">
                          <span>Completion</span>
                          <span className="text-[#1d4ed8]">{completion}%</span>
                        </div>
                        <Progress value={completion} indicatorClassName="bg-[#1d8b68]" className="bg-[#eaf0f7]" aria-label={`${CALIBRATION_MONTHS[month.month - 1]} completion`} />
                      </div>
                      <MonthStatusSummary month={month} />
                    </CardContent>
                  </Card>
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
