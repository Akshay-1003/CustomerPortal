import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CALIBRATION_CHART_COLORS, formatDashboardNumber } from "@/lib/monthlyCalibrationDashboard"
import type { NormalizedMonthlyCalibrationDatum } from "@/types/dashboard"

interface MonthlyPlannedChartProps {
  data: NormalizedMonthlyCalibrationDatum[]
}

export function MonthlyPlannedChart({ data }: MonthlyPlannedChartProps) {
  const formatTooltipValue = (value: number | string | undefined) => {
    return [formatDashboardNumber(Number(value ?? 0)), "Planned"] as [string, string]
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Monthly Planned Bar Chart</CardTitle>
        <CardDescription>
          Planning load by month for the selected calibration year.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="shortMonthLabel" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(37, 99, 235, 0.08)" }}
                contentStyle={{ borderRadius: 12, borderColor: "#dbe4f0" }}
                formatter={formatTooltipValue}
                labelFormatter={(label) => `${label}`}
              />
              <Bar
                dataKey="planned"
                name="Planned"
                fill={CALIBRATION_CHART_COLORS.planned}
                radius={[8, 8, 0, 0]}
                maxBarSize={42}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
