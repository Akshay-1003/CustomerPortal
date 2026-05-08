import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CALIBRATION_CHART_COLORS, formatDashboardNumber } from "@/lib/monthlyCalibrationDashboard"
import type { NormalizedMonthlyCalibrationDatum } from "@/types/dashboard"

interface PlannedDistributionTrendChartProps {
  data: NormalizedMonthlyCalibrationDatum[]
}

export function PlannedDistributionTrendChart({ data }: PlannedDistributionTrendChartProps) {
  const formatTooltipValue = (value: number | string | undefined) => {
    return [formatDashboardNumber(Number(value ?? 0)), "Planned"] as [string, string]
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Planned Distribution Line Chart</CardTitle>
        <CardDescription>
          Visualize how calibration planning load rises and falls through the year.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="shortMonthLabel" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: "#dbe4f0" }}
                formatter={formatTooltipValue}
              />
              <Line
                type="monotone"
                dataKey="planned"
                name="Planned"
                stroke={CALIBRATION_CHART_COLORS.planned}
                strokeWidth={3}
                dot={{ r: 4, fill: CALIBRATION_CHART_COLORS.planned }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
