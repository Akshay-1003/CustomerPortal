import { useCallback, useEffect, useState } from "react"
import { canUsePwaFeatures } from "@/lib/pwaSupport"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
}

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function usePwaInstallPrompt() {
  const isSupportedOrigin = canUsePwaFeatures()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(() => (
    typeof window !== "undefined" ? isStandaloneMode() : false
  ))

  useEffect(() => {
    if (typeof window === "undefined" || !isSupportedOrigin) {
      return
    }

    const displayModeQuery = window.matchMedia("(display-mode: standalone)")

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent
      promptEvent.preventDefault()
      setDeferredPrompt(promptEvent)
    }

    const handleDisplayModeChange = () => {
      setIsInstalled(isStandaloneMode())
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    displayModeQuery.addEventListener("change", handleDisplayModeChange)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      displayModeQuery.removeEventListener("change", handleDisplayModeChange)
    }
  }, [isSupportedOrigin])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return false
    }

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return choice.outcome === "accepted"
  }, [deferredPrompt])

  return {
    canInstall: isSupportedOrigin && Boolean(deferredPrompt) && !isInstalled,
    isInstalled,
    promptInstall,
  }
}
