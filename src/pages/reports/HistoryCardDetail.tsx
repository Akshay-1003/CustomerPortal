import { Link, useParams } from "react-router-dom"
import { useGaugeDetail, useGaugeHistory } from "@/hooks/useGauges"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { CalibrationHistoryReport } from "@/components/reports/CalibrationHistoryReport"

export function HistoryCardDetailPage() {
  const { id } = useParams()
  const { data: gauge, isLoading: gaugeLoading } = useGaugeDetail(id as string)
  const { data: gaugeHistory, isLoading: historyLoading } = useGaugeHistory(id as string)

  const isLoading = gaugeLoading || historyLoading

  if (isLoading) {
    return (
      <Card className="w-full border-border/60 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[520px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5 w-full">
      <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/reports/history-card">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{gauge?.master_gauge || "History Card"}</h2>
            <p className="text-sm text-muted-foreground">
              Gauge ID: <span className="font-medium text-foreground">{gauge?.identification_number || "N/A"}</span>
            </p>
          </div>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
     
        <CardContent>
          <CalibrationHistoryReport gauge={gauge} history={gaugeHistory} />
        </CardContent>
      </Card>
    </div>
  )
}
