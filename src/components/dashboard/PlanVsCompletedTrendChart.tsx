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
import { CALIBRATION_CHART_COLORS, formatDashboardNumber } from "@/lib/monthlyCalibrationDashboard"
import type { NormalizedMonthlyCalibrationDatum } from "@/types/dashboard"

interface PlanVsCompletedTrendChartProps {
  data: NormalizedMonthlyCalibrationDatum[]
}

export function PlanVsCompletedTrendChart({ data }: PlanVsCompletedTrendChartProps) {
  const formatTooltipValue = (value: number | string | undefined, name: string | undefined) => {
    return [formatDashboardNumber(Number(value ?? 0)), name ?? "Value"] as [string, string]
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Plan vs Completed Trend</CardTitle>
        <CardDescription>
          See whether calibration output is tracking ahead of or behind the monthly plan.
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
              <Legend />
              <Line
                type="monotone"
                dataKey="planned"
                name="Planned"
                stroke={CALIBRATION_CHART_COLORS.planned}
                strokeWidth={3}
                dot={{ r: 4, fill: CALIBRATION_CHART_COLORS.planned }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke={CALIBRATION_CHART_COLORS.completed}
                strokeWidth={3}
                dot={{ r: 4, fill: CALIBRATION_CHART_COLORS.completed }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
