import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useLocation } from "react-router-dom"

interface NavigationFeedbackContextValue {
  isNavigating: boolean
  startNavigation: (nextPath?: string) => void
}

const MIN_NAVIGATION_INDICATOR_MS = 350
const MAX_NAVIGATION_INDICATOR_MS = 5000

export const NavigationFeedbackContext = createContext<NavigationFeedbackContextValue | undefined>(undefined)

function getCurrentPath(pathname: string, search: string, hash: string) {
  return `${pathname}${search}${hash}`
}

export function NavigationFeedbackProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [isNavigating, setIsNavigating] = useState(false)
  const navigationStartedAtRef = useRef<number | null>(null)
  const activePathRef = useRef(getCurrentPath(location.pathname, location.search, location.hash))
  const completeTimerRef = useRef<number | null>(null)
  const failSafeTimerRef = useRef<number | null>(null)

  const clearTimers = useCallback(() => {
    if (completeTimerRef.current !== null) {
      window.clearTimeout(completeTimerRef.current)
      completeTimerRef.current = null
    }

    if (failSafeTimerRef.current !== null) {
      window.clearTimeout(failSafeTimerRef.current)
      failSafeTimerRef.current = null
    }
  }, [])

  const finishNavigation = useCallback(() => {
    const startedAt = navigationStartedAtRef.current
    const elapsed = startedAt ? Date.now() - startedAt : MIN_NAVIGATION_INDICATOR_MS
    const remaining = Math.max(MIN_NAVIGATION_INDICATOR_MS - elapsed, 0)

    clearTimers()

    completeTimerRef.current = window.setTimeout(() => {
      setIsNavigating(false)
      navigationStartedAtRef.current = null
      completeTimerRef.current = null
    }, remaining)
  }, [clearTimers])

  const startNavigation = useCallback(
    (nextPath?: string) => {
      const currentPath = getCurrentPath(location.pathname, location.search, location.hash)

      if (nextPath && nextPath === currentPath) {
        return
      }

      clearTimers()
      navigationStartedAtRef.current = Date.now()
      setIsNavigating(true)

      failSafeTimerRef.current = window.setTimeout(() => {
        setIsNavigating(false)
        navigationStartedAtRef.current = null
        failSafeTimerRef.current = null
      }, MAX_NAVIGATION_INDICATOR_MS)
    },
    [clearTimers, location.hash, location.pathname, location.search]
  )

  useEffect(() => {
    const nextPath = getCurrentPath(location.pathname, location.search, location.hash)

    if (nextPath !== activePathRef.current) {
      activePathRef.current = nextPath
      if (isNavigating) {
        finishNavigation()
      }
    }
  }, [finishNavigation, isNavigating, location.hash, location.pathname, location.search])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const value = useMemo(
    () => ({
      isNavigating,
      startNavigation,
    }),
    [isNavigating, startNavigation]
  )

  return <NavigationFeedbackContext.Provider value={value}>{children}</NavigationFeedbackContext.Provider>
}
