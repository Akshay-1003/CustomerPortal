import { Fragment, useMemo, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileCheck2,
  RefreshCw,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  CalibrationDueReportPrintPreview,
  type CalibrationDueReportPrintRow,
} from "@/components/reports/CalibrationDueReportPrintPreview"
import {
  MonthlyPlanningCard,
  MonthlyPlanningCardSkeleton,
} from "@/components/reports/MonthlyPlanningCard"
import { useCalibrationPlanningDetails, useCalibrationPlanningOverview } from "@/hooks/useCalibrationPlanning"
import {
  CALIBRATION_MONTHS,
  CALIBRATION_STATUS_LABELS,
  formatCalibrationDate,
  formatPlanningDays,
  toCalibrationPlanningPrintRows,
} from "@/lib/calibrationPlanningReport"
import { getMonthlyPlanningStatus } from "@/lib/monthlyPlanningCard"
import { useCurrentOrganizationPrintInfo } from "@/hooks/useCurrentOrganizationPrintInfo"
import { calibrationPlanningService } from "@/services/calibrationPlanning.service"
import type { CalibrationPlanningStatus } from "@/types/calibrationPlanning"

const PAGE_SIZE = 25

const STATUS_OPTIONS: Array<{ key: CalibrationPlanningStatus; label: string }> = [
  { key: "completed", label: "Completed" },
  { key: "upcoming", label: "Pending / Scheduled" },
  { key: "due_soon", label: "Due Soon" },
  { key: "overdue", label: "Overdue" },
]

const STATUS_FILTER_OPTIONS: Array<{ key: CalibrationPlanningStatus | "all"; label: string }> = [
  { key: "all", label: "All statuses" },
  ...STATUS_OPTIONS,
]

const SORT_OPTIONS = [
  { key: "due_date", label: "Due date" },
  { key: "gauge_name", label: "Gauge name" },
  { key: "identification_number", label: "Identification no." },
  { key: "status", label: "Status" },
] as const

const STATUS_BADGE_CLASS: Record<CalibrationPlanningStatus, string> = {
  completed: "border-[#b8e5d5] bg-[#ecf9f3] text-[#13795b]",
  due_soon: "border-[#f5d69b] bg-[#fff7e8] text-[#a65300]",
  upcoming: "border-[#bfd4ff] bg-[#eef4ff] text-[#1d4ed8]",
  overdue: "border-[#f4c4c0] bg-[#fff1f0] text-[#b83131]",
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Unable to load the month plan."
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const start = Math.max(2, Math.min(currentPage - 2, totalPages - 5))
  const end = Math.min(totalPages - 1, start + 3)
  return [1, ...Array.from({ length: end - start + 1 }, (_, index) => start + index), totalPages]
}

