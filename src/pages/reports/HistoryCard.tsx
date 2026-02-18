import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { useGauges } from "@/hooks/useGauges"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Search, SlidersHorizontal, RotateCcw, Eye } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
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
      label: `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"}`,
      sortGroup: 0,
      sortValue: Math.abs(daysLeft),
    }
  }

  if (daysLeft === 0) {
    return {
      status: "due_today",
      daysLeft,
      label: "Due Today",
      sortGroup: 1,
      sortValue: 0,
    }
  }

  if (daysLeft <= 7) {
    return {
      status: "critical",
      daysLeft,
      label: `Critical: ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`,
      sortGroup: 2,
      sortValue: daysLeft,
    }
  }

  if (daysLeft <= 30) {
    return {
      status: "due_soon",
      daysLeft,
      label: `Due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
      sortGroup: 3,
      sortValue: daysLeft,
    }
  }

  return {
    status: "safe",
    daysLeft,
    label: `Safe: ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
    sortGroup: 4,
    sortValue: daysLeft,
  }
}

function getDueBadgeClass(status: DueStatus): string {
  switch (status) {
    case "overdue":
      return "border-red-200 bg-red-50 text-red-700"
    case "due_today":
      return "border-orange-200 bg-orange-50 text-orange-700"
    case "critical":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "due_soon":
      return "border-yellow-200 bg-yellow-50 text-yellow-700"
    case "safe":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-600"
  }
}

function getRowAccentClass(status: DueStatus): string {
  if (status === "overdue") return "border-l-2 border-red-300"
  if (status === "due_today" || status === "critical") return "border-l-2 border-amber-300"
  return ""
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

function getPartName(gauge: HistoryCardGauge): string {
  const partName = gauge.specifications?.part_name
  if (typeof partName === "string" && partName.trim()) return partName
  return gauge.master_gauge || "N/A"
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
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const makeOptions = useMemo(() => {
    const values = new Set<string>()
    typedGauges.forEach((g) => {
      if (g.make) values.add(g.make)
    })
    return [...values].sort((a, b) => a.localeCompare(b))
  }, [typedGauges])

  const filtered = useMemo(() => {
    const items = typedGauges

    const filteredItems = items.filter((gauge) => {
      const remark = getGaugeRemark(gauge)
      const normalizedRemark = toLower(remark)

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

  const statusSummary = useMemo(() => {
    const summary = {
      overdue: 0,
      due_today: 0,
      critical: 0,
      due_soon: 0,
      safe: 0,
      unknown: 0,
    }

    filtered.forEach((gauge) => {
      const due = getDueMeta(gauge.next_calibration_date)
      summary[due.status] += 1
    })

    return summary
  }, [filtered])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, status, make, remarkMode, selectedRemarkFilters, itemsPerPage])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [currentPage, filtered, itemsPerPage])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const pages = getPageNumbers(currentPage, totalPages)

  const resetFilters = () => {
    setSearch("")
    setStatus("all")
    setMake("all")
    setRemarkMode("all")
    setSelectedRemarkFilters([])
    setItemsPerPage(10)
  }

  const toggleRemarkQuickFilter = (id: string) => {
    setSelectedRemarkFilters((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    )
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
    <div className="space-y-5 w-full">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">History Card</h2>
        <p className="text-sm text-muted-foreground">Quickly find a gauge and open its report analysis.</p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base">Gauge Filters</CardTitle>
              <CardDescription>Fast, minimal-click filtering for history card access.</CardDescription>
            </div>
            <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  {isFilterOpen ? "Hide Filters" : "Show Filters"}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search gauge, identification, serial, remark..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="ghost" onClick={resetFilters} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

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

          <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <CollapsibleContent>
              <div className="grid gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-4">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="calibration_completed">Completed</SelectItem>
                    <SelectItem value="calibration_due">Due</SelectItem>
                    <SelectItem value="calibration_expired">Expired</SelectItem>
                    <SelectItem value="inward_pending">Inward Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={make} onValueChange={setMake}>
                  <SelectTrigger>
                    <SelectValue placeholder="Make" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Make</SelectItem>
                    {makeOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={remarkMode} onValueChange={setRemarkMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Remark" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Remarks</SelectItem>
                    <SelectItem value="with">With Remark</SelectItem>
                    <SelectItem value="without">Without Remark</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rows" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 rows</SelectItem>
                    <SelectItem value="20">20 rows</SelectItem>
                    <SelectItem value="50">50 rows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>

        <CardContent>
          <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Overdue: {statusSummary.overdue}</div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">Due Today: {statusSummary.due_today}</div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Critical: {statusSummary.critical}</div>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">Due Soon: {statusSummary.due_soon}</div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Safe: {statusSummary.safe}</div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Unknown: {statusSummary.unknown}</div>
          </div>

          <div className="max-w-full rounded-xl border border-border/60 bg-background overflow-hidden">
            <div className="relative w-full max-w-full overflow-x-auto">
            <Table className="w-max min-w-[2200px]">
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="sticky top-0 z-10 w-[72px] whitespace-nowrap bg-muted/30">ID</TableHead>
                  <TableHead className="sticky top-0 z-10 w-[220px] whitespace-nowrap bg-muted/30">Company Name</TableHead>
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
                  <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30">Status</TableHead>
                  <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-muted/30 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length ? (
                  paginated.map((gauge, index) => {
                    const remark = getGaugeRemark(gauge)
                    const rowId = (currentPage - 1) * itemsPerPage + index + 1
                    const specification = formatSpecificationForPrint(gauge.specifications, gauge.unit || "mm")
                    const dueMeta = getDueMeta(gauge.next_calibration_date)
                    return (
                      <TableRow key={gauge.id} className={`hover:bg-muted/20 ${getRowAccentClass(dueMeta.status)}`}>
                        <TableCell className="w-[72px] whitespace-nowrap">
                          {rowId}
                        </TableCell>
                        <TableCell className="w-[220px] whitespace-nowrap" title={gauge.client_organization || "N/A"}>
                          {gauge.client_organization || "N/A"}
                        </TableCell>
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
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className={getDueBadgeClass(dueMeta.status)}>
                            {dueMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className="whitespace-nowrap"
                          title={gauge.calibration_location || gauge.calibration_location_type || "N/A"}
                        >
                          {gauge.calibration_location || gauge.calibration_location_type || "N/A"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap" title={getPartName(gauge)}>
                          {getPartName(gauge)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap" title={remark || "-"}>
                          {remark || "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="capitalize">
                            {(gauge.status || "unknown").replaceAll("_", " ")}
                          </Badge>
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
                    <TableCell colSpan={16} className="h-20 text-center text-muted-foreground">
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
    </div>
  )
}
