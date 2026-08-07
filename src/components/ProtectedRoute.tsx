import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/10 p-4">
        <Card className="w-full max-w-sm border-border/70 shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Spinner className="size-6 text-primary" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Preparing your workspace</p>
              <p className="text-sm text-muted-foreground">Checking your session and loading the portal.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}



