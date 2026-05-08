export type GaugeHealthStatus = "Healthy" | "Warning" | "Critical" | "Rejected"
export type WearDirection = "increasing" | "decreasing"

export interface GaugeHistoryObservation {
  year: number
  measured_value_mm: number
}

export interface GaugeLifePredictionFormValues {
  gauge_name: string
  gauge_type: string
  wear_direction: WearDirection
  standard_size_mm: number
  min_limit_mm: number
  max_limit_mm: number
  wear_limit_mm: number
  history: GaugeHistoryObservation[]
}

export interface GaugeHealthToneConfig {
  tone: "healthy" | "warning" | "critical" | "rejected"
  accentClassName: string
  softAccentClassName: string
  badgeClassName: string
  progressColor: string
  chartColor: string
}

export interface WearTrendChartPoint {
  year: number
  measured_value_mm: number
  standard_size_mm: number
  min_limit_mm: number
  max_limit_mm: number
  wear_limit_mm: number
}

export interface FuturePredictionChartPoint {
  year: number
  actual_measured_value_mm: number | null
  projected_measured_value_mm: number | null
  wear_limit_mm: number
}

export interface GaugeLifePredictionMetrics {
  wearDirection: WearDirection
  wearTrendIndicator: string
  sortedHistory: GaugeHistoryObservation[]
  firstObservation: GaugeHistoryObservation
  latestObservation: GaugeHistoryObservation
  totalWearMm: number
  totalWearMicrons: number
  totalYears: number
  wearRateMicronsPerYear: number
  wearRateMmPerYear: number
  remainingMarginMicrons: number
  estimatedRemainingLifeYears: number | null
  wearPercentage: number
  remainingLifePercentage: number
  healthPercentage: number
  status: GaugeHealthStatus
  tone: GaugeHealthToneConfig["tone"]
  stableTrend: boolean
  exceededWearLimit: boolean
  criticalLifeWindow: boolean
  projectedCrossingYear: number | null
  trendSummary: string
  engineeringRecommendation: string
  operatingNote: string
  wearTrendData: WearTrendChartPoint[]
  futurePredictionData: FuturePredictionChartPoint[]
}
