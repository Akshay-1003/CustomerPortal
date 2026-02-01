import { useQuery } from '@tanstack/react-query'
import { gaugeService } from '@/services/gauge.service'
import { authService } from '@/services/auth.service'

export function useGauges() {
  const organizationId = authService.getOrganizationId()


  return useQuery({
    queryKey: ['gauges', organizationId],
    queryFn: () => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }
      return gaugeService.getGaugesByOrganization(organizationId)
    },
    enabled: !!organizationId,
    retry: 1,
  })
}


export function useGaugeHistory(gaugeId: string) {
  return useQuery({
    queryKey: ["gauge-history", gaugeId],
    queryFn: () => gaugeService.getGaugeHistory(gaugeId),
    enabled: !!gaugeId,
    retry: 1,
  })
}

export function useGaugeDetail(gaugeId: string) {
  return useQuery({
    queryKey: ['gauge', gaugeId],
    queryFn: () => gaugeService.getGaugeById(gaugeId),
    enabled: !!gaugeId,
    retry: 1,
  })
}

