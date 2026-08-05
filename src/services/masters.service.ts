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

function getNumericMeta(payload: unknown, key: string): number | null {
  if (!payload || typeof payload !== "object") return null

  const value = (payload as Record<string, unknown>)[key]
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  return null
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
  certificate_issue_date?: string | null
  next_calibration_date?: string | null
  certificate_url?: string
  specifications: Record<string, unknown>
}

function extractUploadedFileUrl(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) {
    return payload
  }

  if (!payload || typeof payload !== "object") {
    return null
  }

  const obj = payload as Record<string, unknown>
  const candidateKeys = [
    "url",
    "file_url",
    "fileUrl",
    "certificate_url",
    "certificateUrl",
    "secure_url",
    "path",
  ]

  for (const key of candidateKeys) {
    const value = obj[key]
    if (typeof value === "string" && value.trim()) {
      return value
    }
  }

  if (obj.data && typeof obj.data === "object") {
    return extractUploadedFileUrl(obj.data)
  }

  return null
}

export const mastersService = {
  async getGaugeMasterOptions(): Promise<GaugeMasterOption[]> {
    const pageSize = 100
    let page = 0
    let total = Number.POSITIVE_INFINITY
    const allItems: GaugeMasterOption[] = []

    while (allItems.length < total) {
      const response = await apiService.get<unknown>(`/gauge/master?page=${page}&limit=${pageSize}`)
      const items = asArray<GaugeMasterOption>(response)

      if (items.length === 0) {
        break
      }

      allItems.push(...items)

      const responseTotal = getNumericMeta(response, "total")
      total = responseTotal ?? allItems.length

      if (items.length < pageSize) {
        break
      }

      page += 1
    }

    const uniqueItems = new Map<string, GaugeMasterOption>()
    allItems.forEach((item) => {
      if (item?.id) {
        uniqueItems.set(item.id, item)
      }
    })

    return Array.from(uniqueItems.values())
  },

  async getCertificateTypes(): Promise<CertificateType[]> {
    const response = await apiService.get<unknown>("/certificate/types")
    return asArray<CertificateType>(response)
  },

  async createGauge(payload: GaugeCreatePayload): Promise<Gauge> {
    return apiService.post<Gauge>("/gauge", payload)
  },

  async uploadGaugeCertificate(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await apiService.post<unknown>("/uploads/certificates", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    const uploadedUrl = extractUploadedFileUrl(response)
    if (!uploadedUrl) {
      throw new Error("Certificate uploaded but no file URL was returned")
    }

    return uploadedUrl
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
