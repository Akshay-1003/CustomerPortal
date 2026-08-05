import { createContext, useState, type ReactNode } from 'react'
import { authService } from '@/services/auth.service'
import type { LoginRequest, User } from '@/types/api'
import { redirectToAppPath } from '@/lib/appNavigation'

/* ----------------------------- */
/* Types                         */
/* ----------------------------- */

interface LoginUser {
  id: string
  organization_id: string
  roles: string[]
  user: User
}

interface AuthContextType {
  user: LoginUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  logout: () => void
}

/* ----------------------------- */
/* Context                       */
/* ----------------------------- */

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getInitialUser(): LoginUser | null {
  const auth = authService.getAuthContext()

  if (!auth) {
    return null
  }

  return {
    id: auth.id,
    organization_id: auth.organization_id,
    roles: auth.roles,
    user: auth.user,
  }
}

/* ----------------------------- */
/* Provider                      */
/* ----------------------------- */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginUser | null>(() => getInitialUser())
  const isLoading = false

  /* -------- LOGIN -------- */

  const login = async (data: LoginRequest) => {
    await authService.login(data)
    const auth = authService.getAuthContext();
    // const user.  = authService.getAuthContext().user
    const user = auth?.user as unknown as User
    if (!auth) throw new Error('Auth context not found after login')
    setUser({
      id: auth.id,
      organization_id: auth.organization_id,
      roles: auth.roles,
      user: user,
    })
  }

  /* -------- LOGOUT -------- */

  const logout = () => {
    authService.logout()
    setUser(null)
    redirectToAppPath('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
