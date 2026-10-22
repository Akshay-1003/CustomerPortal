import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useGaugeDetail, useGaugeHistory } from "@/hooks/useGauges"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CalibrationHistoryReport } from "@/components/reports/CalibrationHistoryReport"
import { useCurrentOrganizationPrintInfo } from "@/hooks/useCurrentOrganizationPrintInfo"
import { mastersService } from "@/services/masters.service"
import { authService } from "@/services/auth.service"
import { useThroughFilter } from "@/hooks/useThroughFilter"
import { ThroughGroupFilter } from "@/components/filters/ThroughGroupFilter"

export function HistoryCardDetailPage() {
  const { id } = useParams()
  const { data: gauge, isLoading: gaugeLoading } = useGaugeDetail(id as string)
  const throughFilter = useThroughFilter()
  const { data: gaugeHistory, isLoading: historyLoading } = useGaugeHistory(id as string, throughFilter.apiGroup)
  const { organizationName, organizationAddress } = useCurrentOrganizationPrintInfo()
  const organizationId = authService.getOrganizationId()
  const { data: formatNumber } = useQuery({
    queryKey: ["history-card-format-number", organizationId],
    queryFn: () => mastersService.getHistoryCardFormatNumber(),
    enabled: Boolean(organizationId),
    staleTime: 1000 * 60 * 10,
  })

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
      {throughFilter.enabled && <div className="mb-3 flex justify-end">
        <ThroughGroupFilter value={throughFilter.group} onChange={throughFilter.setGroup} />
      </div>}
      <CalibrationHistoryReport
        gauge={gauge}
        history={gaugeHistory}
        companyName={organizationName}
        companyAddress={organizationAddress}
        formatNumber={formatNumber}
      />
    </div>
  )
}
