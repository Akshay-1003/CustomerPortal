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
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  })
}

export function useGaugeHistory(gaugeId: string) {
  return useQuery({
    queryKey: ["gauge-history", gaugeId],
    queryFn: () => gaugeService.getGaugeHistory(gaugeId),
    enabled: !!gaugeId,
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: 1,
  })
}

export function useGaugeDetail(gaugeId: string) {
  return useQuery({
    queryKey: ['gauge', gaugeId],
    queryFn: () => gaugeService.getGaugeById(gaugeId),
    enabled: !!gaugeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    retry: 1,
  })
}

