import type {
  FuturePredictionChartPoint,
  GaugeHealthToneConfig,
  GaugeLifePredictionFormValues,
  GaugeLifePredictionMetrics,
  WearDirection,
  WearTrendChartPoint,
} from "@/types/gauge-health"

const MICRONS_PER_MM = 1000
const PREDICTION_HORIZON_YEARS = 5

const toneMap: Record<GaugeLifePredictionMetrics["tone"], GaugeHealthToneConfig> = {
  healthy: {
    tone: "healthy",
    accentClassName: "text-emerald-700",
    softAccentClassName: "from-emerald-500/15 via-emerald-400/5 to-transparent",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    progressColor: "#16a34a",
    chartColor: "#16a34a",
  },
  warning: {
    tone: "warning",
    accentClassName: "text-amber-700",
    softAccentClassName: "from-amber-500/15 via-amber-400/5 to-transparent",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    progressColor: "#d97706",
    chartColor: "#d97706",
  },
  critical: {
    tone: "critical",
    accentClassName: "text-rose-700",
    softAccentClassName: "from-rose-500/15 via-rose-400/5 to-transparent",
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
    progressColor: "#dc2626",
    chartColor: "#dc2626",
  },
  rejected: {
    tone: "rejected",
    accentClassName: "text-red-800",
    softAccentClassName: "from-red-500/15 via-red-400/5 to-transparent",
    badgeClassName: "border-red-200 bg-red-50 text-red-700",
    progressColor: "#991b1b",
    chartColor: "#991b1b",
  },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function getWearDirectionFactor(wearDirection: WearDirection) {
  return wearDirection === "increasing" ? 1 : -1
}

function getWearTrendIndicator(wearDirection: WearDirection) {
  return wearDirection === "increasing" ? "↗ Increasing" : "↘ Decreasing"
}

function createWearTrendData(
  input: GaugeLifePredictionFormValues,
  sortedHistory: GaugeLifePredictionFormValues["history"]
): WearTrendChartPoint[] {
  return sortedHistory.map((item) => ({
    year: item.year,
    measured_value_mm: item.measured_value_mm,
    standard_size_mm: input.standard_size_mm,
    min_limit_mm: input.min_limit_mm,
    max_limit_mm: input.max_limit_mm,
    wear_limit_mm: input.wear_limit_mm,
  }))
}

function createFuturePredictionData(
  input: GaugeLifePredictionFormValues,
  sortedHistory: GaugeLifePredictionFormValues["history"],
  wearRateMmPerYear: number
): FuturePredictionChartPoint[] {
  const latestObservation = sortedHistory[sortedHistory.length - 1]
  const directionFactor = getWearDirectionFactor(input.wear_direction)
  const actualPoints = sortedHistory.map((item) => ({
    year: item.year,
    actual_measured_value_mm: item.measured_value_mm,
    projected_measured_value_mm: item.year === latestObservation.year ? item.measured_value_mm : null,
    wear_limit_mm: input.wear_limit_mm,
  }))

  const futurePoints = Array.from({ length: PREDICTION_HORIZON_YEARS }, (_, index) => {
    const projectedYear = latestObservation.year + index + 1
    const projectedValue =
      wearRateMmPerYear > 0
        ? latestObservation.measured_value_mm + directionFactor * wearRateMmPerYear * (index + 1)
        : latestObservation.measured_value_mm

    return {
      year: projectedYear,
      actual_measured_value_mm: null,
      projected_measured_value_mm: round(projectedValue, 6),
      wear_limit_mm: input.wear_limit_mm,
    }
  })

  return [...actualPoints, ...futurePoints]
}

function getStatus(
  wearPercentage: number,
  exceededWearLimit: boolean,
  estimatedRemainingLifeYears: number | null
): GaugeLifePredictionMetrics["status"] {
  if (exceededWearLimit) {
    return "Rejected"
  }

  if ((estimatedRemainingLifeYears !== null && estimatedRemainingLifeYears < 1) || wearPercentage >= 80) {
    return "Critical"
  }

  if (wearPercentage >= 50) {
    return "Warning"
  }

  return "Healthy"
}

function getTrendSummary(
  status: GaugeLifePredictionMetrics["status"],
  stableTrend: boolean,
  wearDirection: WearDirection,
  estimatedRemainingLifeYears: number | null,
  projectedCrossingYear: number | null
) {
  if (status === "Rejected") {
    return "Gauge exceeded the configured wear limit and should be removed from service."
  }

  if (stableTrend) {
    return "Stable / No significant wear trend detected."
  }

  if (estimatedRemainingLifeYears === null) {
    return "Wear trend could not be projected from the available observations."
  }

  if (projectedCrossingYear !== null) {
    return `At the current ${wearDirection} wear trend, the gauge may approach its wear limit around ${round(projectedCrossingYear, 1)}.`
  }

  return `Projected remaining usable life is approximately ${round(estimatedRemainingLifeYears, 2)} years.`
}

function getEngineeringRecommendation(
  status: GaugeLifePredictionMetrics["status"],
  stableTrend: boolean,
  wearDirection: WearDirection
) {
  if (status === "Rejected") {
    return "Gauge exceeded wear limit. Do not use. Quarantine the instrument, investigate process exposure, and replace or rework before release."
  }

  if (status === "Critical") {
    return "Gauge approaching wear limit. Plan replacement, shorten recall interval, and prioritize supervisory review before the next calibration cycle."
  }

  if (status === "Warning") {
    return stableTrend
      ? "Gauge is within control today, but continue routine monitoring and confirm stability across the next calibration interval."
      : `Gauge wear is trending ${wearDirection}. Monitor calibration closely and consider a tighter review interval for higher-utilization applications.`
  }

  return stableTrend
    ? "Gauge is operating within safe usable limits with no significant wear trend detected."
    : "Gauge is operating within safe usable limits. Continue standard calibration planning and monitor annual wear progression."
}

export function getGaugeHealthTone(tone: GaugeLifePredictionMetrics["tone"]) {
  return toneMap[tone]
}

export function formatGaugeMetric(value: number, digits = 2) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function calculateGaugeLifePrediction(
  input: GaugeLifePredictionFormValues
): GaugeLifePredictionMetrics {
  const sortedHistory = [...input.history].sort((left, right) => left.year - right.year)
  const firstObservation = sortedHistory[0]
  const latestObservation = sortedHistory[sortedHistory.length - 1]
  const directionFactor = getWearDirectionFactor(input.wear_direction)
  const wearTrendIndicator = getWearTrendIndicator(input.wear_direction)

  const wearWindowMm = (input.wear_limit_mm - input.standard_size_mm) * directionFactor
  const rawMeasuredDeltaMm = latestObservation.measured_value_mm - firstObservation.measured_value_mm
  const totalWearMm = rawMeasuredDeltaMm * directionFactor
  const totalWearMicrons = totalWearMm * MICRONS_PER_MM
  const totalYears = latestObservation.year - firstObservation.year
  const wearRateMicronsPerYear = totalYears > 0 ? Math.max(totalWearMicrons / totalYears, 0) : 0
  const wearRateMmPerYear = wearRateMicronsPerYear / MICRONS_PER_MM
  const remainingMarginMicrons =
    input.wear_direction === "decreasing"
      ? (latestObservation.measured_value_mm - input.wear_limit_mm) * MICRONS_PER_MM
      : (input.wear_limit_mm - latestObservation.measured_value_mm) * MICRONS_PER_MM
  const stableTrend = wearRateMicronsPerYear <= 0
  const estimatedRemainingLifeYears =
    remainingMarginMicrons <= 0
      ? 0
      : stableTrend || wearRateMicronsPerYear === 0
        ? null
        : remainingMarginMicrons / wearRateMicronsPerYear
  const exceededWearLimit =
    input.wear_direction === "decreasing"
      ? latestObservation.measured_value_mm <= input.wear_limit_mm
      : latestObservation.measured_value_mm >= input.wear_limit_mm
  const rawWearPercentage =
    wearWindowMm === 0
      ? exceededWearLimit
        ? 100
        : 0
      : (((latestObservation.measured_value_mm - input.standard_size_mm) * directionFactor) /
          wearWindowMm) *
        100

  const wearPercentage = clamp(rawWearPercentage, 0, 100)
  const remainingLifePercentage = clamp(100 - wearPercentage, 0, 100)
  const healthPercentage = remainingLifePercentage
  const projectedCrossingYear =
    estimatedRemainingLifeYears !== null && Number.isFinite(estimatedRemainingLifeYears)
      ? latestObservation.year + estimatedRemainingLifeYears
      : null

  const status = getStatus(
    wearPercentage,
    exceededWearLimit,
    estimatedRemainingLifeYears
  )

  const tone =
    status === "Healthy"
      ? "healthy"
      : status === "Warning"
        ? "warning"
        : status === "Critical"
          ? "critical"
          : "rejected"

  const wearTrendData = createWearTrendData(input, sortedHistory)
  const futurePredictionData = createFuturePredictionData(input, sortedHistory, wearRateMmPerYear)
  const criticalLifeWindow = estimatedRemainingLifeYears !== null && estimatedRemainingLifeYears < 1

  return {
    wearDirection: input.wear_direction,
    wearTrendIndicator,
    sortedHistory,
    firstObservation,
    latestObservation,
    totalWearMm: round(Math.max(totalWearMm, 0), 6),
    totalWearMicrons: round(Math.max(totalWearMicrons, 0), 2),
    totalYears,
    wearRateMicronsPerYear: round(wearRateMicronsPerYear, 2),
    wearRateMmPerYear: round(wearRateMmPerYear, 6),
    remainingMarginMicrons: round(remainingMarginMicrons, 2),
    estimatedRemainingLifeYears:
      estimatedRemainingLifeYears !== null && Number.isFinite(estimatedRemainingLifeYears)
        ? round(estimatedRemainingLifeYears, 2)
        : null,
    wearPercentage: round(wearPercentage, 2),
    remainingLifePercentage: round(remainingLifePercentage, 2),
    healthPercentage: round(healthPercentage, 2),
    status,
    tone,
    stableTrend,
    exceededWearLimit,
    criticalLifeWindow,
    projectedCrossingYear:
      projectedCrossingYear !== null && Number.isFinite(projectedCrossingYear)
        ? round(projectedCrossingYear, 2)
        : null,
    trendSummary: getTrendSummary(
      status,
      stableTrend,
      input.wear_direction,
      estimatedRemainingLifeYears,
      projectedCrossingYear
    ),
    engineeringRecommendation: getEngineeringRecommendation(status, stableTrend, input.wear_direction),
    operatingNote:
      "Prediction engine assumes a linear wear trend from historical calibration observations. Replace with service-backed analytics when backend APIs become available.",
    wearTrendData,
    futurePredictionData,
  }
}
