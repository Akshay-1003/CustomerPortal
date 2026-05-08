import { motion } from "framer-motion"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatGaugeMetric, getGaugeHealthTone } from "@/lib/gauge-health/calculations"
import type { GaugeLifePredictionMetrics } from "@/types/gauge-health"

interface HealthDonutChartProps {
  metrics: GaugeLifePredictionMetrics
}

export function HealthDonutChart({ metrics }: HealthDonutChartProps) {
  const tone = getGaugeHealthTone(metrics.tone)
  const data = [
    { name: "Used Life %", value: Math.min(Math.max(metrics.wearPercentage, 0), 100), color: "#f97316" },
    { name: "Remaining Life %", value: Math.min(Math.max(metrics.remainingLifePercentage, 0), 100), color: tone.progressColor },
  ]

  const formatValue = (value: number | string | undefined, label: string | undefined) => {
    return [`${formatGaugeMetric(Number(value ?? 0), 1)}%`, label ?? "Value"] as [string, string]
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Health Donut Chart</CardTitle>
          <CardDescription>
            Split the gauge condition into used life and remaining life for quick engineering interpretation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={88} outerRadius={118} paddingAngle={3}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: "#dbe4f0" }}
                  formatter={formatValue}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-4xl font-semibold ${tone.accentClassName}`}>{metrics.healthPercentage.toFixed(0)}%</div>
              <div className="mt-1 text-sm text-muted-foreground">Current health</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
