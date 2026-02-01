import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Separator } from "@/components/ui/separator"


export function DashboardLayout() {

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-auto sm:h-16 shrink-0 items-center gap-2 border-b px-2 sm:px-4 py-2 sm:py-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
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

