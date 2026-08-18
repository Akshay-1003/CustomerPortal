import { apiService } from './api.service'
import type { LoginRequest, LoginResponse, Organization, User } from '@/types/api'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

type OrganizationListResponse =
  | Organization[]
  | {
      organizations: Organization[]
      total_count?: number
      page?: number
    }

/* ----------------------------- */
/* Token Types                   */
/* ----------------------------- */

export interface DecodedToken {
  sub: string
  org_id: string
  roles: string[]
  jti: string
  exp: number
}

export interface AuthContext {
  id: string
  organization_id: string
  roles: string[]
  user: User
}

/* ----------------------------- */
/* Utils                         */
/* ----------------------------- */

function decodeAccessToken(token: string): DecodedToken {
  return jwtDecode<DecodedToken>(token)
}

/* ----------------------------- */
/* Auth Service                  */
/* ----------------------------- */

export const authService = {
  /* -------- LOGIN -------- */

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>(
      'auth/customer/login',
      {
        email: data.email,
        password: data.password,
        organization_id: data.organization_id || undefined,
      },
      {
        withCredentials: true,
      }
    )

    if (!response.access_token) {
      throw new Error('Access token not received from server')
    }

    // ✅ Save token
    apiService.setAuthToken(response.access_token)

    // ✅ Decode token (industry standard)
    const decoded = decodeAccessToken(response.access_token)
    const user = await apiService.get<User>(`user/${decoded.sub}`,{
      withCredentials: true,
    })

    const authContext: AuthContext = {
      id: decoded.sub,
      organization_id: decoded.org_id,
      roles: decoded.roles,
      user: user,
    }

    // ✅ Persist auth context
    this.setAuthContext(authContext)

    return response
  },

  async getUserById(userId: string): Promise<User> {
    return apiService.get<User>(`user/${userId}`, {
      withCredentials: true,
    })
  },

  setAuthContext(authContext: AuthContext) {
    Cookies.set('auth', JSON.stringify(authContext), { expires: 7 })
    Cookies.set('organization_id', authContext.organization_id, { expires: 7 })
  },

  /* -------- LOGOUT -------- */

  logout() {
    apiService.removeAuthToken()
    Cookies.remove('auth')
    Cookies.remove('organization_id')
  },

  /* -------- AUTH STATE -------- */

  isAuthenticated(): boolean {
    return !!apiService.getAuthToken()
  },

  getAuthContext(): AuthContext | null {
    const data = Cookies.get('auth')
    if (!data || data === 'undefined') return null

    try {
      return JSON.parse(data)
    } catch {
      Cookies.remove('auth')
      return null
    }
  },

  getOrganizationId(): string | null {
    return this.getAuthContext()?.organization_id || null
  },

  getUserId(): string | null {
    return this.getAuthContext()?.id || null
  },

  getUserRoles(): string[] {
    return this.getAuthContext()?.roles || []
  },

  /* -------- ORGANIZATIONS -------- */

  async getOrganizations(): Promise<Organization[]> {
    try {
      let page = 0
      let totalCount = Number.POSITIVE_INFINITY
      const organizations: Organization[] = []
      const seenIds = new Set<string>()

      while (organizations.length < totalCount) {
        const response = await apiService.get<OrganizationListResponse>('/organizations', {
          params: { page },
        })

        if (Array.isArray(response)) {
          return response
        }

        const pageItems = Array.isArray(response?.organizations) ? response.organizations : []

        if (pageItems.length === 0) {
          break
        }

        let addedCount = 0
        pageItems.forEach((organization) => {
          if (organization?.id && !seenIds.has(organization.id)) {
            seenIds.add(organization.id)
            organizations.push(organization)
            addedCount += 1
          }
        })

        totalCount =
          typeof response.total_count === 'number' ? response.total_count : organizations.length

        if (addedCount === 0) {
          break
        }

        page += 1
      }

      return organizations
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
      throw error
    }
  },
  async getOrganizationById(id: string): Promise<Organization> {
    try {
      const response = await apiService.get<
        Organization | { organization: Organization }
      >(`organization/${id}`,{
        withCredentials: true,
      })

      if (response && 'organization' in response) return response.organization

      return response as Organization
    } catch (error) {
      console.error('Failed to fetch organization:', error)
      throw error
    }
  },
}
