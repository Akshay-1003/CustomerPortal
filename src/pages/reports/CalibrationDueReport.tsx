import { useMemo, useState } from "react"
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Download, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalibrationPlanningDetailDialog } from "@/components/reports/CalibrationPlanningDetailDialog"
import {
  CalibrationDueReportPrintPreview,
  type CalibrationDueReportPrintRow,
} from "@/components/reports/CalibrationDueReportPrintPreview"
import { useCalibrationPlanningOverview } from "@/hooks/useCalibrationPlanning"
import { useCurrentOrganizationPrintInfo } from "@/hooks/useCurrentOrganizationPrintInfo"
import { calibrationPlanningService } from "@/services/calibrationPlanning.service"
import type {
  CalibrationPlanningDetail,
  CalibrationPlanningMonth,
  CalibrationPlanningStatus,
} from "@/types/calibrationPlanning"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const STATUS_LABELS: Record<CalibrationPlanningStatus, string> = {
  completed: "Completed",
  due_soon: "Due Soon",
  upcoming: "Upcoming / Scheduled",
  overdue: "Overdue",
}

type DialogSelection = {
  month?: CalibrationPlanningMonth
  attentionStatus?: CalibrationPlanningStatus
} | null

function formatDate(value?: string | null) {
  if (!value) return "N/A"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-GB")
}

function toPrintRows(rows: CalibrationPlanningDetail[]): CalibrationDueReportPrintRow[] {
  return rows.map((row, index) => ({
    serialNo: index + 1,
    gaugeName: row.gauge_name,
    identificationNo: row.identification_number || "N/A",
    calibrationFrequency: row.frequency_label,
    lastCalibrationDate: formatDate(row.last_calibration_date),
    dueDate: formatDate(row.due_date),
    daysWindow: row.status === "completed" ? "Completed" : row.days_remaining == null ? "N/A" : `${Math.abs(row.days_remaining)} days`,
    currentStatus: STATUS_LABELS[row.status],
  }))
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Unable to load calibration planning."
}

