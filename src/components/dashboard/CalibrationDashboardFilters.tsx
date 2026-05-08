import { RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface CalibrationDashboardFiltersProps {
  year: number
  plannedOnly: boolean
  yearOptions: number[]
  isRefreshing: boolean
  onYearChange: (year: number) => void
  onPlannedOnlyChange: (plannedOnly: boolean) => void
  onRefresh: () => void
}

export function CalibrationDashboardFilters({
  year,
  plannedOnly,
  yearOptions,
  isRefreshing,
  onYearChange,
  onPlannedOnlyChange,
  onRefresh,
}: CalibrationDashboardFiltersProps) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-[180px_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label htmlFor="calibration-dashboard-year">Year</Label>
            <Select value={year.toString()} onValueChange={(value) => onYearChange(Number(value))}>
              <SelectTrigger id="calibration-dashboard-year" className="w-full bg-background">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((yearOption) => (
                  <SelectItem key={yearOption} value={yearOption.toString()}>
                    {yearOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="planned-only-toggle" className="text-sm">
                    Planned View
                  </Label>
                  <Badge variant={plannedOnly ? "primary" : "outline"}>
                    {plannedOnly ? "Planned Only" : "Full Status"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {plannedOnly
                    ? "Focus on monthly calibration planning load."
                    : "Compare plan, completion, pending workload, and overdue risk."}
                </p>
              </div>
              <Switch
                id="planned-only-toggle"
                checked={plannedOnly}
                onCheckedChange={onPlannedOnlyChange}
                aria-label="Toggle planned only view"
              />
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </CardContent>
    </Card>
  )
}
