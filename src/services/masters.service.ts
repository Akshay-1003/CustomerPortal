import { apiService } from "./api.service"
import type { CertificateType, Gauge, GaugeMasterOption } from "@/types/api"

function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.results)) return obj.results as T[]
  }
  return []
}

export type GaugeCreatePayload = {
  master_gauge_id: string
  certificate_type_id: string
  gauge_class: string
  identification_number: string
  calibration_frequency: number
  calibration_frequency_unit: string
  make: string
  manf_serial_number: string
  unit: string
  calibration_location_type: string
  calibration_location: string
  calibration_done_under: string
  gauge_condition: string
  specifications: Record<string, unknown>
}

export const mastersService = {
  async getGaugeMasterOptions(): Promise<GaugeMasterOption[]> {
    const response = await apiService.get<unknown>("/gauge/master")
    return asArray<GaugeMasterOption>(response)
  },

  async getCertificateTypes(): Promise<CertificateType[]> {
    const response = await apiService.get<unknown>("/certificate/types")
    return asArray<CertificateType>(response)
  },

  async createGauge(payload: GaugeCreatePayload): Promise<Gauge> {
    return apiService.post<Gauge>("/gauge", payload)
  },

  async updateGauge(gaugeId: string, payload: GaugeCreatePayload): Promise<Gauge> {
    return apiService.put<Gauge>(`/gauge/${gaugeId}`, payload)
  },

  async deleteGauge(gaugeId: string): Promise<void> {
    await apiService.delete(`/gauge/${gaugeId}`)
  },

  async getHistoryCardFormatNumber(): Promise<string | null> {
    const response = await apiService.get<unknown>("/history-card/format-number")
    if (typeof response === "string") return response
    if (response && typeof response === "object") {
      const obj = response as Record<string, unknown>
      const value = obj.history_card_format_number ?? obj.format_number ?? obj.value
      if (typeof value === "string") return value
    }
    return null
  },

  async upsertHistoryCardFormatNumber(value: string): Promise<void> {
    const payload = { history_card_format_number: value }
    try {
      await apiService.put("/history-card/format-number", payload)
      return
    } catch {
      await apiService.post("/history-card/format-number", payload)
    }
  },
}

