import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertCircle, Package, Calendar } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { apiService } from "@/services/api.service"
import { authService } from "@/services/auth.service"
import type { Outward, OutwardGauge, OutwardGaugesResponse } from "@/types/api"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { InwardOutwardPrintPreview } from "./InwardOutwardPrintPreview"

const ITEMS_PER_PAGE = 10

const getPaginationNumbers = (currentPage: number, totalPages: number) => {
  const delta = 2
  const range = []
  const rangeWithDots: (number | string)[] = []
  let l: number | undefined

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i)
    }
  }

  for (let i of range) {
    if (l) {
      if (i - l === 2) rangeWithDots.push(l + 1)
      else if (i - l !== 1) rangeWithDots.push("...")
    }
    rangeWithDots.push(i)
    l = i
  }

  return rangeWithDots
}

function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.results)) return obj.results as T[]
  }
  return []
}

function formatDate(value?: string): string {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  return date.toLocaleDateString("en-GB")
}

interface InwardTableProps {
  className?: string
}

export function InwardTable({ className }: InwardTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedOutward, setSelectedOutward] = useState<Outward | null>(null)
  const [selectedGauges, setSelectedGauges] = useState<OutwardGauge[]>([])
  const [isFetchingPrintData, setIsFetchingPrintData] = useState(false)

  const organizationId = authService.getOrganizationId()

  const { data: outwardEntries, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["inward-outward-entries", organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error("Organization ID is required")
      const payload = await apiService.get<unknown>("/outward", {
        params: { client_org_id: organizationId },
      })
      return asArray<Outward>(payload)
    },
    enabled: !!organizationId,
  })

  const filteredEntries = useMemo(() => {
    const items = outwardEntries || []
    if (!searchQuery) return items
    const q = searchQuery.toLowerCase()
    return items.filter((entry) => {
      return (
        String(entry.id || "").toLowerCase().includes(q) ||
        String(entry.outward_no || "").toLowerCase().includes(q) ||
        String(entry.client_org || "").toLowerCase().includes(q) ||
        String(entry.transport_by || "").toLowerCase().includes(q)
      )
    })
  }, [outwardEntries, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  const paginationNumbers = getPaginationNumbers(currentPage, totalPages)

  const handlePrintClick = async (entry: Outward) => {
    setIsFetchingPrintData(true)
    try {
      const payload = await apiService.get<OutwardGaugesResponse>(`/outward/${entry.id}/gauges`)
      setSelectedOutward(payload.outward_details || entry)
      setSelectedGauges(payload.outward_gauges || [])
      setIsPreviewOpen(true)
    } catch (fetchError: any) {
      toast.error(fetchError?.response?.data?.message || "Failed to load outward gauges for print")
    } finally {
      setIsFetchingPrintData(false)
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
        <AlertDescription>{(error as any)?.message || "Failed to load inward entries"}</AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inward Processing
              </h2>
              <p className="text-sm text-muted-foreground">
                Outward entries for inward flow ({filteredEntries.length} total)
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by outward no, id, client, or transport by..."
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
          {paginatedEntries.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                {searchQuery ? "No entries found" : "No outward entries available"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery ? "Try adjusting your search terms" : "Entries will appear when outward records are available"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-16">Sr. No.</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Outward No</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Client</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Transport By</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Outward Date</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEntries.map((entry, index) => (
                        <tr key={entry.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">{startIndex + index + 1}</td>
                          <td className="p-4 align-middle">{entry.outward_no}</td>
                          <td className="p-4 align-middle">{entry.client_org || "N/A"}</td>
                          <td className="p-4 align-middle">{entry.transport_by || "N/A"}</td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDate(entry.outward_date)}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintClick(entry)}
                              disabled={isFetchingPrintData}
                            >
                              Print
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
                    Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredEntries.length)} of {filteredEntries.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {paginationNumbers.map((page, i) => (
                        <div key={i}>
                          {page === "..." ? (
                            <span className="px-3 text-muted-foreground">...</span>
                          ) : (
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(Number(page))}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

      {selectedOutward && (
        <InwardOutwardPrintPreview
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          companyName={selectedOutward.client_org || "Company"}
          companyAddress={
            selectedOutward.address
              ? `${selectedOutward.address.address_line_1 || ""} ${selectedOutward.address.address_line_2 || ""}, ${selectedOutward.address.city || ""}, ${selectedOutward.address.state || ""} ${selectedOutward.address.zip_code || ""}`.trim()
              : "Address not available"
          }
          gauges={selectedGauges}
        />
      )}
    </>
  )
}

