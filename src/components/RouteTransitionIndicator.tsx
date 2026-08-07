import { Spinner } from "@/components/ui/spinner"
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback"
import { cn } from "@/lib/utils"

export function RouteTransitionIndicator() {
  const { isNavigating } = useNavigationFeedback()

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[120] h-1 overflow-hidden transition-opacity duration-200",
          isNavigating ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="route-progress-bar h-full w-1/3 rounded-full bg-primary" />
      </div>

      <div
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed right-4 top-[4.5rem] z-[110] flex items-center gap-2 rounded-full border border-border/70 bg-background/95 px-3 py-2 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur transition-all duration-200",
          isNavigating ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        )}
      >
        <Spinner className="size-3.5 text-primary" />
        Opening page...
      </div>
    </>
  )
}
