import { registerSW } from "virtual:pwa-register"
import { canUsePwaFeatures, cleanupPwaOnUnsupportedOrigin } from "@/lib/pwaSupport"

let isRegistered = false

export function registerPwaServiceWorker() {
  if (isRegistered || import.meta.env.DEV || typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return
  }

  if (!canUsePwaFeatures()) {
    void cleanupPwaOnUnsupportedOrigin()
    console.info("Skipping PWA service worker registration on an insecure public origin.")
    return
  }

  isRegistered = true

  registerSW({
    immediate: true,
    onOfflineReady() {
      console.info("PWA offline shell is ready.")
    },
    onNeedRefresh() {
      console.info("A new version of the app is available and will be applied automatically.")
    },
    onRegisterError(error) {
      console.error("PWA service worker registration failed:", error)
    },
  })
}