export function CalibrationPlanningMonthDetailsPage() {
  const navigate = useNavigate()
  const { year: yearParam, month: monthParam } = useParams()
  const parsedYear = Number(yearParam)
  const parsedMonth = Number(monthParam)
  const validRoute = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100 && Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
  const year = validRoute ? parsedYear : new Date().getFullYear()
  const month = validRoute ? parsedMonth : 1
  const monthName = CALIBRATION_MONTHS[month - 1]
  const { organizationName, organizationAddress } = useCurrentOrganizationPrintInfo()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<CalibrationPlanningStatus | "all">("all")
  const [sortBy, setSortBy] = useState<"due_date" | "gauge_name" | "identification_number" | "status">("due_date")
  const [page, setPage] = useState(0)
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false)
  const [exportRows, setExportRows] = useState<CalibrationDueReportPrintRow[]>([])
  const [isPreparingExport, setIsPreparingExport] = useState(false)
  const overviewQuery = useCalibrationPlanningOverview(year)
  const detailsQuery = useCalibrationPlanningDetails(
    {
      year,
      month,
      search,
      status: status === "all" ? undefined : status,
      sortBy,
      page,
      limit: PAGE_SIZE,
    },
    validRoute
  )

  const monthSummary = useMemo(
    () => overviewQuery.data?.months.find((item) => item.month === month),
    [month, overviewQuery.data?.months]
  )
  const pending = (monthSummary?.upcoming ?? 0) + (monthSummary?.due_soon ?? 0)
  const totalPages = Math.max(1, Math.ceil((detailsQuery.data?.total ?? 0) / PAGE_SIZE))
  const visiblePages = useMemo(() => getVisiblePages(page + 1, totalPages), [page, totalPages])

  const handleExport = async () => {
    setIsPreparingExport(true)
    try {
      const response = await calibrationPlanningService.getDetails({
        year,
        month,
        search,
        status: status === "all" ? undefined : status,
        sortBy,
        limit: 500,
      })
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

  if (!validRoute) {
    return <Navigate to="/reports/calibration-due-report" replace />
  }

  if (detailsQuery.isError) {
    return (
      <Card className="border-[#f2c9c9] bg-[#fff8f8] shadow-none">
        <CardContent className="flex flex-row items-center justify-between gap-4 p-5">
          <div>
            <p className="font-semibold text-[#9f2727]">Unable to load {monthName} calibration plan</p>
            <p className="mt-1 text-sm text-[#8b5f5f]">{getErrorMessage(detailsQuery.error)}</p>
          </div>
          <Button variant="destructive" onClick={() => void detailsQuery.refetch()}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const rows = detailsQuery.data?.data ?? []

  return (
    <div className="space-y-5 text-[#17233b]">
      <section className="border-b border-[#e6ebf2] pb-5">
        <Breadcrumb className="mb-3">
          <BreadcrumbList className="text-[#6b7a92]">
            <BreadcrumbItem>
              <BreadcrumbLink href="/reports/calibration-due-report">Calibration planning</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><span>{year}</span></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{monthName}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex gap-3">
            <Button size="icon" variant="outline" aria-label="Back to calibration calendar" onClick={() => navigate("/reports/calibration-due-report")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{monthName} {year}</h1>
                <Badge variant="primary" className="font-medium">Monthly plan</Badge>
              </div>
              <p className="mt-1 text-sm text-[#6b7a92]">Gauge calibration schedule, certificate references, and current progress.</p>
            </div>
          </div>
          <Button variant="outline" disabled={isPreparingExport} onClick={() => void handleExport()}>
            {isPreparingExport ? <Spinner /> : <Download className="h-4 w-4" />}
            Download PDF / CSV
          </Button>
        </div>
      </section>

      {overviewQuery.isLoading ? (
        <MonthlyPlanningCardSkeleton variant="detailed" />
      ) : (
        <MonthlyPlanningCard
          variant="detailed"
          month={monthName}
          year={year}
          planned={monthSummary?.planned ?? 0}
          completed={monthSummary?.completed ?? 0}
          pending={pending}
          overdue={monthSummary?.overdue ?? 0}
          weeklyPlan={monthSummary?.weekly_plan}
          status={getMonthlyPlanningStatus({
            planned: monthSummary?.planned ?? 0,
            completed: monthSummary?.completed ?? 0,
            pending,
            overdue: monthSummary?.overdue ?? 0,
          })}
          onViewPlan={() => document.getElementById("planned-gauges")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        />
      )}

      <Card id="planned-gauges" className="rounded-lg border-[#e1e7f0] bg-white shadow-sm">
        <CardHeader className="flex flex-col items-start gap-3 space-y-0 border-b border-[#edf1f6] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle className="text-lg">Planned gauges</CardTitle>
            <p className="mt-1 text-sm text-[#6b7a92]">Search and filter the complete {monthName} calibration list.</p>
          </div>
          {detailsQuery.isFetching && <Spinner className="text-primary" />}
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b889e]" />
              <Input
                aria-label="Search planned gauges"
                placeholder="Search gauge, identification, frequency, or certificate"
                value={search}
                className="border-[#d8e0ec] bg-white pl-9 shadow-none"
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(0)
                }}
              />
            </div>
            <Select value={status} onValueChange={(value) => {
              setStatus(value as CalibrationPlanningStatus | "all")
              setPage(0)
            }}>
              <SelectTrigger aria-label="Filter by status" className="border-[#d8e0ec] bg-white shadow-none"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_FILTER_OPTIONS.map((option) => <SelectItem key={option.key} value={option.key}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger aria-label="Sort planned gauges" className="border-[#d8e0ec] bg-white shadow-none"><SelectValue /></SelectTrigger>
              <SelectContent>{SORT_OPTIONS.map((option) => <SelectItem key={option.key} value={option.key}>{`Sort: ${option.label}`}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="min-h-[360px] overflow-hidden rounded-lg border border-[#e0e7f0]">
            <Table>
              <TableHeader className="bg-[#f7f9fc]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[70px] px-3 text-xs font-semibold uppercase tracking-wide text-[#66758d]">Sr No</TableHead>
                  <TableHead className="px-3 text-xs font-semibold uppercase tracking-wide text-[#66758d]">Gauge name</TableHead>
                  <TableHead className="px-3 text-xs font-semibold uppercase tracking-wide text-[#66758d]">Identification no.</TableHead>
                  <TableHead className="px-3 text-xs font-semibold uppercase tracking-wide text-[#66758d]">Frequency</TableHead>
                  <TableHead className="px-3 text-xs font-semibold uppercase tracking-wide text-[#66758d]">Last calibration</TableHead>
                  <TableHead className="px-3 text-xs font-semibold uppercase tracking-wide text-[#66758d]">Due date</TableHead>
                  <TableHead className="px-3 text-xs font-semibold uppercase tracking-wide text-[#66758d]">Certificate details</TableHead>
                  <TableHead className="px-3 text-xs font-semibold uppercase tracking-wide text-[#66758d]">Days remaining</TableHead>
                  <TableHead className="px-3 text-xs font-semibold uppercase tracking-wide text-[#66758d]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailsQuery.isLoading ? (
                  <TableRow><TableCell colSpan={9} className="h-64 text-center"><Spinner className="mx-auto h-5 w-5 text-primary" /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="h-64 text-center text-[#6b7a92]">No gauges match the selected filters.</TableCell></TableRow>
                ) : rows.map((row, index) => {
                  const certificateNo = row.completion_certificate_no || row.last_certificate_no
                  const certificateUrl = row.completion_certificate_url || row.last_certificate_url
                  return (
                    <TableRow key={row.id} className="border-[#edf1f6] hover:bg-[#f9fbfe]">
                      <TableCell className="px-3 text-[#27344b]">{page * PAGE_SIZE + index + 1}</TableCell>
                      <TableCell className="min-w-[180px] px-3 font-medium text-[#27344b]">{row.gauge_name}</TableCell>
                      <TableCell className="whitespace-nowrap px-3 text-[#27344b]">{row.identification_number || "N/A"}</TableCell>
                      <TableCell className="whitespace-nowrap px-3 text-[#27344b]">{row.frequency_label}</TableCell>
                      <TableCell className="whitespace-nowrap px-3 text-[#27344b]">{formatCalibrationDate(row.last_calibration_date)}</TableCell>
                      <TableCell className="whitespace-nowrap px-3 font-medium text-[#27344b]">{formatCalibrationDate(row.due_date)}</TableCell>
                      <TableCell className="min-w-[160px] px-3">
                        {certificateUrl ? (
                          <a href={certificateUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-[#2563eb] hover:underline">
                            {certificateNo || "View certificate"}<ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : certificateNo ? (
                          <span className="inline-flex items-center gap-1 text-sm text-[#52627d]"><FileCheck2 className="h-3.5 w-3.5" />{certificateNo}</span>
                        ) : <span className="text-sm text-[#8a96a9]">Not available</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 text-[#27344b]">{formatPlanningDays(row)}</TableCell>
                      <TableCell className="px-3"><Badge variant="outline" className={STATUS_BADGE_CLASS[row.status]}>{CALIBRATION_STATUS_LABELS[row.status]}</Badge></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#edf1f6] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#6b7a92]">
              {(detailsQuery.data?.total ?? 0) > 0
                ? `Showing ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, detailsQuery.data?.total ?? 0)} of ${detailsQuery.data?.total} gauges`
                : "No matching gauges"}
            </p>
            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto sm:ml-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      aria-disabled={page === 0}
                      tabIndex={page === 0 ? -1 : undefined}
                      className={page === 0 ? "pointer-events-none opacity-50" : ""}
                      onClick={(event) => {
                        event.preventDefault()
                        if (page > 0) setPage(page - 1)
                      }}
                    />
                  </PaginationItem>
                  {visiblePages.map((pageNumber, index) => (
                    <Fragment key={pageNumber}>
                      {index > 0 && pageNumber - visiblePages[index - 1] > 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                      <PaginationItem>
                        <PaginationLink href="#" isActive={page === pageNumber - 1} onClick={(event) => {
                          event.preventDefault()
                          setPage(pageNumber - 1)
                        }}>{pageNumber}</PaginationLink>
                      </PaginationItem>
                    </Fragment>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      aria-disabled={page + 1 >= totalPages}
                      tabIndex={page + 1 >= totalPages ? -1 : undefined}
                      className={page + 1 >= totalPages ? "pointer-events-none opacity-50" : ""}
                      onClick={(event) => {
                        event.preventDefault()
                        if (page + 1 < totalPages) setPage(page + 1)
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </Card>

      <CalibrationDueReportPrintPreview
        open={isExportPreviewOpen}
        onOpenChange={setIsExportPreviewOpen}
        rows={exportRows}
        companyName={organizationName}
        companyAddress={organizationAddress}
        selectedPeriodLabel={`${monthName} ${year}`}
      />
    </div>
  )
}
