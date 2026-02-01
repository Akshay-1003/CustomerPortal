import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, FileText, Download, RefreshCw, History as HistoryIcon } from "lucide-react"
import { useGauges, useGaugeHistory } from "@/hooks/useGauges"

const ITEMS_PER_PAGE = 10

const resultVariant = (result: string) => {
  switch (result) {
    case "Pass":
      return "default"
    case "Fail":
      return "destructive"
    case "Pending":
      return "secondary"
    default:
      return "secondary"
  }
}

export function History() {
  const [selectedGaugeId, setSelectedGaugeId] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)

  const { data: gauges, isLoading: isLoadingGauges } = useGauges()
  const { data: history, isLoading: isLoadingHistory, isError, error, refetch } = useGaugeHistory(selectedGaugeId)

  // Pagination
  const totalPages = history ? Math.ceil(history.length / ITEMS_PER_PAGE) : 0
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentHistory = history?.slice(startIndex, endIndex) || []

  // Loading State for Gauges
  if (isLoadingGauges) {
    return (
      <div className="space-y-6 w-full">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Calibration History</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            View historical calibration records and activities
          </p>
        </div>
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Loading</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Fetching data from the server...
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Calibration History</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            View historical calibration records and activities
          </p>
        </div>
        {selectedGaugeId && (
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>

      {/* Gauge Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-full sm:w-[300px]">
          <Select value={selectedGaugeId} onValueChange={(value) => {
            setSelectedGaugeId(value)
            setCurrentPage(1)
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select a gauge to view history" />
            </SelectTrigger>
            <SelectContent>
              {gauges?.map((gauge) => (
                <SelectItem key={gauge.id} value={gauge.id}>
                  {gauge.id} - {gauge.master_gauge}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedGaugeId && history && history.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Found {history.length} record{history.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* No Gauge Selected State */}
      {!selectedGaugeId && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-muted p-6">
              <HistoryIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Select a Gauge</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Choose a gauge from the dropdown above to view its calibration history and records.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Loading History State */}
      {selectedGaugeId && isLoadingHistory && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Loading History</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Fetching calibration records...
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error State */}
      {selectedGaugeId && isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading History</AlertTitle>
          <AlertDescription className="mt-2">
            {(error as any)?.response?.data?.message || (error as Error)?.message || 'Failed to load history data. Please try again.'}
          </AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Alert>
      )}

      {/* Empty History State */}
      {selectedGaugeId && !isLoadingHistory && !isError && history && history.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-muted p-6">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No History Found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This gauge doesn't have any calibration history records yet.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* History Table */}
      {selectedGaugeId && !isLoadingHistory && !isError && history && history.length > 0 && (
        <>
          <div className="rounded-md border w-full overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[700px]">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Certificate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{record.action}</TableCell>
                      <TableCell>{record.performed_by}</TableCell>
                      <TableCell>
                        <Badge variant={resultVariant(record.result) as any}>
                          {record.result}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{record.notes}</TableCell>
                      <TableCell>
                        {record.certificate ? (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                  })
                  .map((page, index, array) => {
                    if (index > 0 && array[index - 1] !== page - 1) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <span className="px-4">...</span>
                        </PaginationItem>
                      )
                    }
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={
                      currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, history.length)} of{" "}
            {history.length} records
          </div>
        </>
      )}
    </div>
  )
}
