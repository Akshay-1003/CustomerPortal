import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { Building2, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SelectWorkspace() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    isAuthenticated,
    pendingWorkspaceSelection,
    selectWorkspace,
    clearPendingWorkspaceSelection,
  } = useAuth()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (!pendingWorkspaceSelection) {
    return <Navigate to="/login" replace />
  }

  const select = async () => {
    if (!selectedWorkspaceId) return
    setError(null)
    setIsSubmitting(true)
    try {
      await selectWorkspace(selectedWorkspaceId)
      const requestedDestination = (location.state as { destination?: string } | null)?.destination || "/"
      const destination = /^\/(?!\/)/.test(requestedDestination) ? requestedDestination : "/"
      navigate(destination, { replace: true })
    } catch {
      setError("Your sign-in session has expired. Sign in again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/35 p-5 sm:p-8">
      <Card className="w-full max-w-xl rounded-lg">
        <CardHeader className="space-y-2">
          <CardTitle>Select workspace</CardTitle>
          <CardDescription>Choose the organization you want to access for this session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingWorkspaceSelection.organizations.map((organization) => {
              const isSelected = organization.id === selectedWorkspaceId
              return (
                <button
                  key={organization.id}
                  type="button"
                  className={`flex min-h-24 items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-background hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedWorkspaceId(organization.id)}
                >
                  <Building2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">{organization.name}</span>
                    {organization.unit_name ? (
                      <span className="mt-1 block truncate text-sm text-muted-foreground">{organization.unit_name}</span>
                    ) : null}
                  </span>
                </button>
              )
            })}
          </div>

          {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}

          <div className="flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearPendingWorkspaceSelection()
                navigate("/login", { replace: true })
              }}
            >
              Back
            </Button>
            <Button type="button" disabled={!selectedWorkspaceId || isSubmitting} onClick={select}>
              {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
