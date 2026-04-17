import { apiService } from './api.service'
import { type Gauge, type GaugeHistory } from '@/types/api'

export const gaugeService = {
  async getGaugesByOrganization(organizationId: string, page: number = 1, limit: number = 10, search?: string): Promise<{
    data: Gauge[],
    total: number,
    page: number,
    limit: number
  }> {
    // Real API call - Get gauges for the logged-in organization with pagination
    if (!organizationId) {
      throw new Error('Organization ID is required')
    }
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    
    if (search) {
      params.append('search', search)
    }
    
    return await apiService.get<{
      data: Gauge[],
      total: number,
      page: number,
      limit: number
    }>(`/gauge/organization/${organizationId}/gauges?${params}`)
  },

  async getGaugeHistory(gaugeId: string): Promise<GaugeHistory[]> {
    // Real API call - Get history for a specific gauge
    if (!gaugeId) {
      throw new Error('Gauge ID is required')
    }
    
    return await apiService.get<GaugeHistory[]>(`/gauge/${gaugeId}/history`)
  },

  async getGaugeById(gaugeId: string): Promise<Gauge> {
    // Real API call - Get single gauge details
    if (!gaugeId) {
      throw new Error('Gauge ID is required')
    }
    
    return await apiService.get<Gauge>(`/gauge/${gaugeId}`)
  },

  async updateGaugeStatus(gaugeId: string, status: string): Promise<Gauge> {
    // Real API call - Update gauge status
    if (!gaugeId) {
      throw new Error('Gauge ID is required')
    }
    
    return await apiService.put<Gauge>(`/gauge/${gaugeId}`, { status })
  },
}

