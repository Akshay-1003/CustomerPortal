const DEFAULT_API_REQUEST_TIMEOUT_MS = 20_000

function resolveRequestTimeout(value: string | undefined): number {
  const timeout = Number(value)
  return Number.isFinite(timeout) && timeout > 0
    ? timeout
    : DEFAULT_API_REQUEST_TIMEOUT_MS
}

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://35.172.1.180:5000/api/v1',
  apiRequestTimeoutMs: resolveRequestTimeout(import.meta.env.VITE_API_REQUEST_TIMEOUT_MS),
} as const




