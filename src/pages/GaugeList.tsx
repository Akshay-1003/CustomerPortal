import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CardContent, CardHeader } from "@/components/ui/card"
import { RefreshCw, Plus, AlertCircle, Package } from "lucide-react"
import { useGauges } from "@/hooks/useGauges"
import { GaugeListTable } from "@/components/tables/GaugeListTable"
import {Skeleton} from "@/components/ui/skeleton"
const ITEMS_PER_PAGE = 10

export default function GaugeListPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")

  const { data: gauges, isLoading, isError, error, refetch } = useGauges()
  const filteredGauges = useMemo(() => {
    if (!gauges) return []
    return gauges.filter((gauge) => {
      const matchesSearch =
        searchQuery === "" ||
        gauge.master_gauge.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gauge.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gauge.manf_serial_number?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [gauges, searchQuery])

  /* ---------------- STATES ---------------- */

  if (isLoading) {
    return   <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full" />
      </CardContent>
    </Card>
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {(error as any)?.message || "Failed to load gauges"}
        </AlertDescription>
        <Button onClick={() => refetch()} className="mt-3" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </Alert>
    )
  }

  if (!filteredGauges.length) {
    return (
      <Card className="p-10 flex flex-col items-center gap-4">
        <Package className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No gauges found</p>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Gauge
        </Button>
      </Card>
    )
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Gauge List</h2>
        <p className="text-muted-foreground">
          Manage and track all your gauges
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by name, ID, or serial..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setCurrentPage(1)
          }}
        />

        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <GaugeListTable
        gauges={filteredGauges}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={ITEMS_PER_PAGE}
        onGaugeUpdate={refetch}
      />
    </div>
  )
}
