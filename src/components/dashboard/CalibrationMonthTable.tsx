import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatDashboardNumber,
  formatDashboardPercentage,
} from "@/lib/monthlyCalibrationDashboard"
import type { NormalizedMonthlyCalibrationDatum } from "@/types/dashboard"

interface CalibrationMonthTableProps {
  plannedOnly: boolean
  data: NormalizedMonthlyCalibrationDatum[]
  onViewDetails: (month: NormalizedMonthlyCalibrationDatum) => void
}

export function CalibrationMonthTable({
  plannedOnly,
  data,
  onViewDetails,
}: CalibrationMonthTableProps) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>{plannedOnly ? "Month Planning Table" : "Month-wise Calibration Status"}</CardTitle>
        <CardDescription>
          {plannedOnly
            ? "Month-level plan coverage with annual contribution share."
            : "Operational month-wise status with completion and overdue ratios."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-border/70">
          <div className="max-h-[460px] overflow-auto">
            <Table className={plannedOnly ? "min-w-[720px]" : "min-w-[1080px]"}>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="sticky top-0 z-10 bg-background/95 backdrop-blur">Month</TableHead>
                  <TableHead className="sticky top-0 z-10 bg-background/95 text-right backdrop-blur">Planned</TableHead>
                  {!plannedOnly && (
                    <>
                      <TableHead className="sticky top-0 z-10 bg-background/95 text-right backdrop-blur">Completed</TableHead>
                      <TableHead className="sticky top-0 z-10 bg-background/95 text-right backdrop-blur">Pending</TableHead>
                      <TableHead className="sticky top-0 z-10 bg-background/95 text-right backdrop-blur">Overdue</TableHead>
                    </>
                  )}
                  <TableHead className="sticky top-0 z-10 bg-background/95 text-right backdrop-blur">
                    {plannedOnly ? "Share of Annual Plan %" : "Completion %"}
                  </TableHead>
                  {!plannedOnly && (
                    <TableHead className="sticky top-0 z-10 bg-background/95 text-right backdrop-blur">
                      Overdue %
                    </TableHead>
                  )}
                  <TableHead className="sticky top-0 z-10 bg-background/95 text-right backdrop-blur">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((month) => (
                  <TableRow key={month.monthLabel} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{month.monthLabel}</TableCell>
                    <TableCell className="text-right">{formatDashboardNumber(month.planned)}</TableCell>
                    {!plannedOnly && (
                      <>
                        <TableCell className="text-right text-emerald-700">
                          {formatDashboardNumber(month.completed)}
                        </TableCell>
                        <TableCell className="text-right text-amber-700">
                          {formatDashboardNumber(month.pending)}
                        </TableCell>
                        <TableCell className="text-right text-red-700">
                          {formatDashboardNumber(month.overdue)}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-right">
                      {formatDashboardPercentage(
                        plannedOnly ? month.shareOfAnnualPlan : month.completionPercentage
                      )}
                    </TableCell>
                    {!plannedOnly && (
                      <TableCell className="text-right text-red-700">
                        {formatDashboardPercentage(month.overduePercentage)}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => onViewDetails(month)}
                      >
                        View Details
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
