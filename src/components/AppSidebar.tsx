import {
  LayoutDashboard, Package, Warehouse, Users, Truck,
  ClipboardList, BarChart3, FileText, Settings, LogOut, Flame, FileCheck, Receipt, Home, Ruler, FolderTree, Sun, Moon, Shield
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar, SidebarTrigger
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Products", url: "/products", icon: Package },
  { title: "Inventory", url: "/inventory", icon: Warehouse },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Suppliers", url: "/suppliers", icon: Truck },
  { title: "Purchases", url: "/purchases", icon: ClipboardList },
  { title: "UOM", url: "/uom", icon: Ruler },
  { title: "Item Category", url: "/item-category", icon: FolderTree },
];

const estimateNav = [
  { title: "Retail Estimate", url: "/retail-estimate", icon: FileCheck },
  { title: "Wholesale Estimate", url: "/wholesale-estimate", icon: FileCheck },
  { title: "Net-Rate Estimate", url: "/netrate-estimate", icon: FileCheck },
];

const secondaryNav = [
  { title: "Estimates", url: "/estimates", icon: FileCheck },
  { title: "Transport Bill", url: "/transport-bill", icon: Receipt },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";

const adminNav = [
  { title: "Manage Businesses", url: "/admin/businesses", icon: LayoutDashboard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const { isAdmin, logout } = useAuth();

  if (isAdmin) {
    return (
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
        <SidebarContent>
          <div className={`px-4 py-5 flex items-center gap-2 transition-all ${collapsed ? "flex-col py-6" : "flex-row"}`}>
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 neon-glow">
              <Shield className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-bold text-sm text-foreground tracking-tight leading-tight block truncate text-primary">System Admin</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Master Control</span>
              </div>
            )}
          </div>
          
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 font-semibold">
              {!collapsed && "Platform Admin"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200"
                        activeClassName="bg-primary/10 text-primary neon-text border border-primary/15"
                      >
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-auto">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer w-full">
                  {theme === "dark" ? <Sun className="w-[18px] h-[18px] shrink-0" /> : <Moon className="w-[18px] h-[18px] shrink-0" />}
                  {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} className="w-full h-11 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <LogOut className="w-[18px] h-[18px] shrink-0" />
                  {!collapsed && <span>Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent>
        <div className={`px-4 py-5 flex items-center justify-between gap-2 transition-all ${collapsed ? "flex-col py-6" : "flex-row"}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 neon-glow">
              <Flame className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-bold text-sm text-foreground tracking-tight leading-tight block truncate">
                  {settings?.shopName || "MC Crackers"}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Crackers POS</span>
              </div>
            )}
          </div>
          <SidebarTrigger className={`text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ${collapsed ? "mt-4 h-8 w-8" : "h-9 w-9"}`} />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 font-semibold">
            {!collapsed && "Main"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200"
                      activeClassName="bg-primary/10 text-primary neon-text border border-primary/15"
                    >
                      <item.icon className="w-[18px] h-[18px] shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 font-semibold">
            {!collapsed && "Billing / Estimates"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {estimateNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200"
                      activeClassName="bg-primary/10 text-primary neon-text border border-primary/15"
                    >
                      <item.icon className="w-[18px] h-[18px] shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 font-semibold">
            {!collapsed && "Reports & More"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200"
                      activeClassName="bg-primary/10 text-primary neon-text border border-primary/15"
                    >
                      <item.icon className="w-[18px] h-[18px] shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 font-semibold">
            {!collapsed && "Account"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer w-full">
                  {theme === "dark" ? <Sun className="w-[18px] h-[18px] shrink-0" /> : <Moon className="w-[18px] h-[18px] shrink-0" />}
                  {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} className="w-full h-11 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <LogOut className="w-[18px] h-[18px] shrink-0" />
                  {!collapsed && <span>Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}