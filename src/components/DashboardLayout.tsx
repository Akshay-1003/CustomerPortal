import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useOrganizationById } from "@/hooks/useOrganizations"
import { authService } from "@/services/auth.service"
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt"
import { RouteTransitionIndicator } from "@/components/RouteTransitionIndicator"
import { Skeleton } from "@/components/ui/skeleton"
import { CustomerNotificationBell } from "@/components/notifications/CustomerNotificationBell"
import { useAuth } from "@/hooks/useAuth"
import { canViewCustomerModule } from "@/lib/permissions"


export function DashboardLayout() {
  const organizationId = authService.getOrganizationId()
  const { data: organization, isLoading: isOrganizationLoading } = useOrganizationById(organizationId as string)
  const { user } = useAuth()
  const canViewNotifications = canViewCustomerModule(user?.user, "customer_notifications", user?.roles)

  return (
    <SidebarProvider className="w-full max-w-full overflow-x-hidden">
      <RouteTransitionIndicator />
      <AppSidebar />
      <SidebarInset className="min-w-0 max-w-full overflow-x-hidden">
        <header className="flex h-auto w-full max-w-full sm:h-16 shrink-0 items-center gap-2 border-b px-2 sm:px-4 py-2 sm:py-0 bg-stone-50 sticky top-0 z-50 overflow-x-hidden">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />

          {/* Organization Info */} 
          <div className="flex min-w-0 items-center gap-2">
            {isOrganizationLoading ? (
              <Skeleton className="h-10 w-56 rounded-full" />
            ) : (
              <Badge variant="primary" className="text-xl max-w-full truncate">
                {organization?.name || "Organization"}
              </Badge>
            )}
           
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {canViewNotifications ? <CustomerNotificationBell /> : null}
            <PwaInstallPrompt />
          </div>
        </header>
        <div className="flex flex-1 w-full min-w-0 max-w-full flex-col gap-4 overflow-x-hidden p-3 sm:p-4 md:p-6">
          <div className="w-full max-w-full min-w-0">
            <Outlet />
          </div>
        </div>
        
      </SidebarInset>
    </SidebarProvider>
  )
}
