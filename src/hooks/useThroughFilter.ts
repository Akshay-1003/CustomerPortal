import { useCallback, useEffect, useState } from "react"
import { authService } from "@/services/auth.service"
import { THROUGH_FILTERS, type ThroughGroup } from "@/config/throughFilters"

const STORAGE_KEY = "customerportal.through-filter-group"
const CHANGE_EVENT = "customerportal:through-filter-group-change"

function isThroughGroup(value: string | null): value is ThroughGroup {
  return value === "all"
    || value === "other"
    || THROUGH_FILTERS.some((filter) => filter.key === value)
}

function normalizeStoredGroup(value: string | null): ThroughGroup {
  return isThroughGroup(value) ? value : "all"
}

function readStoredGroup(): ThroughGroup {
  return normalizeStoredGroup(window.localStorage.getItem(STORAGE_KEY))
}

export function useThroughFilter() {
  const organizationId = authService.getOrganizationId()?.toLowerCase()
  const enabled = THROUGH_FILTERS.some((filter) => filter.organizationId === organizationId)
  const [group, setGroupState] = useState<ThroughGroup>(() => readStoredGroup())

  useEffect(() => {
    const sync = () => setGroupState(readStoredGroup())
    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const setGroup = useCallback((value: ThroughGroup) => {
    window.localStorage.setItem(STORAGE_KEY, value)
    setGroupState(value)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return {
    enabled,
    group: enabled ? group : "all",
    apiGroup: enabled && group !== "all" ? group : undefined,
    setGroup,
  }
}
