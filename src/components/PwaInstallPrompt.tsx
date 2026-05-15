import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePwaInstallPrompt } from "@/hooks/usePwaInstallPrompt"

export function PwaInstallPrompt() {
  const { canInstall, promptInstall } = usePwaInstallPrompt()
  const [isPrompting, setIsPrompting] = useState(false)

  if (!canInstall) {
    return null
  }

  const handleInstall = async () => {
    try {
      setIsPrompting(true)
      await promptInstall()
    } finally {
      setIsPrompting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0"
      onClick={handleInstall}
      disabled={isPrompting}
    >
      <Download className="h-4 w-4" />
      {isPrompting ? "Opening..." : "Install App"}
    </Button>
  )
}
