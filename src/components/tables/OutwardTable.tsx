import { useMemo, useState } from "react"
import { AxiosError } from "axios"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CardContent, CardHeader } from "@/components/ui/card"
import { RefreshCw, AlertCircle, FileText ,PrinterCheckIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { apiService } from "@/services/api.service"
import { authService } from "@/services/auth.service"
import type { Inward, InwardGauge } from "@/types/api"
import { toast } from "sonner"
import { OutwardChallanPrintPreview } from "./OutwardChallanPrintPreview"

const ITEMS_PER_PAGE = 10

interface OutwardTableProps {
  className?: string
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const apiMessage = (error.response?.data as { message?: string } | undefined)?.message
    return apiMessage || error.message || fallback
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
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
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "N/A"
  return d.toLocaleDateString("en-GB")
}

export function OutwardTable({ className }: OutwardTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isFetchingPrintData, setIsFetchingPrintData] = useState(false)
  const [selectedInward, setSelectedInward] = useState<Inward | null>(null)
  const [selectedGauges, setSelectedGauges] = useState<InwardGauge[]>([])

  const organizationId = authService.getOrganizationId()

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["outward-entries", organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error("Organization ID is required")
      const payload = await apiService.get<unknown>("/gauge/inwards", {
        params: { client_org_id: organizationId },
      })
      return asArray<Inward>(payload)
    },
    enabled: !!organizationId,
  })

  const outwardEntries = useMemo(() => data ?? [], [data])
  console.log("outwardEntries", outwardEntries)
  const filteredEntries = useMemo(() => {
    if (!outwardEntries.length) return []
    if (!searchQuery) return outwardEntries
    const q = searchQuery.toLowerCase()
    return outwardEntries.filter((entry) => {
      return (
        String(entry.id || "").toLowerCase().includes(q) ||
        String(entry.inward_no || "").toLowerCase().includes(q) ||
        String(entry.client_org_name || "").toLowerCase().includes(q)
      )
    })
  }, [outwardEntries, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePrintClick = async (entry: Inward) => {
    setIsFetchingPrintData(true)
    try {
      const payload = await apiService.get<unknown>("/gauge/list/inward_gauges", {
        params: { inward_id: entry.id },
      })
      const gauges = asArray<InwardGauge>(payload)
      setSelectedInward(entry)
      setSelectedGauges(gauges)
      setIsPreviewOpen(true)
    } catch (fetchError: unknown) {
      toast.error(getErrorMessage(fetchError, "Failed to load inward gauges for print"))
    } finally {
      setIsFetchingPrintData(false)
    }
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{getErrorMessage(error, "Failed to load outward entries")}</AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex gap-4 w-full">
              <Input
                placeholder="Search by inward id, inward no, client name, or status..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>


        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Sr No</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Inward No</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Client</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">DC No</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Inward Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading || isFetching ? (
                      <tr>
                        <td colSpan={6} className="h-24 px-4 text-center">
                          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                            Loading entries...
                          </div>
                        </td>
                      </tr>
                    ) : paginatedEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center">
                          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                          <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                            {searchQuery ? "No outward entries found" : "No outward entries available"}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {searchQuery ? "Try different search keywords" : "Entries will appear when inward records are created"}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedEntries.map((entry, index) => (
                        <tr key={entry.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">{index + 1}</td>
                          <td className="p-4 align-middle">{entry.inward_no}</td>
                          <td className="p-4 align-middle">{entry.client_org_name || "N/A"}</td>
                          <td className="p-4 align-middle">{entry.client_dc_no || "N/A"}</td>
                          <td className="p-4 align-middle">{formatDate(entry.inward_date)}</td>
                          <td className="p-4 align-middle">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handlePrintClick(entry)}
                              disabled={isFetchingPrintData}
                            >
                              <PrinterCheckIcon className="h-4 w-4" />
                              Print
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && !isLoading && !isFetching && paginatedEntries.length > 0 && (
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
        </CardContent>
      </Card>

      {selectedInward && (
        <OutwardChallanPrintPreview
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          companyName={selectedInward.client_org_name || "Company"}
          companyAddress="151/1, Kalappanna Awade Textile Park, Kolhapur-416121 | calibration@company.com"
          inward={selectedInward}
          gauges={selectedGauges}
        />
      )}
    </>
  )
}
