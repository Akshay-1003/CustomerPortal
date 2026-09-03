import { apiService } from "./api.service"
import type {
  CustomerLoginResponse,
  CustomerWorkspaceSelectionResponse,
  LoginRequest,
  LoginResponse,
  Organization,
  User,
} from "@/types/api"
import { jwtDecode } from "jwt-decode"

const AUTH_CONTEXT_KEY = "customerportal.auth-context"

export interface DecodedToken {
  sub: string
  organization_id: string
  org_id?: string
  role?: string
  roles: string[]
  permissions?: string[]
  jti: string
  exp: number
}

export interface AuthContext {
  id: string
  organization_id: string
  roles: string[]
  user: User
}

function decodeAccessToken(token: string): DecodedToken {
  return jwtDecode<DecodedToken>(token)
}

function isWorkspaceSelectionRequired(
  response: CustomerLoginResponse,
): response is CustomerWorkspaceSelectionResponse {
  return "requires_organization_selection" in response && response.requires_organization_selection
}

export const authService = {
  async login(data: LoginRequest): Promise<CustomerLoginResponse> {
    const response = await apiService.post<CustomerLoginResponse>(
      "auth/customer/login",
      data,
      { withCredentials: true },
    )

    if (isWorkspaceSelectionRequired(response)) {
      return response
    }

    await this.establishSession(response)
    return response
  },

  async selectOrganization(
    loginChallenge: string,
    organizationId: string,
  ): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>(
      "auth/customer/select-organization",
      { login_challenge: loginChallenge, organization_id: organizationId },
      { withCredentials: true },
    )
    await this.establishSession(response)
    return response
  },

  async restoreSession(): Promise<AuthContext> {
    const token = await apiService.restoreSession()
    return this.establishSession({ access_token: token, token_type: "bearer" })
  },

  async renewSession(): Promise<void> {
    await apiService.restoreSession()
  },

  async establishSession(response: LoginResponse): Promise<AuthContext> {
    if (!response.access_token) {
      throw new Error("Session was created without an access token")
    }

    apiService.setAuthToken(response.access_token)
    const decoded = decodeAccessToken(response.access_token)
    const user = await this.getCurrentUser()
    const context: AuthContext = {
      id: decoded.sub,
      organization_id: decoded.organization_id || decoded.org_id || "",
      roles: decoded.roles || (decoded.role ? [decoded.role] : []),
      user,
    }
    this.setAuthContext(context)
    return context
  },

  async getCurrentUser(): Promise<User> {
    return apiService.get<User>("auth/me", { withCredentials: true })
  },

  setAuthContext(authContext: AuthContext): void {
    sessionStorage.setItem(AUTH_CONTEXT_KEY, JSON.stringify(authContext))
  },

  async logout(): Promise<void> {
    try {
      await apiService.post("auth/logout", undefined, {
        withCredentials: true,
        skipAuthRefresh: true,
      } as never)
    } finally {
      apiService.clearLocalAuthState()
    }
  },

  isAuthenticated(): boolean {
    return Boolean(apiService.getAuthToken())
  },

  getAuthContext(): AuthContext | null {
    const data = sessionStorage.getItem(AUTH_CONTEXT_KEY)
    if (!data) return null

    try {
      return JSON.parse(data) as AuthContext
    } catch {
      sessionStorage.removeItem(AUTH_CONTEXT_KEY)
      return null
    }
  },

  getOrganizationId(): string | null {
    const token = apiService.getAuthToken()
    if (token) {
      try {
        const decoded = decodeAccessToken(token)
        return decoded.organization_id || decoded.org_id || null
      } catch {
        return null
      }
    }
    return this.getAuthContext()?.organization_id || null
  },

  getUserId(): string | null {
    return this.getAuthContext()?.id || null
  },

  getUserRoles(): string[] {
    return this.getAuthContext()?.roles || []
  },

  getAccessTokenExpiry(): number | null {
    const token = apiService.getAuthToken()
    if (!token) return null
    try {
      return decodeAccessToken(token).exp * 1000
    } catch {
      return null
    }
  },

  async getOrganizationById(id: string): Promise<Organization> {
    const response = await apiService.get<Organization | { organization: Organization }>(
      `organization/${id}`,
      { withCredentials: true },
    )
    return response && "organization" in response ? response.organization : response as Organization
  },
}
