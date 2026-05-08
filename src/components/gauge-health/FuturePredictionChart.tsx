import { motion } from "framer-motion"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatGaugeMetric } from "@/lib/gauge-health/calculations"
import type { GaugeLifePredictionMetrics } from "@/types/gauge-health"

interface FuturePredictionChartProps {
  metrics: GaugeLifePredictionMetrics
}

export function FuturePredictionChart({ metrics }: FuturePredictionChartProps) {
  const formatValue = (value: number | string | undefined, label: string | undefined) => {
    return [`${formatGaugeMetric(Number(value ?? 0), 3)} mm`, label ?? "Value"] as [string, string]
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Future Prediction Chart</CardTitle>
              <CardDescription>
                Project the next five years using the current linear wear trend and highlight the predicted wear-limit crossing point.
              </CardDescription>
            </div>
            <Badge variant="outline">{metrics.wearTrendIndicator}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.futurePredictionData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis type="number" dataKey="year" domain={["dataMin", "dataMax"]} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={["dataMin - 0.003", "dataMax + 0.003"]} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: "#dbe4f0" }}
                  formatter={formatValue}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual_measured_value_mm"
                  name="Actual Measured"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2563eb" }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="projected_measured_value_mm"
                  name="Projected Value"
                  stroke="#f97316"
                  strokeWidth={3}
                  strokeDasharray="7 6"
                  dot={{ r: 4, fill: "#f97316" }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
                <Line type="monotone" dataKey="wear_limit_mm" name="Wear Limit" stroke="#dc2626" strokeWidth={2} dot={false} />

                {metrics.projectedCrossingYear !== null && (
                  <>
                    <ReferenceLine
                      x={metrics.projectedCrossingYear}
                      stroke="#dc2626"
                      strokeDasharray="4 4"
                      label={{ value: "Predicted crossing", fill: "#dc2626", position: "insideTopRight" }}
                    />
                    <ReferenceDot
                      x={metrics.projectedCrossingYear}
                      y={metrics.futurePredictionData[0]?.wear_limit_mm ?? metrics.latestObservation.measured_value_mm}
                      r={6}
                      fill="#dc2626"
                      stroke="white"
                      strokeWidth={2}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
