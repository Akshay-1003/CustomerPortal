import {
  ChevronRight, Gauge, List, FileText,
  LogOut,
  User,
  Package, ArrowRight, ArrowLeft, FileBarChart2, Activity, CalendarDays, Cpu,
  type LucideIcon,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useCallback, useMemo } from "react"
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback"
import { canViewCustomerModule, hasCustomerPermission } from "@/lib/permissions"
import type { CustomerPermissionModule, PermissionAction } from "@/types/api"

interface MenuPermission {
  module: CustomerPermissionModule
  action?: PermissionAction
}

interface MenuItem {
  title: string
  icon: LucideIcon
  href?: string
  matchPattern?: string
  disabled?: boolean
  permission?: MenuPermission
  items?: MenuItem[]
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", icon: Activity, href: "/", matchPattern: "^/$|^/analytics(?:/.*)?$", permission: { module: "customer_dashboard" } },
  { title: "Calibration Overview", icon: CalendarDays, href: "/calibration-overview", matchPattern: "^/calibration-overview(?:/.*)?$|^/monthly-planning(?:/.*)?$", permission: { module: "customer_calibration" } },
  { title: "Gauge Life Prediction", icon: Cpu, href: "/gauge-life-prediction", matchPattern: "/gauge-life-prediction.*", permission: { module: "customer_gauge_life_prediction" } },
  {
    title: "Transactions",
    icon: Package,
    permission: { module: "customer_transactions" },
    items: [
      { title: "Sent For Calibration", icon: ArrowRight, href: "/transactions/inward", matchPattern: "/transactions/inward.*", permission: { module: "customer_transactions" } },
      { title: "Received from Calibration", icon: ArrowLeft, href: "/transactions/outward", matchPattern: "/transactions/outward.*", permission: { module: "customer_transactions" } },
    ],
  },
  {
    title: "Gauge Management",
    icon: Gauge,
    permission: { module: "customer_gauge_management" },
    items: [
      { title: "Gauge List", icon: List, href: "/gauge-list", matchPattern: "/gauge-list.*", permission: { module: "customer_gauge_management" } },
      { title: "Format Numbers", icon: FileText, href: "/gauge-management/format-numbers", matchPattern: "/gauge-management/format-numbers.*", permission: { module: "customer_gauge_management", action: "edit" } },
    ],
  },
  {
    title: "Reports",
    icon: FileBarChart2,
    permission: { module: "customer_reports" },
    items: [
      { title: "History Card", icon: FileText, href: "/reports/history-card", matchPattern: "/reports/history-card.*", permission: { module: "customer_reports" } },
      { title: "Calibration Planning", icon: FileText, href: "/reports/calibration-due-report", matchPattern: "/reports/calibration-due-report.*", permission: { module: "customer_reports" } },
    ],
  },
]


export function AppSidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { startNavigation } = useNavigationFeedback()
  const canAccessItem = useCallback(
    (item: MenuItem) => {
      if (!item.permission) return true

      return hasCustomerPermission(
        user?.user,
        item.permission.module,
        item.permission.action ?? "view",
        user?.roles
      )
    },
    [user]
  )
  const visibleMenuItems = useMemo(
    () =>
      menuItems.reduce<MenuItem[]>((accumulator, item) => {
        if (item.items) {
          const visibleChildren = item.items.filter(canAccessItem)
          if (visibleChildren.length > 0 && canAccessItem(item)) {
            accumulator.push({ ...item, items: visibleChildren })
          }
          return accumulator
        }

        if (canAccessItem(item)) {
          accumulator.push(item)
        }

        return accumulator
      }, []),
    [canAccessItem]
  )
  const canViewSettings = canViewCustomerModule(user?.user, "customer_settings", user?.roles)
  const matchesPath = useCallback(
    (path?: string, matchPattern?: string) => {
      if (!path && !matchPattern) return false
      const currentPath = location.pathname

      if (matchPattern) {
        return new RegExp(matchPattern).test(currentPath)
      }

      if (path === "/") {
        return currentPath === "/"
      }

      return currentPath === path || currentPath.startsWith(`${path}/`)
    },
    [location.pathname]
  )

  const isMainMenuActive = (item: MenuItem) => {
    if (item.href) {
      return matchesPath(item.href, item.matchPattern)
    }
    if (item.items) {
      return item.items.some((sub) => matchesPath(sub.href, sub.matchPattern))
    }
    return false
  }

  const handleMenuNavigation = useCallback(
    (path?: string) => {
      if (!path) return
      startNavigation(path)
    },
    [startNavigation]
  )

  return (
    <Sidebar className="border-r bg-background/80 backdrop-blur-xl">
      <SidebarHeader className="p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
         <img src="/images/logo.svg" alt="Logo" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Main Menus
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {visibleMenuItems.map((item) => {
                const isActiveMenu = item.href ? matchesPath(item.href, item.matchPattern) : false

                return item.items ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.items?.some((sub) => matchesPath(sub.href, sub.matchPattern))}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          className={cn(
                            "w-full justify-start rounded-xl px-3 py-2.5 transition-all duration-300",
                            "hover:bg-primary/10",
                            (isMainMenuActive(item) || isActiveMenu) &&
                            "bg-primary text-primary-foreground shadow-md hover:bg-primary"
                          )}
                        >
                          <item.icon className={cn((isMainMenuActive(item) || isActiveMenu) && "text-white")} />
                          <span className="font-medium">{item.title}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub className="mt-1 ml-4 space-y-1 border-l border-primary/30 pl-3">
                          {item.items.map((subItem) => {
                            const isSubActive = matchesPath(subItem.href, subItem.matchPattern)

                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isSubActive}
                                  className={cn(
                                    "rounded-lg px-3 py-2 transition-all duration-300 hover:bg-primary/10 hover:text-primary",
                                    subItem.disabled && "opacity-50 pointer-events-none hover:bg-transparent hover:text-muted-foreground",
                                    isSubActive &&
                                    "bg-primary/10 text-primary border border-primary/30 shadow-sm font-medium"
                                  )}
                                >
                                  <Link
                                    to={subItem.disabled ? "#" : (subItem.href || "#")}
                                    onClick={() => handleMenuNavigation(subItem.disabled ? undefined : subItem.href)}
                                  >
                                    <subItem.icon />
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={matchesPath(item.href, item.matchPattern) || isActiveMenu}
                      className={cn(
                        "rounded-xl px-3 py-2.5 transition-all duration-300 hover:bg-primary/10",
                        matchesPath(item.href, item.matchPattern) &&
                        "bg-primary text-primary-foreground shadow-md hover:bg-primary"
                      )}
                    >
                      <Link to={item.href || "/"} onClick={() => handleMenuNavigation(item.href)}>
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t bg-gradient-to-r from-transparent to-primary/5">
        <div className="pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl p-2 hover:bg-primary/10 transition"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/15 text-primary">
                    {user?.user?.first_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium truncate">{(user?.user?.first_name + " " + user?.user?.last_name) || "User"}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">

              {canViewSettings ? (
                <DropdownMenuItem
                  className=""
                  onClick={() => {
                    startNavigation("/settings")
                    navigate("/settings")
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                onClick={() => {
                  startNavigation("/login")
                  logout()
                  navigate("/login", { replace: true })
                }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
