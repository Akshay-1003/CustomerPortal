import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { THROUGH_FILTERS, type ThroughGroup } from "@/config/throughFilters"

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
        {THROUGH_FILTERS.map((filter) => (
          <SelectItem key={filter.key} value={filter.key}>{filter.label}</SelectItem>
        ))}
        <SelectItem value="other">Other or no match</SelectItem>
      </SelectContent>
    </Select>
  )
}
