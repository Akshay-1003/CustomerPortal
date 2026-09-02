import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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
import { useCalibrationPlanningDetails } from "@/hooks/useCalibrationPlanning"
import type {
  CalibrationPlanningCounts,
  CalibrationPlanningDetail,
  CalibrationPlanningMonth,
  CalibrationPlanningStatus,
} from "@/types/calibrationPlanning"

const PAGE_SIZE = 25

const STATUS_OPTIONS: Array<{ value: CalibrationPlanningStatus; label: string }> = [
  { value: "completed", label: "Completed" },
  { value: "due_soon", label: "Due Soon" },
  { value: "upcoming", label: "Upcoming / Scheduled" },
  { value: "overdue", label: "Overdue" },
]

const STATUS_STYLES: Record<CalibrationPlanningStatus, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  due_soon: "border-amber-200 bg-amber-50 text-amber-700",
  upcoming: "border-blue-200 bg-blue-50 text-blue-700",
  overdue: "border-red-200 bg-red-50 text-red-700",
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

type CalibrationPlanningDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: number
  month?: CalibrationPlanningMonth
  attentionStatus?: CalibrationPlanningStatus
  onExport: (params: {
    year: number
    month?: number
    status?: CalibrationPlanningStatus
    search?: string
    title: string
  }) => void
}

function formatDate(value?: string | null) {
  if (!value) return "N/A"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-GB")
}

function formatStatus(status: CalibrationPlanningStatus) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
}

function formatDaysRemaining(row: CalibrationPlanningDetail) {
  if (row.status === "completed") {
    if (row.completed_date && typeof row.days_remaining === "number" && row.days_remaining > 0) {
      return `Completed ${row.days_remaining} day${row.days_remaining === 1 ? "" : "s"} late`
    }
    return "Completed"
  }

  const days = row.days_remaining ?? 0
  if (row.status === "overdue") {
    const overdueDays = Math.abs(days)
    return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`
  }
  if (days === 0) return "Due today"
  return `${days} day${days === 1 ? "" : "s"} remaining`
}

function SummaryCards({ summary }: { summary: CalibrationPlanningCounts }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {[
        ["Planned", summary.total_planned, "text-foreground"],
        ["Completed", summary.completed, "text-emerald-700"],
        ["Due Soon", summary.due_soon, "text-amber-700"],
        ["Upcoming", summary.upcoming, "text-blue-700"],
        ["Overdue", summary.overdue, "text-red-700"],
      ].map(([label, value, className]) => (
        <Card key={String(label)} className="border-border/70 shadow-none">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`mt-1 text-lg font-semibold ${className}`}>{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function CalibrationPlanningDetailDialog({
  open,
  onOpenChange,
  year,
  month,
  attentionStatus,
  onExport,
}: CalibrationPlanningDetailDialogProps) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<CalibrationPlanningStatus | "all">(attentionStatus ?? "all")
  const [page, setPage] = useState(0)

  const queryParams = useMemo(
    () => ({
      year,
      month: month?.month,
      status: status === "all" ? undefined : status,
      search,
      page,
      limit: PAGE_SIZE,
    }),
    [month?.month, page, search, status, year]
  )
  const { data, isLoading, isFetching, isError } = useCalibrationPlanningDetails(queryParams, open)
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))
  const title = month
    ? `${MONTHS[month.month - 1]} ${year}`
    : `${formatStatus(attentionStatus ?? "overdue")} gauges - ${year}`
  const summary = month
    ? {
        total_planned: month.planned,
        completed: month.completed,
        due_soon: month.due_soon,
        upcoming: month.upcoming,
        overdue: month.overdue,
      }
    : data?.summary ?? { total_planned: 0, completed: 0, due_soon: 0, upcoming: 0, overdue: 0 }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-[1400px] overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Review the gauges planned for this period and export the current filtered list.</DialogDescription>
        </DialogHeader>

        <SummaryCards summary={summary} />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_220px] lg:max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search gauge name, identification, or frequency"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(0)
                }}
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as CalibrationPlanningStatus | "all")
                setPage(0)
              }}
            >
              <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => onExport({
              year,
              month: month?.month,
              status: status === "all" ? undefined : status,
              search,
              title,
            })}
          >
            <Download className="h-4 w-4" />
            PDF / CSV
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[72px]">Sr No</TableHead>
                <TableHead>Gauge Name</TableHead>
                <TableHead>Identification No.</TableHead>
                <TableHead>Calibration Frequency</TableHead>
                <TableHead>Last Calibration Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isFetching ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Loading planned gauges...</TableCell></TableRow>
              ) : isError ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-destructive">Unable to load calibration planning details.</TableCell></TableRow>
              ) : (data?.data.length ?? 0) === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No gauges match the selected filters.</TableCell></TableRow>
              ) : (
                data?.data.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{page * PAGE_SIZE + index + 1}</TableCell>
                    <TableCell className="font-medium">{row.gauge_name}</TableCell>
                    <TableCell>{row.identification_number || "N/A"}</TableCell>
                    <TableCell>{row.frequency_label}</TableCell>
                    <TableCell>{formatDate(row.last_calibration_date)}</TableCell>
                    <TableCell>{formatDate(row.due_date)}</TableCell>
                    <TableCell>{formatDaysRemaining(row)}</TableCell>
                    <TableCell><Badge variant="outline" className={STATUS_STYLES[row.status]}>{formatStatus(row.status)}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {(data?.total ?? 0) > 0 ? `Showing ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, data?.total ?? 0)} of ${data?.total}` : "No matching gauges"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous page" disabled={page === 0 || isFetching} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="min-w-16 text-center text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="icon" aria-label="Next page" disabled={page + 1 >= totalPages || isFetching} onClick={() => setPage((value) => value + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
