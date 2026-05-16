function isLocalhostHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
}

export function canUsePwaFeatures() {
  if (typeof window === "undefined") {
    return false
  }

  return window.isSecureContext || isLocalhostHost(window.location.hostname)
}

export async function cleanupPwaOnUnsupportedOrigin() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || canUsePwaFeatures()) {
    return
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
    console.info("PWA features are disabled on insecure public origins. Existing service workers were cleaned up.")
  } catch (error) {
    console.warn("Failed to clean up service workers on an unsupported PWA origin:", error)
  }
}
