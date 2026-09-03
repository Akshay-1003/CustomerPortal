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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  CalibrationDueReportPrintPreview,
  type CalibrationDueReportPrintRow,
} from "@/components/reports/CalibrationDueReportPrintPreview"
import {
  MonthlyPlanningCard,
  MonthlyPlanningCardSkeleton,
} from "@/components/reports/MonthlyPlanningCard"
import { useCalibrationPlanningOverview } from "@/hooks/useCalibrationPlanning"
import { CALIBRATION_MONTHS, toCalibrationPlanningPrintRows } from "@/lib/calibrationPlanningReport"
import { getMonthlyPlanningStatus, type MonthlyPlanningCardStatus } from "@/lib/monthlyPlanningCard"
import { useCurrentOrganizationPrintInfo } from "@/hooks/useCurrentOrganizationPrintInfo"
import { calibrationPlanningService } from "@/services/calibrationPlanning.service"
import type { CalibrationPlanningMonth } from "@/types/calibrationPlanning"

type SummaryCard = {
  label: string
  value: number
  tone: "blue" | "green" | "amber" | "red" | "slate"
  Icon: typeof CalendarDays,
}

const TONE_STYLES = {
  blue: { root: "bg-[#f7faff]", icon: "text-[#2563eb]", iconSurface: "bg-[#eaf1ff]", value: "text-[#1d4ed8]", label: "text-[#315aab]" },
  green: { root: "bg-[#f8fdfb]", icon: "text-[#168566]", iconSurface: "bg-[#e7f7f0]", value: "text-[#13795b]", label: "text-[#2f715e]" },
  amber: { root: "bg-[#fffdfa]", icon: "text-[#be6506]", iconSurface: "bg-[#fff4df]", value: "text-[#a65300]", label: "text-[#8a5a22]" },
  red: { root: "bg-[#fffafa]", icon: "text-[#d13d3d]", iconSurface: "bg-[#fff0ef]", value: "text-[#b83131]", label: "text-[#9a3a3a]" },
  slate: { root: "bg-[#fbfcfe]", icon: "text-[#52627d]", iconSurface: "bg-[#eef2f7]", value: "text-[#17233b]", label: "text-[#52627d]" },
} as const

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Unable to load calibration planning."
}

function getMonthCardStatus(month: CalibrationPlanningMonth, selectedYear: number): MonthlyPlanningCardStatus {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const isPast = selectedYear < currentYear || (selectedYear === currentYear && month.month < currentMonth)
  const pending = month.upcoming + month.due_soon

  if (month.overdue > 0 || (isPast && month.planned > month.completed)) return "attention"
  return getMonthlyPlanningStatus({
    planned: month.planned,
    completed: month.completed,
    pending,
    overdue: month.overdue,
  })
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
    { label: "Total Planned", value: data?.summary.total_planned ?? 0, Icon: CalendarDays, tone: "blue" },
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
            <Card key={label} className={`rounded-lg border-[#e5eaf1] shadow-sm ${style.root} ${isLoading ? "animate-pulse" : ""}`}>
              <CardContent className="flex items-start justify-between p-4">
                <div>
                  <p className={`text-sm ${style.label}`}>{label}</p>
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
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 12 }, (_, index) => <MonthlyPlanningCardSkeleton key={index} />)}
            </div>
          ) : (data?.months.length ?? 0) === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <CalendarDays className="h-8 w-8 text-[#8b98aa]" aria-hidden="true" />
              <p className="mt-3 font-medium text-[#33445f]">No calibration plan for {selectedYear}</p>
              <p className="mt-1 text-sm text-[#6b7a92]">There are no gauges scheduled in the selected year.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(data?.months ?? []).map((month) => {
                const pending = month.upcoming + month.due_soon
                return (
                  <MonthlyPlanningCard
                    key={month.month}
                    month={CALIBRATION_MONTHS[month.month - 1]}
                    year={selectedYear}
                    planned={month.planned}
                    completed={month.completed}
                    pending={pending}
                    overdue={month.overdue}
                    weeklyPlan={month.weekly_plan}
                    status={getMonthCardStatus(month, selectedYear)}
                    onViewPlan={() => navigate(`/reports/calibration-due-report/${selectedYear}/${month.month}`)}
                  />
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
