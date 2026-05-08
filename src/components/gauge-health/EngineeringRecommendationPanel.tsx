import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, Clock3, FileCog, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getGaugeHealthTone } from "@/lib/gauge-health/calculations"
import type { GaugeLifePredictionMetrics } from "@/types/gauge-health"

interface EngineeringRecommendationPanelProps {
  metrics: GaugeLifePredictionMetrics
}

export function EngineeringRecommendationPanel({ metrics }: EngineeringRecommendationPanelProps) {
  const tone = getGaugeHealthTone(metrics.tone)

  const actionItems =
    metrics.status === "Rejected"
      ? [
          "Stop operational use of the gauge immediately.",
          "Segregate the instrument and record a rejection trace in the quality log.",
          "Assess process exposure for jobs measured since the last valid calibration.",
        ]
      : metrics.status === "Critical"
        ? [
            "Plan replacement or refurbishment before the next production-critical cycle.",
            "Reduce calibration interval and increase supervisory review.",
            "Reserve the gauge for lower-risk use only if quality procedures permit.",
          ]
        : metrics.status === "Warning"
          ? [
              "Monitor calibration closely across upcoming recall points.",
              "Review usage intensity, handling conditions, and surface contact behavior.",
              "Consider an earlier interim verification if wear continues to accelerate.",
            ]
          : [
              "Gauge is operating within safe usable limits.",
              "Continue normal calibration planning and standard handling controls.",
              "Retain current interval unless operating context becomes harsher.",
            ]

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.14 }}>
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCog className="h-5 w-5 text-primary" />
              Engineering Recommendation Panel
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Recommendation logic is derived from wear percentage, remaining margin, and projected life.
            </p>
          </div>
          <Badge className={tone.badgeClassName}>{metrics.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-5">
            <div className="flex items-start gap-3">
              {metrics.status === "Healthy" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              ) : metrics.status === "Warning" ? (
                <Clock3 className="mt-0.5 h-5 w-5 text-amber-600" />
              ) : (
                <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="font-medium">Primary recommendation</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {metrics.engineeringRecommendation}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/80 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Trend summary</p>
                  <p className="mt-1 text-sm text-muted-foreground">{metrics.trendSummary}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-5">
            <div className="text-sm font-medium">Recommended actions</div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {actionItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className={`mt-1.5 h-2 w-2 rounded-full ${tone.tone === "healthy" ? "bg-emerald-500" : tone.tone === "warning" ? "bg-amber-500" : "bg-red-500"}`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-dashed border-border bg-background/80 p-4 text-sm text-muted-foreground">
              {metrics.operatingNote}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
