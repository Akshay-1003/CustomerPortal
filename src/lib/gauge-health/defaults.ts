import type { GaugeLifePredictionFormValues, WearDirection } from "@/types/gauge-health"

export const GAUGE_TYPE_OPTIONS = [
  "GO Plug Gauge",
  "Plain Plug Gauge",
  "Ring Gauge",
  "Snap Gauge",
  "Thread Plug Gauge",
  "Thread Ring Gauge",
  "Bore Gauge",
  "Vernier Caliper",
  "Micrometer",
] as const

export const WEAR_DIRECTION_OPTIONS: Array<{
  label: string
  value: WearDirection
}> = [
  { label: "Increasing", value: "increasing" },
  { label: "Decreasing", value: "decreasing" },
]

const gaugeTypeWearDirectionPresets: Partial<Record<(typeof GAUGE_TYPE_OPTIONS)[number], WearDirection>> = {
  "GO Plug Gauge": "decreasing",
  "Ring Gauge": "increasing",
  "Thread Plug Gauge": "decreasing",
  "Thread Ring Gauge": "increasing",
}

export function getGaugeTypeWearDirectionPreset(gaugeType: string): WearDirection | null {
  return gaugeTypeWearDirectionPresets[gaugeType as (typeof GAUGE_TYPE_OPTIONS)[number]] ?? null
}

export const gaugeLifePredictionDemoDefaults: GaugeLifePredictionFormValues = {
  gauge_name: "GO Plug Gauge - 10 mm Master",
  gauge_type: "GO Plug Gauge",
  wear_direction: "decreasing",
  standard_size_mm: 10,
  min_limit_mm: 9.99,
  max_limit_mm: 10.002,
  wear_limit_mm: 9.988,
  history: [
    { year: 2021, measured_value_mm: 9.999 },
    { year: 2022, measured_value_mm: 9.997 },
    { year: 2023, measured_value_mm: 9.996 },
    { year: 2024, measured_value_mm: 9.994 },
    { year: 2025, measured_value_mm: 9.993 },
  ],
}
