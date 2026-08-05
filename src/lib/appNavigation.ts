function canUseBrowserNavigation() {
  if (typeof window === "undefined") {
    return false
  }

  return window.location.protocol === "http:" || window.location.protocol === "https:"
}

export function redirectToAppPath(path: string) {
  if (!canUseBrowserNavigation()) {
    console.warn(`Skipping redirect to ${path} because the current browser context is not a normal app page.`)
    return
  }

  const target = new URL(path, window.location.origin)
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const next = `${target.pathname}${target.search}${target.hash}`

  if (current === next) {
    return
  }

  window.location.replace(target.toString())
}
