import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getGaugeHealthTone } from "@/lib/gauge-health/calculations"
import type { GaugeLifePredictionFormValues, GaugeLifePredictionMetrics } from "@/types/gauge-health"
import { AnimatedMetric } from "./AnimatedMetric"
import { PlugGaugeHealthVisual } from "./PlugGaugeHealthVisual"

interface IndustrialHeroCardProps {
  metrics: GaugeLifePredictionMetrics
  simulatedValues: GaugeLifePredictionFormValues
  lastRunLabel: string
}

export function IndustrialHeroCard({
  metrics,
  simulatedValues,
  lastRunLabel,
}: IndustrialHeroCardProps) {
  const tone = getGaugeHealthTone(metrics.tone)
  const visualStatus =
    metrics.status === "Healthy"
      ? "healthy"
      : metrics.status === "Warning"
        ? "warning"
        : metrics.status === "Critical"
          ? "critical"
          : "rejected"

  return (
    <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-slate-50 shadow-sm">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${tone.softAccentClassName}`} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] [background-size:38px_38px]" />

      <CardContent className="relative grid gap-6 p-6 xl:grid-cols-[1.2fr_0.9fr_0.9fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={tone.badgeClassName}>Frontend Demo</Badge>
            <Badge variant="outline">Backend-ready architecture</Badge>
            <Badge variant="outline">{metrics.wearTrendIndicator}</Badge>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              Gauge Life Prediction &amp; Wear Analytics
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Predict gauge usable life using historical calibration observations and a linear wear trend model suitable for calibration demo workflows.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Current gauge</div>
              <div className="mt-2 text-lg font-semibold">{simulatedValues.gauge_name}</div>
              <div className="mt-1 text-sm text-muted-foreground">{simulatedValues.gauge_type}</div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Simulation updated</div>
              <div className="mt-2 text-lg font-semibold">{lastRunLabel}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Based on {metrics.sortedHistory.length} calibration observations
              </div>
              <div className="mt-3 text-sm font-medium">{metrics.wearTrendIndicator}</div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative xl:col-span-2"
        >
          <PlugGaugeHealthVisual
            goWearPercent={metrics.wearPercentage}
            goRemainingLifePercent={metrics.remainingLifePercentage}
            estimatedRemainingYears={metrics.estimatedRemainingLifeYears ?? 0}
            status={visualStatus}
            measuredValueMm={metrics.latestObservation.measured_value_mm}
            standardSizeMm={simulatedValues.standard_size_mm}
            wearLimitMm={simulatedValues.wear_limit_mm}
            wearDirection={metrics.wearDirection}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="grid gap-4"
        >
          <div className="rounded-[28px] border border-border/70 bg-background/85 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Wear Mapped</div>
                <div className="mt-2 text-lg font-semibold">
                  <AnimatedMetric value={metrics.wearPercentage} formatter={(value) => `${value.toFixed(1)}%`} />
                </div>
              </div>
              <Badge className={tone.badgeClassName}>Wear mapped</Badge>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Current health</span>
                <span className={`font-semibold ${tone.accentClassName}`}>{metrics.healthPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: tone.progressColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Math.max(metrics.healthPercentage, 0), 100)}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{metrics.wearTrendIndicator}</span>
                <span>Wear rate: {metrics.wearRateMicronsPerYear.toFixed(2)} um/year</span>
              </div>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}
