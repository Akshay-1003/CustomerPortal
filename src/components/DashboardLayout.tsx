import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useOrganizationById } from "@/hooks/useOrganizations"
import { authService } from "@/services/auth.service"


export function DashboardLayout() {
  const organizationId = authService.getOrganizationId()
  const { data: organization } = useOrganizationById(organizationId as string)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-auto sm:h-16 shrink-0 items-center gap-2 border-b px-2 sm:px-4 py-2 sm:py-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />

          {/* Organization Info */} 
          <div className="flex items-center gap-2">

            <Badge variant="primary" className="text-xl">
              {organization?.name || 'Loading...'}

            </Badge>
           
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-3 sm:p-4 md:p-6 w-full min-w-0">
          <div className="w-full max-w-full min-w-0">
            <Outlet />
          </div>
        </div>
        
      </SidebarInset>
    </SidebarProvider>
  )
}

