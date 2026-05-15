import { useParams } from "react-router-dom"
import { useGaugeDetail, useGaugeHistory } from "@/hooks/useGauges"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
    <div className="w-full">
      <CalibrationHistoryReport gauge={gauge} history={gaugeHistory} />
    </div>
  )
}
