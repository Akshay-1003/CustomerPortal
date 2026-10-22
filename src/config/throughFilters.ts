export const THROUGH_FILTERS = [
  {
    key: "veeresha_spm",
    label: "Veeresha SPM",
    organizationId: "6abbc1c8caf928b88a5967b7",
  },
] as const

export type ThroughGroup = "all" | (typeof THROUGH_FILTERS)[number]["key"] | "other"

export function getThroughGroupLabel(group: Exclude<ThroughGroup, "all" | "other">): string {
  return THROUGH_FILTERS.find((filter) => filter.key === group)?.label ?? group
}
