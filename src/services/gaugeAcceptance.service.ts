import { apiService } from "./api.service"
import type { AcceptanceList, AcceptanceRow, AcceptanceSource, ReviewValues, ReviewResult, BulkReviewResult } from "@/types/gaugeAcceptance"

const path = "/customer/gauge-acceptances"
export const acceptanceService = {
  list: (params: { status: string; search: string; decision?: string; through_group?: string; page: number; limit: number }) => apiService.get<AcceptanceList>(path, { params }),
  detail: (id: string) => apiService.get<AcceptanceRow>(`${path}/${id}`),
  review: (source: AcceptanceSource, values: ReviewValues) => {
    const { outward_gauge_id, ...version } = source
    return apiService.put<ReviewResult>(`${path}/${outward_gauge_id}/review`, { ...version, ...values })
  },
  bulk: (items: AcceptanceSource[], values: ReviewValues) => apiService.post<BulkReviewResult>(`${path}/bulk-review`, { items, ...values }),
}
