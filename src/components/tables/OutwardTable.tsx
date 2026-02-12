import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertCircle, Package, Calendar, ArrowLeft } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { apiService } from "@/services/api.service"
import { authService } from "@/services/auth.service"
import type { Gauge } from "@/types/api"
import { Skeleton } from "@/components/ui/skeleton"

const ITEMS_PER_PAGE = 10

interface OutwardTableProps {
  className?: string
}

export function OutwardTable({ className }: OutwardTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")

  const organizationId = authService.getOrganizationId()

  const { data: gauges, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['outward-gauges', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is required')
      return await apiService.get<Gauge[]>(`/gauge/list/inward_gauges`, {
        params: {
          client_org_id: organizationId,
          status: 'inward_pending'
        }
      })
    },
    enabled: !!organizationId
  })

  const filteredGauges = useMemo(() => {
    if (!gauges) return []
    return gauges.filter((gauge) => {
      const matchesSearch =
        searchQuery === "" ||
        gauge.master_gauge?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gauge.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gauge.manf_serial_number?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [gauges, searchQuery])

  const totalPages = Math.ceil(filteredGauges.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedGauges = filteredGauges.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'calibration_completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>
      case 'inward_pending':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Inward Pending</Badge>
      case 'calibration_due':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Due Soon</Badge>
      case 'calibration_expired':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Overdue</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="aspect-video w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {(error as any)?.message || "Failed to load outward gauges"}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              Outward Processing
            </h2>
            <p className="text-sm text-muted-foreground">
              Gauges waiting for outward processing ({filteredGauges.length} total)
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by gauge name, ID, or serial number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="max-w-sm"
          />
        </div>
      </CardHeader>

      <CardContent>
        {paginatedGauges.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
              {searchQuery ? "No gauges found" : "No gauges waiting for outward processing"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery ? "Try adjusting your search terms" : "Gauges will appear here when inward processing is completed"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Gauge Details
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Serial Number
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Next Calibration
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedGauges.map((gauge) => (
                      <tr key={gauge.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{gauge.master_gauge}</div>
                              <div className="text-sm text-muted-foreground">ID: {gauge.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="text-sm">{gauge.manf_serial_number || 'N/A'}</div>
                        </td>
                        <td className="p-4 align-middle">
                          {getStatusBadge(gauge.status || 'unknown')}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {gauge.next_calibration_date || 'Not scheduled'}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Button variant="outline" size="sm">
                            Process Outward
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredGauges.length)} of {filteredGauges.length} gauges
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