export function CalibrationDueReportPage() {
  const currentYear = new Date().getFullYear()
  const { organizationName, organizationAddress } = useCurrentOrganizationPrintInfo()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [dialogSelection, setDialogSelection] = useState<DialogSelection>(null)
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false)
  const [exportRows, setExportRows] = useState<CalibrationDueReportPrintRow[]>([])
  const [exportTitle, setExportTitle] = useState("")
  const [isPreparingExport, setIsPreparingExport] = useState(false)
  const { data, isLoading, isFetching, isError, error, refetch } = useCalibrationPlanningOverview(selectedYear)

  const yearOptions = useMemo(
    () => Array.from({ length: 9 }, (_, index) => currentYear - 4 + index),
    [currentYear]
  )

  const openExport = async ({
    year,
    month,
    status,
    search,
    title,
  }: {
    year: number
    month?: number
    status?: CalibrationPlanningStatus
    search?: string
    title: string
  }) => {
    setIsPreparingExport(true)
    try {
      const response = await calibrationPlanningService.getDetails({
        year,
        month,
        status,
        search,
        limit: 500,
      })
      if (response.data.length === 0) {
        toast.error("No gauges are available for this export.")
        return
      }
      setExportRows(toPrintRows(response.data))
      setExportTitle(title)
      setIsExportPreviewOpen(true)
    } catch (exportError) {
      toast.error(getErrorMessage(exportError))
    } finally {
      setIsPreparingExport(false)
    }
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load calibration planning</AlertTitle>
        <AlertDescription className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span>{getErrorMessage(error)}</span>
          <Button variant="outline" size="sm" onClick={() => void refetch()}><RefreshCw className="h-4 w-4" />Retry</Button>
        </AlertDescription>
      </Alert>
    )
  }

  const summary = data?.summary
  const months = data?.months ?? []
  const summaryCards = [
    { label: "Total Planned", value: summary?.total_planned ?? 0, Icon: CalendarDays, textClassName: "text-foreground", backgroundClassName: "bg-muted/40" },
    { label: "Completed", value: summary?.completed ?? 0, Icon: CheckCircle2, textClassName: "text-emerald-700", backgroundClassName: "bg-emerald-50" },
    { label: "Upcoming / Scheduled", value: summary?.upcoming ?? 0, Icon: Clock3, textClassName: "text-blue-700", backgroundClassName: "bg-blue-50" },
    { label: "Due Soon", value: summary?.due_soon ?? 0, Icon: AlertTriangle, textClassName: "text-amber-700", backgroundClassName: "bg-amber-50", attentionStatus: "due_soon" as const },
    { label: "Overdue", value: summary?.overdue ?? 0, Icon: AlertTriangle, textClassName: "text-red-700", backgroundClassName: "bg-red-50", attentionStatus: "overdue" as const },
  ]

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Calibration Planning</h2>
          <p className="text-sm text-muted-foreground">See the full year first, then open a month only when you need the gauge-level plan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-[132px]"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>{yearOptions.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent>
          </Select>
          <Button
            variant="outline"
            disabled={isPreparingExport || (summary?.total_planned ?? 0) === 0}
            onClick={() => void openExport({ year: selectedYear, title: `Calibration Planning - ${selectedYear}` })}
          >
            <Download className="h-4 w-4" />
            Export Annual Plan
          </Button>
          <Button variant="outline" size="icon" aria-label="Refresh planning" disabled={isFetching} onClick={() => void refetch()}><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /></Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map(({ label, value, Icon, textClassName, backgroundClassName, attentionStatus }) => {
          return (
            <Card key={label} className="border-border/70 shadow-sm">
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className={`mt-1 text-2xl font-semibold ${textClassName}`}>{isLoading ? "-" : value}</p>
                </div>
                <div className={`rounded-md p-2 ${backgroundClassName}`}><Icon className={`h-4 w-4 ${textClassName}`} /></div>
              </CardContent>
              {attentionStatus && (
                <button
                  type="button"
                  className="w-full border-t px-4 py-2 text-left text-xs font-medium text-primary hover:bg-muted/40"
                  onClick={() => setDialogSelection({ attentionStatus })}
                >
                  View affected gauges
                </button>
              )}
            </Card>
          )
        })}
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">{selectedYear} Month-by-Month Plan</CardTitle>
            <CardDescription>Open a month to search, filter, print, or download its planned gauge list.</CardDescription>
          </div>
          <span className="text-sm text-muted-foreground">{summary?.total_planned ?? 0} planned calibration{(summary?.total_planned ?? 0) === 1 ? "" : "s"}</span>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {months.map((month) => (
              <button
                type="button"
                key={month.month}
                className="min-h-[168px] rounded-lg border border-border/70 bg-background p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => setDialogSelection({ month })}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{MONTHS[month.month - 1]}</h3>
                  <span className="text-sm font-medium text-muted-foreground">{month.planned} planned</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-emerald-700">{month.completed} completed</span>
                  <span className="text-amber-700">{month.due_soon} due soon</span>
                  <span className="text-blue-700">{month.upcoming} upcoming</span>
                  <span className="text-red-700">{month.overdue} overdue</span>
                </div>
              </button>
            ))}
          </div>
          {!isLoading && months.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No calibration planning data is available for {selectedYear}.</p>}
        </CardContent>
      </Card>

      <CalibrationPlanningDetailDialog
        key={`${selectedYear}-${dialogSelection?.month?.month ?? "attention"}-${dialogSelection?.attentionStatus ?? "all"}`}
        open={dialogSelection !== null}
        onOpenChange={(open) => !open && setDialogSelection(null)}
        year={selectedYear}
        month={dialogSelection?.month}
        attentionStatus={dialogSelection?.attentionStatus}
        onExport={(params) => void openExport(params)}
      />

      <CalibrationDueReportPrintPreview
        open={isExportPreviewOpen}
        onOpenChange={setIsExportPreviewOpen}
        rows={exportRows}
        companyName={organizationName}
        companyAddress={organizationAddress}
        selectedPeriodLabel={exportTitle}
      />
    </div>
  )
}
