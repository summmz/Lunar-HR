import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { handleGoogleLoginClick } from "@/lib/google-oauth";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
  DollarSign,
  Settings,
  MessageSquare,
  CalendarDays,
  Clock,
  Building2,
  Bell,
} from "lucide-react";
import { CSSProperties } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: Users, label: "Employees", path: "/admin/employees" },
  { icon: Building2, label: "Departments", path: "/admin/departments" },
  { icon: DollarSign, label: "Payroll", path: "/admin/payroll" },
  { icon: CalendarDays, label: "Leave", path: "/admin/leave" },
  { icon: Clock, label: "Attendance", path: "/admin/attendance" },
  { icon: Bell, label: "Notifications", path: "/admin/notifications" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

const userMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/user/dashboard" },
  { icon: DollarSign, label: "Salary", path: "/user/salary" },
  { icon: CalendarDays, label: "Leave", path: "/user/leave" },
  { icon: Clock, label: "Attendance", path: "/user/attendance" },
  { icon: MessageSquare, label: "HR Chat", path: "/user/chat" },
  { icon: Settings, label: "Settings", path: "/user/settings" },
];

// Mobile bottom nav — max 5 items
const adminMobileItems = [
  { icon: LayoutDashboard, label: "Home", path: "/admin/dashboard" },
  { icon: Users, label: "People", path: "/admin/employees" },
  { icon: DollarSign, label: "Payroll", path: "/admin/payroll" },
  { icon: Bell, label: "Alerts", path: "/admin/notifications" },
  { icon: Settings, label: "More", path: "/admin/settings" },
];

const userMobileItems = [
  { icon: LayoutDashboard, label: "Home", path: "/user/dashboard" },
  { icon: DollarSign, label: "Salary", path: "/user/salary" },
  { icon: CalendarDays, label: "Leave", path: "/user/leave" },
  { icon: MessageSquare, label: "Chat", path: "/user/chat" },
  { icon: Settings, label: "Settings", path: "/user/settings" },
];

const DEFAULT_WIDTH = 280;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="flex flex-col items-center gap-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in to continue</h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              Access to this dashboard requires authentication.
            </p>
          </div>
          <Button onClick={() => handleGoogleLoginClick()} size="lg" className="w-full">
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${DEFAULT_WIDTH}px` } as CSSProperties}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const menuItems = user?.role === "admin" ? adminMenuItems : userMenuItems;
  const mobileItems = user?.role === "admin" ? adminMobileItems : userMobileItems;
  const { data: unreadNotifications = [] } = trpc.notification.unread.useQuery();
  const unreadCount = (unreadNotifications as any[]).length;
  const activeMenuItem = menuItems.find((item) => item.path === location);
  const isMobile = useIsMobile();
  const notifPath = user?.role === "admin" ? "/admin/notifications" : "/user/notifications";

  return (
    <div className="flex w-full min-h-svh">
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar collapsible="icon" className="border-r-0">
          <SidebarHeader className="h-16 justify-center">
            <div className={`flex items-center gap-3 px-2 transition-all w-full ${isCollapsed ? "justify-center" : ""}`}>
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <span className="font-semibold tracking-tight truncate">Lunar-HR</span>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 transition-all font-normal"
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                      <span className="flex-1">{item.label}</span>
                      {item.path.endsWith("/notifications") && unreadCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">{user?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">{user?.email || "—"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
      )}

      <SidebarInset className={isMobile ? "w-full" : ""}>
        {/* Mobile top bar */}
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold tracking-tight text-foreground shrink-0">Lunar-HR</span>
              {activeMenuItem && (
                <>
                  <span className="text-muted-foreground/40 shrink-0">/</span>
                  <span className="text-sm text-muted-foreground truncate">{activeMenuItem.label}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Notification bell */}
              <button
                onClick={() => setLocation(notifPath)}
                className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {/* User avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center ml-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="text-xs font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2.5 border-b mb-1">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                  </div>
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className={`flex-1 p-4 overflow-hidden ${isMobile ? "pb-[calc(4rem+env(safe-area-inset-bottom,0px))]" : ""}`}>
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        {isMobile && (
          <nav
            className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            aria-label="Main navigation"
          >
            {mobileItems.map((item) => {
              const isActive = location === item.path;
              const isNotif = item.path.endsWith("/notifications");
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors relative ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Active indicator pill at top */}
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                  )}
                  <div className="relative">
                    <item.icon className="h-5 w-5" />
                    {isNotif && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground px-0.5">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium leading-none">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </SidebarInset>
    </div>
  );
}
