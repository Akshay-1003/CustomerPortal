import { createContext, useEffect, useRef, useState, type ReactNode } from "react"
import { authService, type AuthContext as StoredAuthContext } from "@/services/auth.service"
import type {
  CustomerWorkspaceSelectionResponse,
  LoginRequest,
  User,
} from "@/types/api"

const IDLE_TIMEOUT_MS = 30 * 60 * 1000
const ACCESS_TOKEN_REFRESH_LEEWAY_MS = 2 * 60 * 1000

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
    noteActivity()

    const sessionTimer = window.setInterval(async () => {
      const idleFor = Date.now() - lastActivityAt.current
      if (idleFor >= IDLE_TIMEOUT_MS) {
        await authService.logout()
        setUser(null)
        return
      }

      const token = authService.getAccessTokenExpiry()
      if (token && token - Date.now() <= ACCESS_TOKEN_REFRESH_LEEWAY_MS) {
        try {
          await authService.renewSession()
        } catch {
          setUser(null)
        }
      }
    }, 60_000)

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, noteActivity))
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
