import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { gaugeService } from '@/services/gauge.service'
import { authService } from '@/services/auth.service'
import type { Gauge } from '@/types/api'

const BULK_GAUGE_LIMIT = 200

async function fetchAllGaugesByOrganization(organizationId: string): Promise<Gauge[]> {
  let page = 1
  let total = Number.POSITIVE_INFINITY
  const allGauges: Gauge[] = []

  while (allGauges.length < total) {
    const response = await gaugeService.getGaugesByOrganization(organizationId, page, BULK_GAUGE_LIMIT)
    const items = Array.isArray(response.data) ? response.data : []

    if (items.length === 0) {
      break
    }

    allGauges.push(...items)
    total = typeof response.total === 'number' ? response.total : allGauges.length

    if (items.length < BULK_GAUGE_LIMIT) {
      break
    }

    page += 1
  }

  const uniqueGauges = new Map<string, Gauge>()
  allGauges.forEach((gauge) => {
    if (gauge?.id) {
      uniqueGauges.set(gauge.id, gauge)
    }
  })

  return Array.from(uniqueGauges.values())
}

export function useGauges(page: number = 1, limit: number = 10, search?: string) {
  const organizationId = authService.getOrganizationId()

  return useQuery({
    queryKey: ['gauges', organizationId, page, limit, search],
    queryFn: () => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }
      return gaugeService.getGaugesByOrganization(organizationId, page, limit, search)
    },
    enabled: !!organizationId,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  })
}

export function useAllGauges() {
  const organizationId = authService.getOrganizationId()

  return useQuery({
    queryKey: ['gauges-all', organizationId],
    queryFn: () => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }
      return fetchAllGaugesByOrganization(organizationId)
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
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
