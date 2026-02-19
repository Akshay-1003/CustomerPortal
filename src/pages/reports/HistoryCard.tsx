import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useGauges } from "@/hooks/useGauges"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, RotateCcw, Eye } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle,PrinterCheckIcon } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { HistoryCardGauge } from "@/types/api"
import { formatSpecificationForPrint } from "@/components/reports/helpers/specificationFormatter"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { HistoryCardPrintPreview, type HistoryCardPrintRow } from "@/components/reports/HistoryCardPrintPreview"

const REMARK_QUICK_FILTERS = [
  { id: "accept", label: "Accept", keywords: ["accept"] },
  { id: "conditional_accept", label: "Conditional Accept", keywords: ["conditional", "cond"] },
  { id: "not_ok", label: "Not Ok", keywords: ["not ok", "not_ok", "reject"] },
  { id: "missing", label: "Missing", keywords: ["missing"] },
  { id: "damaged", label: "Damaged / Broken", keywords: ["damaged", "broken"] },
  { id: "repair", label: "Repair", keywords: ["repair"] },
  { id: "rework", label: "Rework", keywords: ["rework"] },
  { id: "not_in_use", label: "Not in Use", keywords: ["not in use", "inactive"] },
] as const

function toLower(value?: string) {
  return (value || "").toLowerCase()
}

function formatDateDDMMYYYY(value?: string | null): string {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  return date.toLocaleDateString("en-GB")
}

type DueStatus = "overdue" | "due_today" | "critical" | "due_soon" | "safe" | "unknown"

type DueMeta = {
  status: DueStatus
  daysLeft: number | null
  label: string
  sortGroup: number
  sortValue: number
}

function startOfLocalDay(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function getDueMeta(nextCalibrationDate?: string): DueMeta {
  if (!nextCalibrationDate) {
    return {
      status: "unknown",
      daysLeft: null,
      label: "N/A",
      sortGroup: 5,
      sortValue: Number.MAX_SAFE_INTEGER,
    }
  }

  const dueDate = new Date(nextCalibrationDate)
  if (Number.isNaN(dueDate.getTime())) {
    return {
      status: "unknown",
      daysLeft: null,
      label: "N/A",
      sortGroup: 5,
      sortValue: Number.MAX_SAFE_INTEGER,
    }
  }

  const today = startOfLocalDay(new Date())
  const due = startOfLocalDay(dueDate)
  const daysLeft = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return {
      status: "overdue",
      daysLeft,
      label: `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"}`,
      sortGroup: 0,
      sortValue: Math.abs(daysLeft),
    }
  }

  if (daysLeft <= 30) {
    return {
      status: "due_soon",
      daysLeft,
      label: `${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
      sortGroup: 3,
      sortValue: daysLeft,
    }
  }

  return {
    status: "safe",
    daysLeft,
    label: `${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
    sortGroup: 4,
    sortValue: daysLeft,
  }
}

function getDueCellClass(status: DueStatus): string {
  switch (status) {
    case "overdue":
      return "bg-red-50 text-red-700"
    case "due_today":
      return "bg-yellow-50 text-yellow-700"
    case "critical":
      return "bg-amber-50 text-amber-700"
    case "due_soon":
      return "bg-yellow-50 text-yellow-700"
    case "safe":
      return "bg-emerald-50 text-emerald-700"
    default:
      return "bg-slate-50 text-slate-600"
  }
}

function getGaugeRemark(gauge: HistoryCardGauge): string {
  const specRemark = gauge?.specifications?.remark
  if (typeof specRemark === "string" && specRemark.trim()) {
    return specRemark.trim()
  }
  if (typeof gauge?.gauge_condition === "string" && gauge.gauge_condition.trim()) {
    return gauge.gauge_condition.trim()
  }
  if (typeof gauge?.status === "string" && gauge.status.trim()) {
    return gauge.status.trim()
  }
  return ""
}

function getPageNumbers(current: number, total: number) {
  const delta = 2
  const range = []
  const rangeWithDots: (number | string)[] = []
  let last: number | undefined

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i)
    }
  }

  for (const value of range) {
    if (last) {
      if (value - last === 2) {
        rangeWithDots.push(last + 1)
      } else if (value - last !== 1) {
        rangeWithDots.push("...")
      }
    }
    rangeWithDots.push(value)
    last = value
  }

  return rangeWithDots
}

