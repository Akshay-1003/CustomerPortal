import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import {
  getFirstAccessibleCustomerPath,
  hasCustomerPermission,
} from "@/lib/permissions"
import type { CustomerPermissionModule, PermissionAction } from "@/types/api"

interface RequireCustomerPermissionProps {
  module: CustomerPermissionModule
  action?: PermissionAction
  children: ReactNode
}

export function RequireCustomerPermission({
  module,
  action = "view",
  children,
}: RequireCustomerPermissionProps) {
  const { user } = useAuth()
  const hasAccess = hasCustomerPermission(user?.user, module, action, user?.roles)

  if (hasAccess) {
    return <>{children}</>
  }

  const fallbackPath = getFirstAccessibleCustomerPath(user?.user, user?.roles)

  return (
    <Card className="mx-auto mt-10 max-w-lg border-border/70 shadow-sm">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Access restricted</h2>
          <p className="text-sm text-muted-foreground">
            This page is disabled for your account. Please contact the calibration team if you need access.
          </p>
        </div>
        {fallbackPath ? (
          <Button asChild>
            <Link to={fallbackPath}>Go to available page</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
