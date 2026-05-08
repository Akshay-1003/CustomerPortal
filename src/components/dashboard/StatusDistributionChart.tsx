import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CALIBRATION_CHART_COLORS, formatDashboardNumber } from "@/lib/monthlyCalibrationDashboard"
import type { MonthlyCalibrationTotals } from "@/types/dashboard"

interface StatusDistributionChartProps {
  totals: MonthlyCalibrationTotals
}

export function StatusDistributionChart({ totals }: StatusDistributionChartProps) {
  const data = [
    { name: "Completed", value: totals.completed, color: CALIBRATION_CHART_COLORS.completed },
    { name: "Pending", value: totals.pending, color: CALIBRATION_CHART_COLORS.pending },
    { name: "Overdue", value: totals.overdue, color: CALIBRATION_CHART_COLORS.overdue },
  ].filter((item) => item.value > 0)

  const formatTooltipValue = (value: number | string | undefined, name: string | undefined) => {
    return [formatDashboardNumber(Number(value ?? 0)), name ?? "Value"] as [string, string]
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
        <CardDescription>
          Aggregate operational mix of completed, pending, and overdue calibrations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={72}
                outerRadius={110}
                paddingAngle={3}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: "#dbe4f0" }}
                formatter={formatTooltipValue}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
