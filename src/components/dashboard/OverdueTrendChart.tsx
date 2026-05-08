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

interface OverdueTrendChartProps {
  data: NormalizedMonthlyCalibrationDatum[]
}

export function OverdueTrendChart({ data }: OverdueTrendChartProps) {
  const formatTooltipValue = (value: number | string | undefined) => {
    return [formatDashboardNumber(Number(value ?? 0)), "Overdue"] as [string, string]
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Overdue Trend Chart</CardTitle>
        <CardDescription>
          Highlight the months where overdue calibrations create the largest quality risk.
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
                dataKey="overdue"
                name="Overdue"
                stroke={CALIBRATION_CHART_COLORS.overdue}
                strokeWidth={3}
                dot={{ r: 4, fill: CALIBRATION_CHART_COLORS.overdue }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
