import { motion } from "framer-motion"
import {
  Activity,
  AlertTriangle,
  Gauge,
  Hourglass,
  Ruler,
  TrendingDown,
  TrendingUp,
  Target,
  TimerReset,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  formatGaugeMetric,
  getGaugeHealthTone,
} from "@/lib/gauge-health/calculations"
import type { GaugeLifePredictionMetrics } from "@/types/gauge-health"
import { AnimatedMetric } from "./AnimatedMetric"

interface GaugeHealthKpiGridProps {
  metrics: GaugeLifePredictionMetrics
}

interface GaugeKpiCard {
  title: string
  icon: typeof Activity
  value: React.ReactNode
  helper: string
  accentClassName?: string
}

export function GaugeHealthKpiGrid({ metrics }: GaugeHealthKpiGridProps) {
  const tone = getGaugeHealthTone(metrics.tone)

  const cards: GaugeKpiCard[] = [
    {
      title: "Current Gauge Health",
      icon: Activity,
      value: <AnimatedMetric value={metrics.healthPercentage} formatter={(value) => `${value.toFixed(1)}%`} />,
      helper: "Remaining usable life, normalized to the configured wear limit.",
      accentClassName: tone.accentClassName,
    },
    {
      title: "Wear Percentage",
      icon: Gauge,
      value: <AnimatedMetric value={metrics.wearPercentage} formatter={(value) => `${value.toFixed(1)}%`} />,
      helper: "Current wear position between standard size and wear limit.",
      accentClassName: tone.accentClassName,
    },
    {
      title: "Remaining Life %",
      icon: Target,
      value: <AnimatedMetric value={metrics.remainingLifePercentage} formatter={(value) => `${value.toFixed(1)}%`} />,
      helper: "Unconsumed usable dimensional life remaining.",
      accentClassName: "text-blue-700",
    },
    {
      title: "Average Wear Rate",
      icon: TimerReset,
      value: (
        <AnimatedMetric
          value={metrics.wearRateMicronsPerYear}
          formatter={(value) => `${formatGaugeMetric(value, 2)} um/year`}
        />
      ),
      helper: "Linearized wear rate derived from first and latest observations.",
    },
    {
      title: "Remaining Margin",
      icon: Ruler,
      value: (
        <AnimatedMetric
          value={metrics.remainingMarginMicrons}
          formatter={(value) => `${formatGaugeMetric(value, 2)} um`}
        />
      ),
      helper: "Available dimensional margin before the configured wear limit is crossed.",
      accentClassName: metrics.remainingMarginMicrons < 0 ? "text-red-700" : undefined,
    },
    {
      title: "Estimated Remaining Years",
      icon: Hourglass,
      value:
        metrics.estimatedRemainingLifeYears === null ? (
          <span>Stable</span>
        ) : (
          <AnimatedMetric
            value={metrics.estimatedRemainingLifeYears}
            formatter={(value) => `${formatGaugeMetric(value, 2)} yrs`}
          />
        ),
      helper: metrics.stableTrend
        ? "Stable / No significant wear trend detected."
        : "Projected remaining life at the current wear rate.",
    },
    {
      title: "Wear Trend",
      icon: metrics.wearDirection === "decreasing" ? TrendingDown : TrendingUp,
      value: <span>{metrics.wearTrendIndicator}</span>,
      helper: "Configured engineering wear direction used for remaining-margin and life prediction logic.",
      accentClassName: "text-slate-800",
    },
    {
      title: "Current Status",
      icon: metrics.status === "Rejected" ? AlertTriangle : Activity,
      value: <Badge className={tone.badgeClassName}>{metrics.status}</Badge>,
      helper: metrics.trendSummary,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04 * index }}
          >
            <Card className="h-full border-border/70 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                  <div className={`text-2xl font-semibold tracking-tight ${card.accentClassName ?? ""}`}>{card.value}</div>
                </div>
                <div className="rounded-full bg-primary/10 p-2.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs leading-relaxed text-muted-foreground">{card.helper}</p>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
