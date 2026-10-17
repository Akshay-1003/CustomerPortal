import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ThroughGroup } from "@/hooks/useHemdeepThroughFilter"

export function ThroughGroupFilter({
  value,
  onChange,
}: {
  value: ThroughGroup
  onChange: (value: ThroughGroup) => void
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as ThroughGroup)}>
      <SelectTrigger aria-label="Filter by subdivision through" className="w-full sm:w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="hemdeep">HEMDEEP ENTERPRISES</SelectItem>
        <SelectItem value="other">Other or no match</SelectItem>
      </SelectContent>
    </Select>
  )
}
