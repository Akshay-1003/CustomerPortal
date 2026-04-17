import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, Plus, AlertCircle, Printer } from "lucide-react"
import { useGauges } from "@/hooks/useGauges"
import { GaugeListTable } from "@/components/tables/GaugeListTable"
import { useDebouncedValue } from "@/hooks/useDebounce"
import { useRef } from "react"

const ITEMS_PER_PAGE = 10

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export default function GaugeListPage() {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const tableRef = useRef<{ onOpenPrintPreview: () => void }>(null)

  const { data: gaugesResponse, isLoading, isFetching, isError, error, refetch } = useGauges(
    currentPage, 
    itemsPerPage, 
    debouncedSearch
  )
  
  // Debug logging to understand API response structure
  console.log('API Response:', gaugesResponse)
  
  // API returns data directly with pagination info, not nested in data.data
  const gauges = Array.isArray(gaugesResponse?.data) ? gaugesResponse.data : []
  const totalItems = gaugesResponse?.total ?? 0
  const limit = gaugesResponse?.limit ?? ITEMS_PER_PAGE
  
  // Calculate totalPages since API doesn't provide it
  const totalPages = totalItems > 0 && limit > 0 ? Math.ceil(totalItems / limit) : 0
  
  // Ensure gauges is always an array
  const safeGauges = Array.isArray(gauges) ? gauges : []
  
  // Don't render pagination until we have valid data
  const shouldShowPagination = totalPages > 0 && !isLoading
  
  // Debug pagination values
  console.log('Pagination Values:', { 
    currentPage, 
    totalItems, 
    totalPages, 
    gaugesLength: gauges.length,
    shouldShowPagination,
    isLoading,
    gaugesResponse 
  })
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }, [])

  /* ---------------- STATES ---------------- */

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {getErrorMessage(error, "Failed to load gauges")}
        </AlertDescription>
        <Button onClick={() => refetch()} className="mt-3" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </Alert>
    )
  }


  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gauge List</h1>
          <p className="text-muted-foreground">
            Manage your gauge inventory and calibration records
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300"
            onClick={() => tableRef.current?.onOpenPrintPreview()}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print List
          </Button>
          <Button onClick={() => navigate("/gauge-list/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Gauge Master
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by name, Identification Number, or Serial Number..."
          value={searchQuery}
          onChange={handleSearchChange}
        />

        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

   

      {/* Table */}
      <GaugeListTable
        ref={tableRef}
        gauges={safeGauges}
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={handleItemsPerPageChange}
        totalItems={totalItems}
        totalPages={totalPages}
        isLoading={isLoading || isFetching}
        onGaugeUpdate={refetch}
      />
    </div>
  )
}
