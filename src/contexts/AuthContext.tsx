import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authService } from '@/services/auth.service'
import type { LoginRequest, User } from '@/types/api'

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

/* ----------------------------- */
/* Provider                      */
/* ----------------------------- */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ✅ Restore session from token
  useEffect(() => {
    const auth = authService.getAuthContext()

    if (auth) {
      setUser({
        id: auth.id,
        organization_id: auth.organization_id,
        roles: auth.roles,
        user: auth.user,
      })
    }

    setIsLoading(false)
  }, [])

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
    window.location.href = '/login'
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

/* ----------------------------- */
/* Hook                          */
/* ----------------------------- */

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
