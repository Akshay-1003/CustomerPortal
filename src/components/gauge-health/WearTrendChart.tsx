import { motion } from "framer-motion"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatGaugeMetric } from "@/lib/gauge-health/calculations"
import type { GaugeLifePredictionMetrics } from "@/types/gauge-health"

interface WearTrendChartProps {
  metrics: GaugeLifePredictionMetrics
}

export function WearTrendChart({ metrics }: WearTrendChartProps) {
  const formatValue = (value: number | string | undefined, label: string | undefined) => {
    return [`${formatGaugeMetric(Number(value ?? 0), 3)} mm`, label ?? "Value"] as [string, string]
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Wear Trend Line Chart</CardTitle>
              <CardDescription>
                Historical measured values plotted against standard size, working limits, and wear limit.
              </CardDescription>
            </div>
            <Badge variant="outline">{metrics.wearTrendIndicator}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.wearTrendData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={["dataMin - 0.003", "dataMax + 0.003"]} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: "#dbe4f0" }}
                  formatter={formatValue}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="measured_value_mm"
                  name="Measured Value"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2563eb" }}
                  activeDot={{ r: 6 }}
                />
                <Line type="monotone" dataKey="standard_size_mm" name="Standard Size" stroke="#0f172a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="min_limit_mm" name="Min Limit" stroke="#64748b" strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="max_limit_mm" name="Max Limit" stroke="#16a34a" strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="wear_limit_mm" name="Wear Limit" stroke="#dc2626" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
