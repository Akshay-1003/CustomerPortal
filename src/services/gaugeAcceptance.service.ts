import { apiService } from "./api.service"
import type { AcceptanceList, AcceptanceRow, AcceptanceSource, ReviewValues, ReviewResult, BulkReviewResult } from "@/types/gaugeAcceptance"

const path = "/customer/gauge-acceptances"
export const acceptanceService = {
  list: (params: { status: string; search: string; decision?: string; through_group?: string; page: number; limit: number }) => apiService.get<AcceptanceList>(path, { params }),
  detail: (id: string) => apiService.get<AcceptanceRow>(`${path}/${id}`),
  certificate: (source: AcceptanceSource) => apiService.get<{ certificate_url: string; certificate_id: string; certificate_revision: number; inward_gauge_lab_id: string }>(`${path}/${source.outward_gauge_id}/certificate`, {
    params: { certificate_id: source.certificate_id, certificate_revision: source.certificate_revision },
  }),
  review: (source: AcceptanceSource, values: ReviewValues) => {
    const { outward_gauge_id, ...version } = source
    return apiService.put<ReviewResult>(`${path}/${outward_gauge_id}/review`, { ...version, ...values })
  },
  bulk: (items: AcceptanceSource[], values: ReviewValues) => apiService.post<BulkReviewResult>(`${path}/bulk-review`, { items, ...values }),
}