export function HistoryCardPage() {
  const navigate = useNavigate()
  const { data: gauges, isLoading, isError, error } = useGauges()
  const typedGauges = (gauges || []) as HistoryCardGauge[]

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [make, setMake] = useState("all")
  const [remarkMode, setRemarkMode] = useState("all")
  const [selectedRemarkFilters, setSelectedRemarkFilters] = useState<string[]>([])
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [dueStatusFilter, setDueStatusFilter] = useState<"all" | DueStatus>("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)

  const baseFiltered = useMemo(() => {
    const items = typedGauges

    const filteredItems = items.filter((gauge) => {
      const gauge_condition = getGaugeRemark(gauge)
      const normalizedRemark = toLower(gauge_condition)

      const matchesSearch =
        !search ||
        toLower(gauge.master_gauge).includes(toLower(search)) ||
        toLower(gauge.identification_number).includes(toLower(search)) ||
        toLower(gauge.manf_serial_number).includes(toLower(search)) ||
        normalizedRemark.includes(toLower(search))

      const matchesStatus = status === "all" ? true : gauge.status === status
      const matchesMake = make === "all" ? true : gauge.make === make

      const matchesRemarkMode =
        remarkMode === "all"
          ? true
          : remarkMode === "with"
            ? Boolean(normalizedRemark)
            : !normalizedRemark

      const matchesQuickRemark =
        selectedRemarkFilters.length === 0
          ? true
          : selectedRemarkFilters.some((filterId) => {
            const filter = REMARK_QUICK_FILTERS.find((item) => item.id === filterId)
            if (!filter) return true

            if (filter.id === "accept") {
              return (
                normalizedRemark.includes("accept") &&
                !normalizedRemark.includes("conditional") &&
                !normalizedRemark.includes("not ok")
              )
            }

            return filter.keywords.some((keyword) => normalizedRemark.includes(keyword))
          })

      return matchesSearch && matchesStatus && matchesMake && matchesRemarkMode && matchesQuickRemark
    })

    return [...filteredItems].sort((a, b) => {
      const dueA = getDueMeta(a.next_calibration_date)
      const dueB = getDueMeta(b.next_calibration_date)

      if (dueA.sortGroup !== dueB.sortGroup) {
        return dueA.sortGroup - dueB.sortGroup
      }

      return dueA.sortValue - dueB.sortValue
    })
  }, [typedGauges, make, remarkMode, search, selectedRemarkFilters, status])

  const filtered = useMemo(() => {
    if (dueStatusFilter === "all") {
      return baseFiltered
    }
    return baseFiltered.filter((gauge) => getDueMeta(gauge.next_calibration_date).status === dueStatusFilter)
  }, [baseFiltered, dueStatusFilter])

  const statusSummary = useMemo(() => {
    const summary = {
      overdue: 0,
      due_today: 0,
      critical: 0,
      due_soon: 0,
      safe: 0,
      unknown: 0,
    }

    baseFiltered.forEach((gauge) => {
      const due = getDueMeta(gauge.next_calibration_date)
      summary[due.status] += 1
    })

    return summary
  }, [baseFiltered])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, status, make, remarkMode, selectedRemarkFilters, itemsPerPage, dueStatusFilter])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [currentPage, filtered, itemsPerPage])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const pages = getPageNumbers(currentPage, totalPages)

  const filteredIds = useMemo(() => new Set(filtered.map((g) => g.id)), [filtered])
  const selectedFilteredCount = useMemo(() => {
    let count = 0
    selectedIds.forEach((id) => {
      if (filteredIds.has(id)) count += 1
    })
    return count
  }, [filteredIds, selectedIds])
  const allFilteredSelected = filtered.length > 0 && selectedFilteredCount === filtered.length
  const someFilteredSelected = selectedFilteredCount > 0 && !allFilteredSelected

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev
      const next = new Set<string>()
      prev.forEach((id) => {
        if (filteredIds.has(id)) next.add(id)
      })
      return next
    })
  }, [filteredIds])

  const resetFilters = () => {
    setSearch("")
    setStatus("all")
    setMake("all")
    setRemarkMode("all")
    setSelectedRemarkFilters([])
    setItemsPerPage(10)
    setDueStatusFilter("all")
    setSelectedIds(new Set())
  }

  const toggleRemarkQuickFilter = (id: string) => {
    setSelectedRemarkFilters((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    )
  }

  const toggleRowSelection = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleSelectAllFiltered = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        filtered.forEach((row) => next.add(row.id))
      } else {
        filtered.forEach((row) => next.delete(row.id))
      }
      return next
    })
  }

  const printSourceRows = useMemo(() => {
    const selectedRows = filtered.filter((row) => selectedIds.has(row.id))
    return selectedRows.length > 0 ? selectedRows : filtered
  }, [filtered, selectedIds])

  const printRows = useMemo<HistoryCardPrintRow[]>(() => {
    return printSourceRows.map((gauge, index) => {
      const dueMeta = getDueMeta(gauge.next_calibration_date)
      return {
        serialNo: index + 1,
        gaugeType: gauge.master_gauge || "N/A",
        specification: formatSpecificationForPrint(gauge.specifications, gauge.unit || "mm"),
        identificationNo: gauge.identification_number || "N/A",
        lastCalibrationDate: formatDateDDMMYYYY(gauge.certificate_issue_date),
        frequency: gauge.calibration_frequency
          ? `${gauge.calibration_frequency} ${gauge.calibration_frequency_unit || ""}`
          : "N/A",
        dueDate: formatDateDDMMYYYY(gauge.next_calibration_date),
        dayLeft: dueMeta.label,
        gaugeLocation: gauge.calibration_location || gauge.calibration_location_type || "N/A",
        partName: gauge.part_name || "N/A",
        gauge_condition: gauge.gauge_condition || "-",
      }
    })
  }, [printSourceRows])

  const handleOpenPrintPreview = () => {
    if (printRows.length === 0) {
      toast.error("No rows available to print.")
      return
    }
    setIsPrintPreviewOpen(true)
  }

  if (isLoading) {
    return (
      <Card className="w-full border-border/60 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[380px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{(error as any)?.message || "Failed to load gauges"}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-2 w-full">  
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Remark Quick Filters</p>
            <div className="flex flex-wrap gap-2">
              {REMARK_QUICK_FILTERS.map((item) => {
                const active = selectedRemarkFilters.includes(item.id)
                return (
                  <Button
                    key={item.id}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className="h-8"
                    onClick={() => toggleRemarkQuickFilter(item.id)}
                  >
                    {item.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
            <Button
              size="sm"
              variant={dueStatusFilter === "overdue" ? "default" : "outline"}
              className={`justify-start border-red-200 bg-red-50 text-red-700 hover:bg-red-700 hover:text-white ${dueStatusFilter === "overdue" ? "bg-red-600 text-white" : "outline border-red-200 outline-none"}`}
              onClick={() => setDueStatusFilter("overdue")}
            >
              Overdue: {statusSummary.overdue}
            </Button>

            <Button
              size="sm"
              variant={dueStatusFilter === "due_soon" ? "default" : "outline"}
              className={`justify-start border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-600 hover:text-white ${dueStatusFilter === "due_soon" ? "bg-yellow-500 text-white" : "outline border-yellow-200 outline-none"}`}
              onClick={() => setDueStatusFilter("due_soon")}
            >
              Due Soon: {statusSummary.due_soon}
            </Button>
            <Button
              size="sm"
              variant={dueStatusFilter === "safe" ? "default" : "outline"}
              className={`justify-start border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white ${dueStatusFilter === "safe" ? "bg-emerald-600 text-white" : "outline border-emerald-200 outline-none"}`}
              onClick={() => setDueStatusFilter("safe")}
            >
              OK: {statusSummary.safe}
            </Button>

          </div>
          <div className="flex gap-3 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search gauge, identification, serial, remark..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="default"
              onClick={handleOpenPrintPreview}
              disabled={filtered.length === 0}
            >
              <PrinterCheckIcon className="h-4 w-4" />
              Print
            </Button>
            <Button variant="default" onClick={resetFilters} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
          <div className="max-w-full rounded-xl border border-border/60 bg-background overflow-hidden">
            <div className="relative w-full max-w-full overflow-x-auto">
              <Table className="w-max min-w-[2200px]">
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="sticky top-0 z-10 w-[44px] whitespace-nowrap bg-muted/30">
                      <Checkbox
                        checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                        onCheckedChange={(value) => toggleSelectAllFiltered(value === true)}
                        aria-label="Select all filtered rows"
                      />
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 w-[72px] whitespace-nowrap bg-muted/30">ID</TableHead>
                    {/* <TableHead className="sticky top-0 z-10 w-[220px] whitespace-nowrap bg-muted/30">Company Name</TableHead> */}
                    <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30">Gauge</TableHead>
                    <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30">Identification</TableHead>
                    <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30">Serial</TableHead>
                    <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30">Specification</TableHead>
                    <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30">Calibration Date</TableHead>
                    <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30">Freq.</TableHead>
                    <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30">Make</TableHead>
                    <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30">Due Date</TableHead>
                    <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30">Day Left</TableHead>
                    <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30">Location</TableHead>
                    <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30">Part Name</TableHead>
                    <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30">Remark</TableHead>
                    <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length ? (
                    paginated.map((gauge, index) => {
                      const rowId = (currentPage - 1) * itemsPerPage + index + 1
                      const specification = formatSpecificationForPrint(gauge.specifications, gauge.unit || "mm")
                      const dueMeta = getDueMeta(gauge.next_calibration_date)
                      return (
                        <TableRow key={gauge.id} className="hover:bg-muted/20">
                          <TableCell className="w-[44px]">
                            <Checkbox
                              checked={selectedIds.has(gauge.id)}
                              onCheckedChange={(value) => toggleRowSelection(gauge.id, value === true)}
                              aria-label={`Select ${gauge.identification_number || gauge.id}`}
                            />
                          </TableCell>
                          <TableCell className="w-[72px] whitespace-nowrap">
                            {rowId}
                          </TableCell>
                          {/* <TableCell className="w-[220px] whitespace-nowrap" title={gauge.client_organization || "N/A"}>
                            {gauge.client_organization || "N/A"}
                          </TableCell> */}
                          <TableCell className="whitespace-nowrap font-medium">{gauge.master_gauge || "N/A"}</TableCell>
                          <TableCell className="whitespace-nowrap">{gauge.identification_number || "N/A"}</TableCell>
                          <TableCell className="whitespace-nowrap">{gauge.manf_serial_number || "N/A"}</TableCell>
                          <TableCell className="whitespace-nowrap" title={specification}>
                            {specification}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{formatDateDDMMYYYY(gauge.certificate_issue_date)}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {gauge.calibration_frequency
                              ? `${gauge.calibration_frequency} ${gauge.calibration_frequency_unit || ""}`
                              : "N/A"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{gauge.make || "N/A"}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDateDDMMYYYY(gauge.next_calibration_date)}</TableCell>
                          <TableCell className={`whitespace-nowrap ${getDueCellClass(dueMeta.status)}`}>
                            <span className="font-medium">{dueMeta.label}</span>
                          </TableCell>
                          <TableCell
                            className="whitespace-nowrap"
                            title={gauge.calibration_location || gauge.calibration_location_type || "N/A"}
                          >
                            {gauge.calibration_location || gauge.calibration_location_type || "N/A"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap" title={gauge.part_name || "N/A"}>
                            {gauge.part_name || "N/A"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap" title={gauge.gauge_condition || "-"}>
                            {gauge.gauge_condition || "-"}
                          </TableCell>
                        
                          <TableCell className="whitespace-nowrap text-right">
                            <Button size="sm" onClick={() => navigate(`/reports/history-card/${gauge.id}`)} className="gap-2">
                              <Eye className="h-4 w-4" />
                              Show
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={17} className="h-20 text-center text-muted-foreground">
                        No gauges match the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-end">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    />
                  </PaginationItem>

                  {pages.map((page, index) => (
                    <PaginationItem key={`${page}-${index}`}>
                      {page === "..." ? (
                        <span className="px-3 text-muted-foreground">...</span>
                      ) : (
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => setCurrentPage(Number(page))}
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

        </CardContent>
      </Card>
      <HistoryCardPrintPreview
        open={isPrintPreviewOpen}
        onOpenChange={setIsPrintPreviewOpen}
        rows={printRows}
        companyName={printSourceRows[0]?.client_organization || "Company"}
        companyAddress="151/1, Kalappanna Awade Textile Park, Kolhapur-416121 | calibration@company.com"
      />
    </div>
  )
}
