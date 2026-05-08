import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CALIBRATION_CHART_COLORS, formatDashboardNumber } from "@/lib/monthlyCalibrationDashboard"
import type { NormalizedMonthlyCalibrationDatum } from "@/types/dashboard"

interface MonthlyStatusGroupedChartProps {
  data: NormalizedMonthlyCalibrationDatum[]
}

export function MonthlyStatusGroupedChart({ data }: MonthlyStatusGroupedChartProps) {
  const formatTooltipValue = (value: number | string | undefined, name: string | undefined) => {
    return [formatDashboardNumber(Number(value ?? 0)), name ?? "Value"] as [string, string]
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Monthly Status Grouped Bar Chart</CardTitle>
        <CardDescription>
          Compare the planned load with actual completion, pending workload, and overdue risk month by month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="shortMonthLabel" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: "#dbe4f0" }}
                formatter={formatTooltipValue}
              />
              <Legend />
              <Bar dataKey="planned" name="Planned" fill={CALIBRATION_CHART_COLORS.planned} radius={[6, 6, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill={CALIBRATION_CHART_COLORS.completed} radius={[6, 6, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill={CALIBRATION_CHART_COLORS.pending} radius={[6, 6, 0, 0]} />
              <Bar dataKey="overdue" name="Overdue" fill={CALIBRATION_CHART_COLORS.overdue} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
