import { useCallback, useEffect, useState } from "react"
import { authService } from "@/services/auth.service"

export const HEMDEEP_CUSTOMER_ID = "6abbc1c8caf928b88a5967b7"
export type ThroughGroup = "all" | "hemdeep" | "other"

const STORAGE_KEY = "customerportal.hemdeep-through-group"
const CHANGE_EVENT = "customerportal:hemdeep-through-group-change"

function readStoredGroup(): ThroughGroup {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === "hemdeep" || stored === "other" ? stored : "all"
}

export function useHemdeepThroughFilter() {
  const organizationId = authService.getOrganizationId()
  const enabled = organizationId?.toLowerCase() === HEMDEEP_CUSTOMER_ID
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
