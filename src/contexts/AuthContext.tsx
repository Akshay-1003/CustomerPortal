import { createContext, useEffect, useRef, useState, type ReactNode } from "react"
import { apiService } from "@/services/api.service"
import { authService, type AuthContext as StoredAuthContext } from "@/services/auth.service"
import type {
  CustomerWorkspaceSelectionResponse,
  LoginRequest,
  User,
} from "@/types/api"

const ACCESS_TOKEN_REFRESH_LEEWAY_MS = 2 * 60 * 1000
const RESUME_REFRESH_DEBOUNCE_MS = 30 * 1000

interface LoginUser {
  id: string
  organization_id: string
  roles: string[]
  user: User
}

interface PendingWorkspaceSelection {
  loginChallenge: string
  expiresAt: number
  organizations: CustomerWorkspaceSelectionResponse["organizations"]
}

interface AuthContextType {
  user: LoginUser | null
  isAuthenticated: boolean
  isLoading: boolean
  pendingWorkspaceSelection: PendingWorkspaceSelection | null
  login: (data: LoginRequest) => Promise<CustomerWorkspaceSelectionResponse | null>
  selectWorkspace: (organizationId: string) => Promise<void>
  clearPendingWorkspaceSelection: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function toLoginUser(context: StoredAuthContext): LoginUser {
  return {
    id: context.id,
    organization_id: context.organization_id,
    roles: context.roles,
    user: context.user,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingWorkspaceSelection, setPendingWorkspaceSelection] =
    useState<PendingWorkspaceSelection | null>(null)
  const lastActivityAt = useRef(0)
  const lastTokenRefreshAt = useRef(0)
  const lastResumeRefreshAt = useRef(0)
  const sessionCheckInFlight = useRef(false)

  useEffect(() => {
    let mounted = true

    authService
      .restoreSession()
      .then((context) => {
        if (mounted) setUser(toLoginUser(context))
      })
      .catch(() => {
        if (mounted) setUser(null)
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const expireSession = () => {
      setUser(null)
      setPendingWorkspaceSelection(null)
    }
    window.addEventListener("customerportal:session-expired", expireSession)
    return () => window.removeEventListener("customerportal:session-expired", expireSession)
  }, [])

  useEffect(() => {
    if (!user) return

    let disposed = false

    const noteActivity = () => {
      lastActivityAt.current = Date.now()
    }
    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
    ]
    activityEvents.forEach((event) => window.addEventListener(event, noteActivity, { passive: true }))
    lastActivityAt.current = Date.now()
    lastTokenRefreshAt.current = Date.now()

    const refreshSession = async (force = false) => {
      if (disposed || sessionCheckInFlight.current) return

      const expiresAt = authService.getAccessTokenExpiry()
      const isExpiringSoon = !expiresAt || expiresAt - Date.now() <= ACCESS_TOKEN_REFRESH_LEEWAY_MS
      const hasRecentUserActivity = lastActivityAt.current > lastTokenRefreshAt.current
      if (!force && (!isExpiringSoon || !hasRecentUserActivity)) return

      sessionCheckInFlight.current = true
      try {
        await authService.renewSession()
        lastTokenRefreshAt.current = Date.now()
      } catch (error) {
        if (apiService.isTerminalRefreshFailure(error)) {
          apiService.expireSession()
        }
      } finally {
        sessionCheckInFlight.current = false
      }
    }

    const refreshAfterResume = () => {
      if (document.visibilityState === "hidden") return

      const now = Date.now()
      if (now - lastResumeRefreshAt.current < RESUME_REFRESH_DEBOUNCE_MS) return

      lastResumeRefreshAt.current = now
      noteActivity()
      void refreshSession(true)
    }

    const refreshAfterReconnect = () => {
      if (document.visibilityState !== "hidden") {
        void refreshSession()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshAfterResume()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", refreshAfterResume)
    window.addEventListener("pageshow", refreshAfterResume)
    window.addEventListener("online", refreshAfterReconnect)

    const sessionTimer = window.setInterval(() => {
      if (document.visibilityState !== "hidden") {
        void refreshSession()
      }
    }, 60_000)

    return () => {
      disposed = true
      activityEvents.forEach((event) => window.removeEventListener(event, noteActivity))
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", refreshAfterResume)
      window.removeEventListener("pageshow", refreshAfterResume)
      window.removeEventListener("online", refreshAfterReconnect)
      window.clearInterval(sessionTimer)
    }
  }, [user])

  const login = async (data: LoginRequest) => {
    const result = await authService.login(data)
    if ("requires_organization_selection" in result && result.requires_organization_selection) {
      const selection = {
        loginChallenge: result.login_challenge,
        expiresAt: Date.now() + result.expires_in * 1000,
        organizations: result.organizations,
      }
      setPendingWorkspaceSelection(selection)
      return result
    }

    const context = authService.getAuthContext()
    if (!context) throw new Error("Unable to establish the customer session")
    setUser(toLoginUser(context))
    return null
  }

  const selectWorkspace = async (organizationId: string) => {
    if (!pendingWorkspaceSelection || pendingWorkspaceSelection.expiresAt <= Date.now()) {
      setPendingWorkspaceSelection(null)
      throw new Error("Your sign-in session has expired. Sign in again.")
    }

    await authService.selectOrganization(
      pendingWorkspaceSelection.loginChallenge,
      organizationId,
    )
    const context = authService.getAuthContext()
    if (!context) throw new Error("Unable to establish the customer session")
    setUser(toLoginUser(context))
    setPendingWorkspaceSelection(null)
  }

  const logout = async () => {
    setPendingWorkspaceSelection(null)
    setUser(null)
    try {
      await authService.logout()
    } catch {
      // Local sign-out is still complete when the network is unavailable.
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        pendingWorkspaceSelection,
        login,
        selectWorkspace,
        clearPendingWorkspaceSelection: () => setPendingWorkspaceSelection(null),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
