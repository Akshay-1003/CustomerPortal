import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios"
import { env } from "@/config/env"
import { redirectToAppPath } from "@/lib/appNavigation"

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  skipAuthRefresh?: boolean
}

type AuthBroadcastMessage =
  | { type: "access-token"; token: string }
  | { type: "signed-out" }

const AUTH_STORAGE_KEY = "customerportal.auth-context"

class ApiService {
  private api: AxiosInstance
  private accessToken: string | null = null
  private refreshPromise: Promise<string> | null = null
  private authChannel: BroadcastChannel | null = null
  private sessionExpired = false

  constructor() {
    this.api = axios.create({
      baseURL: env.apiBaseUrl,
      withCredentials: true,
      timeout: env.apiRequestTimeoutMs,
      headers: { "Content-Type": "application/json" },
    })

    if (typeof BroadcastChannel !== "undefined") {
      this.authChannel = new BroadcastChannel("customerportal-auth")
      this.authChannel.onmessage = (event: MessageEvent<AuthBroadcastMessage>) => {
        if (event.data?.type === "access-token") {
          this.setAuthToken(event.data.token, false)
        }
        if (event.data?.type === "signed-out") {
          this.sessionExpired = true
          this.clearLocalAuthState(false)
          window.dispatchEvent(new Event("customerportal:session-expired"))
          redirectToAppPath("/login?reason=session-expired")
        }
      }
    }

    this.api.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as RetryableRequestConfig | undefined
        const status = error.response?.status

        if (
          status !== 401 ||
          !originalRequest ||
          originalRequest._retry ||
          originalRequest.skipAuthRefresh ||
          this.isAuthenticationEndpoint(originalRequest.url)
        ) {
          return Promise.reject(error)
        }

        originalRequest._retry = true
        try {
          const token = await this.refreshAccessToken()
          originalRequest.headers.Authorization = `Bearer ${token}`
          return this.api.request(originalRequest)
        } catch (refreshError) {
          if (this.isTerminalRefreshFailure(refreshError)) {
            this.handleExpiredSession()
          }
          return Promise.reject(refreshError)
        }
      },
    )
  }

  private isAuthenticationEndpoint(url?: string): boolean {
    return Boolean(url && /(?:^|\/)auth\/(?:customer\/login|customer\/select-organization|refresh|logout)/.test(url))
  }

  isTerminalRefreshFailure(error: unknown): boolean {
    const status = (error as AxiosError | undefined)?.response?.status
    return status === 400 || status === 401 || status === 403
  }

  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.api
        .post<{ access_token: string }>("auth/refresh", undefined, {
          skipAuthRefresh: true,
          withCredentials: true,
        } as AxiosRequestConfig)
        .then((response) => {
          if (!response.data.access_token) {
            throw new Error("Session renewal did not return an access token")
          }
          this.setAuthToken(response.data.access_token)
          return response.data.access_token
        })
        .finally(() => {
          this.refreshPromise = null
        })
    }

    return this.refreshPromise
  }

  private handleExpiredSession(): void {
    this.expireSession()
  }

  expireSession(): void {
    if (this.sessionExpired) {
      return
    }

    this.sessionExpired = true
    this.clearLocalAuthState()
    window.dispatchEvent(new Event("customerportal:session-expired"))
    redirectToAppPath("/login?reason=session-expired")
  }

  clearLocalAuthState(notifyOtherTabs = true): void {
    this.accessToken = null
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    if (notifyOtherTabs) {
      this.authChannel?.postMessage({ type: "signed-out" } satisfies AuthBroadcastMessage)
    }
  }

  async restoreSession(): Promise<string> {
    try {
      return await this.refreshAccessToken()
    } catch (error) {
      if (this.isTerminalRefreshFailure(error)) {
        this.clearLocalAuthState(false)
      }
      throw error
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config)
    return response.data
  }

  setAuthToken(token: string, notifyOtherTabs = true): void {
    this.sessionExpired = false
    this.accessToken = token
    if (notifyOtherTabs) {
      this.authChannel?.postMessage({ type: "access-token", token } satisfies AuthBroadcastMessage)
    }
  }

  removeAuthToken(): void {
    this.clearLocalAuthState()
  }

  getAuthToken(): string | null {
    return this.accessToken
  }
}

export const apiService = new ApiService()
