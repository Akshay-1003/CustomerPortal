import { useEffect, useMemo, useState } from "react"
import { Search, PrinterCheckIcon, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAllGauges } from "@/hooks/useGauges"
import { useCurrentOrganizationPrintInfo } from "@/hooks/useCurrentOrganizationPrintInfo"
import { parseDate } from "@/lib/calibrationUtils"
import {
  CalibrationDueReportPrintPreview,
  type CalibrationDueReportPrintRow,
} from "@/components/reports/CalibrationDueReportPrintPreview"

const ITEMS_PER_PAGE = 10

const MONTH_OPTIONS = [
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
] as const

type DueMonitoringStatus = "overdue" | "pending" | "completed"

type DueMonitoringMeta = {
  key: DueMonitoringStatus
  label: string
  badgeClassName: string
  daysLabel: string
  sortOrder: number
}

type DueMonitoringRow = {
  id: string
  serialNo: number
  gaugeName: string
  identificationNo: string
  calibrationFrequency: string
  lastCalibrationDate: string
  dueDateText: string
  daysText: string
  statusLabel: string
  statusKey: DueMonitoringStatus
  statusBadgeClassName: string
  referenceDate: Date
  daysUntilDue: number | null
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

function formatDateDDMMYYYY(value?: string | null): string {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  return date.toLocaleDateString("en-GB")
}

function getDaysUntilDue(dueDate: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const normalizedDueDate = new Date(dueDate)
  normalizedDueDate.setHours(0, 0, 0, 0)

  return Math.round((normalizedDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getCompletedMonitoringMeta(): DueMonitoringMeta {
  return {
    key: "completed",
    label: "Completed",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    daysLabel: "Completed",
    sortOrder: 2,
  }
}

function getPlannedMonitoringMeta(daysUntilDue: number): DueMonitoringMeta {
  if (daysUntilDue < 0) {
    const daysOverdue = Math.abs(daysUntilDue)
    return {
      key: "overdue",
      label: "Overdue",
      badgeClassName: "border-red-200 bg-red-50 text-red-700",
      daysLabel: `${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`,
      sortOrder: 0,
    }
  }

  return {
    key: "pending",
    label: "Calibration Pending",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    daysLabel: daysUntilDue === 0 ? "Due today" : `${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"} remaining`,
    sortOrder: 1,
  }
}

function getSelectedPeriodMode(selectedYear: number, selectedMonth: number, today: Date) {
  const currentPeriod = today.getFullYear() * 12 + today.getMonth()
  const selectedPeriod = selectedYear * 12 + selectedMonth

  if (selectedPeriod < currentPeriod) {
    return {
      label: "Past Plan Review",
      toneClassName: "border-slate-200 bg-slate-50 text-slate-700",
      description: "Review completed work and unresolved overdue gauges from previous planning periods.",
    }
  }

  if (selectedPeriod > currentPeriod) {
    return {
      label: "Future Plan",
      toneClassName: "border-blue-200 bg-blue-50 text-blue-700",
      description: "Review upcoming planned gauges and prepare calibration execution for the selected period.",
    }
  }

  return {
    label: "Current Month Plan",
    toneClassName: "border-primary/20 bg-primary/5 text-primary",
    description: "Track the live month plan, including completed work, pending gauges, and overdue carry-forward.",
  }
}

export function CalibrationDueReportPage() {
  const today = useMemo(() => new Date(), [])
  const { organizationName, organizationAddress } = useCurrentOrganizationPrintInfo()
  const { data: gauges = [], isLoading, isFetching, isError, error } = useAllGauges()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | DueMonitoringStatus>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()))
  const [selectedMonth, setSelectedMonth] = useState(String(today.getMonth()))
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)

  const availableYears = useMemo(() => {
    const years = new Set<number>([today.getFullYear()])

    gauges.forEach((gauge) => {
      const calibrationDate = parseDate(gauge.certificate_issue_date)
      const nextCalibrationDate = parseDate(gauge.next_calibration_date)

      if (calibrationDate) years.add(calibrationDate.getFullYear())
      if (nextCalibrationDate) years.add(nextCalibrationDate.getFullYear())
    })

    return Array.from(years).sort((a, b) => b - a)
  }, [gauges, today])

  const selectedPeriodRows = useMemo<DueMonitoringRow[]>(() => {
    const year = Number(selectedYear)
    const month = Number(selectedMonth)

    return gauges
      .flatMap((gauge) => {
        const calibrationDate = parseDate(gauge.certificate_issue_date)
        const nextCalibrationDate = parseDate(gauge.next_calibration_date)
        const rows: DueMonitoringRow[] = []
        const gaugeName = gauge.master_gauge || gauge.master_gauge_name || "N/A"
        const identificationNo = gauge.identification_number || "N/A"
        const calibrationFrequency = gauge.calibration_frequency
          ? `${gauge.calibration_frequency} ${gauge.calibration_frequency_unit || ""}`.trim()
          : "N/A"

        if (calibrationDate && calibrationDate.getFullYear() === year && calibrationDate.getMonth() === month) {
          const completedMeta = getCompletedMonitoringMeta()

          rows.push({
            id: `${gauge.id}:completed:${calibrationDate.toISOString()}`,
            serialNo: 0,
            gaugeName,
            identificationNo,
            calibrationFrequency,
            lastCalibrationDate: formatDateDDMMYYYY(gauge.certificate_issue_date),
            dueDateText: formatDateDDMMYYYY(gauge.next_calibration_date),
            daysText: completedMeta.daysLabel,
            statusLabel: completedMeta.label,
            statusKey: completedMeta.key,
            statusBadgeClassName: completedMeta.badgeClassName,
            referenceDate: calibrationDate,
            daysUntilDue: null,
          })
        }

        if (nextCalibrationDate && nextCalibrationDate.getFullYear() === year && nextCalibrationDate.getMonth() === month) {
          const daysUntilDue = getDaysUntilDue(nextCalibrationDate)
          const plannedMeta = getPlannedMonitoringMeta(daysUntilDue)

          rows.push({
            id: `${gauge.id}:planned:${nextCalibrationDate.toISOString()}`,
            serialNo: 0,
            gaugeName,
            identificationNo,
            calibrationFrequency,
            lastCalibrationDate: formatDateDDMMYYYY(gauge.certificate_issue_date),
            dueDateText: formatDateDDMMYYYY(gauge.next_calibration_date),
            daysText: plannedMeta.daysLabel,
            statusLabel: plannedMeta.label,
            statusKey: plannedMeta.key,
            statusBadgeClassName: plannedMeta.badgeClassName,
            referenceDate: nextCalibrationDate,
            daysUntilDue,
          })
        }

        return rows
      })
      .sort((left, right) => {
        const leftMeta =
          left.statusKey === "completed"
            ? getCompletedMonitoringMeta()
            : getPlannedMonitoringMeta(left.daysUntilDue ?? 0)
        const rightMeta =
          right.statusKey === "completed"
            ? getCompletedMonitoringMeta()
            : getPlannedMonitoringMeta(right.daysUntilDue ?? 0)

        if (leftMeta.sortOrder !== rightMeta.sortOrder) {
          return leftMeta.sortOrder - rightMeta.sortOrder
        }

        const dateDifference = left.referenceDate.getTime() - right.referenceDate.getTime()
        if (dateDifference !== 0) return dateDifference

        return left.gaugeName.localeCompare(right.gaugeName)
      })
      .map((row, index) => ({
        ...row,
        serialNo: index + 1,
      }))
  }, [gauges, selectedMonth, selectedYear])

  const statusSummary = useMemo(() => {
    return selectedPeriodRows.reduce(
      (summary, row) => {
        summary[row.statusKey] += 1
        return summary
      },
      { overdue: 0, pending: 0, completed: 0 }
    )
  }, [selectedPeriodRows])

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return selectedPeriodRows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        [row.gaugeName, row.identificationNo, row.calibrationFrequency]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)

      const matchesStatus = statusFilter === "all" || row.statusKey === statusFilter

      return matchesQuery && matchesStatus
    })
  }, [query, selectedPeriodRows, statusFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, selectedMonth, selectedYear, statusFilter])

  const totalItems = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredRows.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredRows, currentPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const filteredIdSet = useMemo(() => new Set(filteredRows.map((row) => row.id)), [filteredRows])
  const currentPageIds = useMemo(() => paginatedRows.map((row) => row.id), [paginatedRows])
  const selectedCurrentPageCount = useMemo(() => {
    return currentPageIds.reduce((count, id) => count + (selectedIds.has(id) ? 1 : 0), 0)
  }, [currentPageIds, selectedIds])
  const allCurrentPageSelected = paginatedRows.length > 0 && selectedCurrentPageCount === paginatedRows.length
  const someCurrentPageSelected = selectedCurrentPageCount > 0 && !allCurrentPageSelected

  useEffect(() => {
    setSelectedIds((previous) => {
      if (previous.size === 0) return previous
      const next = new Set<string>()
      previous.forEach((id) => {
        if (filteredIdSet.has(id)) next.add(id)
      })
      return next
    })
  }, [filteredIdSet])

  const selectedPeriodLabel = useMemo(() => {
    const monthLabel = MONTH_OPTIONS.find((option) => option.value === selectedMonth)?.label || "Selected Month"
    return `${monthLabel} ${selectedYear}`
  }, [selectedMonth, selectedYear])

  const selectedPeriodMode = useMemo(() => {
    return getSelectedPeriodMode(Number(selectedYear), Number(selectedMonth), today)
  }, [selectedMonth, selectedYear, today])

  const printSourceRows = useMemo(() => {
    const selectedRows = filteredRows.filter((row) => selectedIds.has(row.id))
    return selectedRows.length > 0 ? selectedRows : filteredRows
  }, [filteredRows, selectedIds])

  const printRows = useMemo<CalibrationDueReportPrintRow[]>(() => {
    return printSourceRows.map((row, index) => ({
      serialNo: index + 1,
      gaugeName: row.gaugeName,
      identificationNo: row.identificationNo,
      calibrationFrequency: row.calibrationFrequency,
      lastCalibrationDate: row.lastCalibrationDate,
      dueDate: row.dueDateText,
      daysWindow: row.daysText,
      currentStatus: row.statusLabel,
    }))
  }, [printSourceRows])

  const resetFilters = () => {
    setQuery("")
    setStatusFilter("all")
    setSelectedIds(new Set())
    setSelectedYear(String(today.getFullYear()))
    setSelectedMonth(String(today.getMonth()))
  }

  const handleQuickStatusFilter = (nextStatus: DueMonitoringStatus) => {
    setStatusFilter((currentStatus) => (currentStatus === nextStatus ? "all" : nextStatus))
  }

  const toggleRowSelection = (id: string, checked: boolean) => {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleSelectCurrentPage = (checked: boolean) => {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      currentPageIds.forEach((id) => {
        if (checked) next.add(id)
        else next.delete(id)
      })
      return next
    })
  }

  const handleOpenPrintPreview = () => {
    if (printRows.length === 0) {
      toast.error("No filtered due gauges available to print.")
      return
    }

    setIsPrintPreviewOpen(true)
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{getErrorMessage(error, "Failed to load due report")}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-5 w-full">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Calibration Planning</h2>
        <p className="text-sm text-muted-foreground">
          Review future plans, current month execution, and past completed or overdue plans from one screen.
        </p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardDescription>
                Choose a year and month to review planned gauges for that period and filter them by execution status.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button onClick={handleOpenPrintPreview} disabled={filteredRows.length === 0}>
                <PrinterCheckIcon className="h-4 w-4" />
                Print Report
              </Button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[160px_180px_minmax(0,1fr)_180px]">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by gauge name, identification, or frequency..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Status filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <Badge variant="outline" className={selectedPeriodMode.toneClassName}>
                  {selectedPeriodMode.label}
                </Badge>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {selectedPeriodMode.description}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Selected Period: <span className="font-medium text-foreground">{selectedPeriodLabel}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Button
              size="sm"
              variant={statusFilter === "all" ? "default" : "outline"}
              className={`justify-start ${statusFilter === "all" ? "" : "border-border/70 bg-background text-foreground hover:bg-muted"}`}
              onClick={() => setStatusFilter("all")}
            >
              Total Planned: {selectedPeriodRows.length}
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "overdue" ? "default" : "outline"}
              className={`justify-start border-red-200 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white ${statusFilter === "overdue" ? "bg-red-600 text-white" : ""}`}
              onClick={() => handleQuickStatusFilter("overdue")}
            >
              Overdue: {statusSummary.overdue}
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "pending" ? "default" : "outline"}
              className={`justify-start border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white ${statusFilter === "pending" ? "bg-amber-500 text-white" : ""}`}
              onClick={() => handleQuickStatusFilter("pending")}
            >
              Pending: {statusSummary.pending}
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "completed" ? "default" : "outline"}
              className={`justify-start border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white ${statusFilter === "completed" ? "bg-emerald-600 text-white" : ""}`}
              onClick={() => handleQuickStatusFilter("completed")}
            >
              Completed: {statusSummary.completed}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{selectedPeriodLabel}</p>
              <p className="text-sm text-muted-foreground">
                {selectedPeriodRows.length} gauge{selectedPeriodRows.length === 1 ? "" : "s"} planned in the selected period
              </p>
            </div>
            {selectedIds.size > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedIds.size} selected for print/export
              </p>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[48px]">
                    <Checkbox
                      checked={allCurrentPageSelected ? true : someCurrentPageSelected ? "indeterminate" : false}
                      onCheckedChange={(value) => toggleSelectCurrentPage(value === true)}
                      aria-label="Select current page rows"
                    />
                  </TableHead>
                  <TableHead className="w-[72px] whitespace-nowrap">Sr No</TableHead>
                  <TableHead>Gauge Name</TableHead>
                  <TableHead>Identification No.</TableHead>
                  <TableHead>Calibration Frequency</TableHead>
                  <TableHead>Last Calibration Date</TableHead>
                  <TableHead>Next Calibration Date</TableHead>
                  <TableHead>Days Remaining</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isFetching ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                        Loading planned gauges...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedRows.length > 0 ? (
                  paginatedRows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/20">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={(value) => toggleRowSelection(row.id, value === true)}
                          aria-label={`Select ${row.identificationNo}`}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{row.serialNo}</TableCell>
                      <TableCell className="font-medium">{row.gaugeName}</TableCell>
                      <TableCell className="whitespace-nowrap">{row.identificationNo}</TableCell>
                      <TableCell className="whitespace-nowrap">{row.calibrationFrequency}</TableCell>
                      <TableCell className="whitespace-nowrap">{row.lastCalibrationDate}</TableCell>
                      <TableCell className="whitespace-nowrap">{row.dueDateText}</TableCell>
                      <TableCell className="whitespace-nowrap">{row.daysText}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={row.statusBadgeClassName}>
                          {row.statusLabel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No gauges are planned for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className={`mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isLoading || isFetching ? "opacity-70" : ""}`}>
            <p className="text-sm text-muted-foreground">
              {totalItems > 0
                ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of ${totalItems}`
                : "Showing 0 to 0 of 0"}
            </p>

            {totalPages > 1 && (
              <div className="flex justify-end">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                        className={currentPage === 1 || isLoading || isFetching ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => setCurrentPage(page)}
                          className={isLoading || isFetching ? "pointer-events-none opacity-50" : ""}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
                        className={currentPage === totalPages || isLoading || isFetching ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CalibrationDueReportPrintPreview
        open={isPrintPreviewOpen}
        onOpenChange={setIsPrintPreviewOpen}
        rows={printRows}
        companyName={organizationName}
        companyAddress={organizationAddress}
        selectedPeriodLabel={selectedPeriodLabel}
      />
    </div>
  )
}
