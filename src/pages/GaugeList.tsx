import { useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, Plus, AlertCircle, Printer } from "lucide-react"
import { useAllGauges } from "@/hooks/useGauges"
import { GaugeListTable } from "@/components/tables/GaugeListTable"
import { useDebouncedValue } from "@/hooks/useDebounce"
import { useRef } from "react"
import { authService } from "@/services/auth.service"
import { formatSpecificationForPrint } from "@/components/reports/helpers/specificationFormatter"
import { useAuth } from "@/hooks/useAuth"
import { canEditCustomerModule } from "@/lib/permissions"

const ITEMS_PER_PAGE = 10

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export default function GaugeListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const organizationId = authService.getOrganizationId()
  const canManageGauges = canEditCustomerModule(
    user?.user,
    "customer_gauge_management",
    user?.roles
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const tableRef = useRef<{ onOpenPrintPreview: () => void }>(null)

  const { data: allGauges = [], isLoading, isFetching, isError, error, refetch } = useAllGauges()

  const filteredGauges = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase()

    if (!normalizedSearch) {
      return allGauges
    }

    return allGauges.filter((gauge) => {
      const searchableText = [
        gauge.master_gauge,
        gauge.identification_number,
        gauge.manf_serial_number,
        gauge.make,
        formatSpecificationForPrint(gauge.specifications, gauge.unit || "mm"),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(normalizedSearch)
    })
  }, [allGauges, debouncedSearch])

  const totalItems = filteredGauges.length
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 0

  const paginatedGauges = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredGauges.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredGauges, currentPage, itemsPerPage])

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
          {canManageGauges ? (
            <Button
              onClick={() =>
                navigate(
                  organizationId
                    ? `/gauge-list/create?organizationId=${encodeURIComponent(organizationId)}`
                    : "/gauge-list/create"
                )
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Existing Gauge
            </Button>
          ) : null}
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
        gauges={paginatedGauges}
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={handleItemsPerPageChange}
        totalItems={totalItems}
        totalPages={totalPages}
        isLoading={isLoading || isFetching}
        onGaugeUpdate={refetch}
        canManageGauges={canManageGauges}
      />
    </div>
  )
}
