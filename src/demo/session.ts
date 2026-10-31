const SESSION_KEY = "customerportal.demo-session"
export const DEMO_DATA_KEY = "customerportal.demo-data.v1"

export function isDemoSession() {
  return sessionStorage.getItem(SESSION_KEY) === "active"
}

export function startDemoSession() {
  sessionStorage.setItem(SESSION_KEY, "active")
  sessionStorage.removeItem(DEMO_DATA_KEY)
  // Reload also discards real-session query caches and in-memory access tokens.
  window.location.assign("/")
}

export function endDemoSession() {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(DEMO_DATA_KEY)
  sessionStorage.removeItem("customerportal.auth-context")
  window.location.assign("/login")
}
