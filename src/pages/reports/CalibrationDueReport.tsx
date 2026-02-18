import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useGauges } from "@/hooks/useGauges"
import { calculateCalibrationDue } from "@/lib/calibrationUtils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function CalibrationDueReportPage() {
  const { data: gauges, isLoading, isError, error } = useGauges()
  const [query, setQuery] = useState("")
  const [dueFilter, setDueFilter] = useState("all")

  const rows = useMemo(() => {
    return (gauges || []).map((gauge) => {
      const due = calculateCalibrationDue(gauge)
      return {
        id: gauge.id,
        gauge,
        due,
      }
    })
  }, [gauges])

  const filteredRows = useMemo(() => {
    return rows.filter(({ gauge, due }) => {
      const searchText = [
        gauge.master_gauge,
        gauge.identification_number,
        gauge.manf_serial_number,
        gauge.make,
      ]
        .join(" ")
        .toLowerCase()

      const matchesQuery = !query || searchText.includes(query.toLowerCase())

      const matchesDue =
        dueFilter === "all"
          ? true
          : dueFilter === "overdue"
            ? due.isOverdue
            : dueFilter === "due_30"
              ? !due.isOverdue && typeof due.daysUntilDue === "number" && due.daysUntilDue <= 30
              : dueFilter === "due_90"
                ? !due.isOverdue && typeof due.daysUntilDue === "number" && due.daysUntilDue <= 90
                : due.isCompleted

      return matchesQuery && matchesDue
    })
  }, [dueFilter, query, rows])

  if (isLoading) {
    return (
      <Card className="w-full border-border/60 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[360px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{(error as any)?.message || "Failed to load due report"}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-5 w-full">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Calibration Due Report</h2>
        <p className="text-sm text-muted-foreground">Monitor overdue and upcoming calibrations with minimal steps.</p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Quick filter for due windows and gauge search.</CardDescription>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by gauge name, identification, serial, make..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <Select value={dueFilter} onValueChange={setDueFilter}>
              <SelectTrigger className="w-full lg:w-[220px]">
                <SelectValue placeholder="Due Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="due_30">Due in 30 Days</SelectItem>
                <SelectItem value="due_90">Due in 90 Days</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Gauge</TableHead>
                  <TableHead>Identification</TableHead>
                  <TableHead>Make</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length ? (
                  filteredRows.map(({ id, gauge, due }) => (
                    <TableRow key={id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{gauge.master_gauge || "N/A"}</TableCell>
                      <TableCell>{gauge.identification_number || "N/A"}</TableCell>
                      <TableCell>{gauge.make || "N/A"}</TableCell>
                      <TableCell>{due.dueDate ? due.dueDate.toLocaleDateString("en-GB") : "N/A"}</TableCell>
                      <TableCell>{typeof due.daysUntilDue === "number" ? due.daysUntilDue : "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            due.isOverdue
                              ? "border-red-200 bg-red-50 text-red-700"
                              : due.isCompleted
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                          }
                        >
                          {due.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                      No gauges match selected due filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
