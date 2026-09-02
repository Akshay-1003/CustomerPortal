import { useMemo, useState } from "react"
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
import {
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Pagination,
  Progress,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react"
import {
  CalibrationDueReportPrintPreview,
  type CalibrationDueReportPrintRow,
} from "@/components/reports/CalibrationDueReportPrintPreview"
import { useCalibrationPlanningDetails, useCalibrationPlanningOverview } from "@/hooks/useCalibrationPlanning"
import {
  CALIBRATION_MONTHS,
  CALIBRATION_STATUS_LABELS,
  formatCalibrationDate,
  formatPlanningDays,
  toCalibrationPlanningPrintRows,
} from "@/lib/calibrationPlanningReport"
import { useCurrentOrganizationPrintInfo } from "@/hooks/useCurrentOrganizationPrintInfo"
import { calibrationPlanningService } from "@/services/calibrationPlanning.service"
import type { CalibrationPlanningDetail, CalibrationPlanningStatus } from "@/types/calibrationPlanning"

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

const STATUS_COLOR: Record<CalibrationPlanningStatus, "success" | "warning" | "danger" | "primary"> = {
  completed: "success",
  due_soon: "warning",
  upcoming: "primary",
  overdue: "danger",
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Unable to load the month plan."
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
  const completion = monthSummary?.planned ? Math.round((monthSummary.completed / monthSummary.planned) * 100) : 0
  const totalPages = Math.max(1, Math.ceil((detailsQuery.data?.total ?? 0) / PAGE_SIZE))

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
      <Card className="border border-[#f2c9c9] bg-[#fff8f8] shadow-none">
        <CardBody className="flex flex-row items-center justify-between gap-4 p-5">
          <div>
            <p className="font-semibold text-[#9f2727]">Unable to load {monthName} calibration plan</p>
            <p className="mt-1 text-sm text-[#8b5f5f]">{getErrorMessage(detailsQuery.error)}</p>
          </div>
          <Button variant="flat" color="danger" startContent={<RefreshCw className="h-4 w-4" />} onPress={() => void detailsQuery.refetch()}>
            Retry
          </Button>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-5 text-[#17233b]">
      <section className="border-b border-[#e6ebf2] pb-5">
        <Breadcrumbs size="sm" className="mb-3" itemClasses={{ item: "text-[#6b7a92]", separator: "text-[#a6b0c0]" }}>
          <BreadcrumbItem onPress={() => navigate("/reports/calibration-due-report")}>Calibration planning</BreadcrumbItem>
          <BreadcrumbItem>{year}</BreadcrumbItem>
          <BreadcrumbItem>{monthName}</BreadcrumbItem>
        </Breadcrumbs>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex gap-3">
            <Button isIconOnly variant="flat" aria-label="Back to calibration calendar" onPress={() => navigate("/reports/calibration-due-report")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{monthName} {year}</h1>
                <Chip size="sm" color="primary" variant="flat">Monthly plan</Chip>
              </div>
              <p className="mt-1 text-sm text-[#6b7a92]">Gauge calibration schedule, certificate references, and current progress.</p>
            </div>
          </div>
          <Button
            color="primary"
            variant="flat"
            isLoading={isPreparingExport}
            startContent={!isPreparingExport ? <Download className="h-4 w-4" /> : undefined}
            onPress={() => void handleExport()}
          >
            Download PDF / CSV
          </Button>
        </div>
      </section>

      <Card className="border border-[#e1e7f0] bg-white shadow-sm">
        <CardBody className="gap-4 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-[#52627d]">Monthly completion</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-[#17233b]">{overviewQuery.isLoading ? "-" : `${completion}%`}</span>
                <span className="text-sm text-[#73819a]">{monthSummary?.completed ?? 0} of {monthSummary?.planned ?? 0} planned gauges completed</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip color="success" variant="flat">Completed {monthSummary?.completed ?? 0}</Chip>
              <Chip color="warning" variant="flat">Pending {(monthSummary?.upcoming ?? 0) + (monthSummary?.due_soon ?? 0)}</Chip>
              <Chip color="danger" variant="flat">Overdue {monthSummary?.overdue ?? 0}</Chip>
            </div>
          </div>
          <Progress
            aria-label={`${monthName} completion`}
            value={completion}
            size="md"
            classNames={{ track: "bg-[#eaf0f7]", indicator: "bg-[#1d8b68]" }}
          />
        </CardBody>
      </Card>

      <Card className="border border-[#e1e7f0] bg-white shadow-sm">
        <CardHeader className="flex flex-col items-start gap-3 border-b border-[#edf1f6] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Planned gauges</h2>
            <p className="mt-1 text-sm text-[#6b7a92]">Search and filter the complete {monthName} calibration list.</p>
          </div>
          {detailsQuery.isFetching && <Spinner size="sm" color="primary" />}
        </CardHeader>
        <CardBody className="gap-4 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_180px]">
            <Input
              aria-label="Search planned gauges"
              placeholder="Search gauge, identification, frequency, or certificate"
              value={search}
              startContent={<Search className="h-4 w-4 text-[#7b889e]" />}
              classNames={{ inputWrapper: "border border-[#d8e0ec] bg-white shadow-none" }}
              onValueChange={(value) => {
                setSearch(value)
                setPage(0)
              }}
            />
            <Select
              aria-label="Filter by status"
              items={STATUS_FILTER_OPTIONS}
              selectedKeys={[status]}
              classNames={{ trigger: "border border-[#d8e0ec] bg-white shadow-none" }}
              onSelectionChange={(keys) => {
                const [value] = keys === "all" ? [] : Array.from(keys)
                if (value) {
                  setStatus(value as CalibrationPlanningStatus | "all")
                  setPage(0)
                }
              }}
            >
              {(option) => <SelectItem key={option.key}>{option.label}</SelectItem>}
            </Select>
            <Select
              aria-label="Sort planned gauges"
              items={SORT_OPTIONS}
              selectedKeys={[sortBy]}
              classNames={{ trigger: "border border-[#d8e0ec] bg-white shadow-none" }}
              onSelectionChange={(keys) => {
                const [value] = keys === "all" ? [] : Array.from(keys)
                if (value) setSortBy(value as typeof sortBy)
              }}
            >
              {(option) => <SelectItem key={option.key}>{`Sort: ${option.label}`}</SelectItem>}
            </Select>
          </div>

          <Table
            aria-label={`${monthName} ${year} planned gauges`}
            classNames={{ wrapper: "min-h-[360px] rounded-lg border border-[#e0e7f0] p-0 shadow-none", th: "bg-[#f7f9fc] text-xs font-semibold uppercase tracking-wide text-[#66758d]", td: "border-b border-[#edf1f6] text-[#27344b]" }}
          >
            <TableHeader>
              <TableColumn className="w-[70px]">Sr No</TableColumn>
              <TableColumn>Gauge name</TableColumn>
              <TableColumn>Identification no.</TableColumn>
              <TableColumn>Frequency</TableColumn>
              <TableColumn>Last calibration</TableColumn>
              <TableColumn>Due date</TableColumn>
              <TableColumn>Certificate details</TableColumn>
              <TableColumn>Days remaining</TableColumn>
              <TableColumn>Status</TableColumn>
            </TableHeader>
            <TableBody<CalibrationPlanningDetail>
              items={detailsQuery.data?.data ?? []}
              emptyContent="No gauges match the selected filters."
              isLoading={detailsQuery.isLoading}
              loadingContent={<Spinner label="Loading planned gauges" color="primary" />}
            >
              {(row) => {
                const certificateNo = row.completion_certificate_no || row.last_certificate_no
                const certificateUrl = row.completion_certificate_url || row.last_certificate_url
                const index = detailsQuery.data?.data.findIndex((item) => item.id === row.id) ?? 0
                return (
                  <TableRow key={row.id}>
                    <TableCell>{page * PAGE_SIZE + index + 1}</TableCell>
                    <TableCell className="min-w-[180px] font-medium">{row.gauge_name}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.identification_number || "N/A"}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.frequency_label}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatCalibrationDate(row.last_calibration_date)}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{formatCalibrationDate(row.due_date)}</TableCell>
                    <TableCell className="min-w-[160px]">
                      {certificateUrl ? (
                        <a href={certificateUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-[#2563eb] hover:underline">
                          {certificateNo || "View certificate"}<ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : certificateNo ? (
                        <span className="inline-flex items-center gap-1 text-sm text-[#52627d]"><FileCheck2 className="h-3.5 w-3.5" />{certificateNo}</span>
                      ) : <span className="text-sm text-[#8a96a9]">Not available</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatPlanningDays(row)}</TableCell>
                    <TableCell><Chip size="sm" color={STATUS_COLOR[row.status]} variant="flat">{CALIBRATION_STATUS_LABELS[row.status]}</Chip></TableCell>
                  </TableRow>
                )
              }}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t border-[#edf1f6] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#6b7a92]">
              {(detailsQuery.data?.total ?? 0) > 0
                ? `Showing ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, detailsQuery.data?.total ?? 0)} of ${detailsQuery.data?.total} gauges`
                : "No matching gauges"}
            </p>
            {totalPages > 1 && <Pagination showControls page={page + 1} total={totalPages} color="primary" onChange={(value) => setPage(value - 1)} />}
          </div>
        </CardBody>
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
