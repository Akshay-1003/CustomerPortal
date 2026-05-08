import { CalendarDays, CircleAlert } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDashboardNumber, formatDashboardPercentage } from "@/lib/monthlyCalibrationDashboard"
import type { NormalizedMonthlyCalibrationDatum } from "@/types/dashboard"

interface CalibrationDetailsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: NormalizedMonthlyCalibrationDatum | null
  plannedOnly: boolean
  year: number
}

export function CalibrationDetailsDrawer({
  open,
  onOpenChange,
  month,
  plannedOnly,
  year,
}: CalibrationDetailsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={plannedOnly ? "primary" : "outline"}>
              {plannedOnly ? "Planned View" : "Status View"}
            </Badge>
          </div>
          <SheetTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {month ? `${month.monthLabel} ${year}` : "Month details"}
          </SheetTitle>
          <SheetDescription>
            {plannedOnly
              ? "Date-wise planned gauge details API is pending. This section will show which gauges are planned on each date."
              : "Date-wise gauge details API is pending. This section will show date-wise planned, completed, pending and overdue gauges."}
          </SheetDescription>
        </SheetHeader>

        {month && (
          <div className="mt-6 space-y-4">
            <div className={`grid gap-4 ${plannedOnly ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
              <Card className="border-border/70">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Planned</div>
                  <div className="mt-2 text-2xl font-semibold">{formatDashboardNumber(month.planned)}</div>
                </CardContent>
              </Card>

              {plannedOnly ? (
                <Card className="border-border/70">
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Share of Annual Plan</div>
                    <div className="mt-2 text-2xl font-semibold">
                      {formatDashboardPercentage(month.shareOfAnnualPlan)}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="border-border/70">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Completed</div>
                      <div className="mt-2 text-2xl font-semibold text-emerald-700">
                        {formatDashboardNumber(month.completed)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Pending</div>
                      <div className="mt-2 text-2xl font-semibold text-amber-700">
                        {formatDashboardNumber(month.pending)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Overdue</div>
                      <div className="mt-2 text-2xl font-semibold text-red-700">
                        {formatDashboardNumber(month.overdue)}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {!plannedOnly && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-border/70">
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Completion %</div>
                    <div className="mt-2 text-2xl font-semibold">
                      {formatDashboardPercentage(month.completionPercentage)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/70">
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Overdue %</div>
                    <div className="mt-2 text-2xl font-semibold text-red-700">
                      {formatDashboardPercentage(month.overduePercentage)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Details API placeholder</p>
                  <p className="text-sm text-muted-foreground">
                    The drawer is wired and production-ready for the upcoming date-wise details API. Once that endpoint is available, the list and filters can be dropped into this panel without changing the main dashboard flow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
