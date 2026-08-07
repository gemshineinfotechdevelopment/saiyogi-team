import companyLogo from "@/assets/saiyogi-logo-1.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, FolderTree, ShoppingBag, Users, Settings, ArrowLeft, LogOut, Menu, Tag, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Brands", icon: Tag, href: "/admin/brands" },
  { label: "Products", icon: Package, href: "/admin/products" },
  { label: "Categories", icon: FolderTree, href: "/admin/categories" },
  { label: "Orders", icon: ShoppingBag, href: "/admin/orders" },
  { label: "Customers", icon: Users, href: "/admin/customers" },
  { label: "Chit Scheme", icon: Gift, href: "/admin/chit-scheme" },
  { label: "Inventory Management", icon: Package, href: "/admin/inventory" },
  { label: "Content", icon: Settings, href: "/admin/content" },
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return sessionStorage.getItem("adminSidebarCollapsed") === "true";
  });
  
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    sessionStorage.setItem("adminSidebarCollapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("adminSidebarScroll");
    if (savedScroll && navRef.current) {
      navRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    sessionStorage.setItem("adminSidebarScroll", String(e.currentTarget.scrollTop));
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <>
      {/* Fixed Sidebar */}
      <aside className={cn(
        "border-r border-border bg-sidebar h-screen fixed top-0 left-0 hidden lg:flex flex-col transition-all duration-300 z-40",
        isCollapsed ? "w-20" : "w-64"
      )}>
      <div className={cn("p-4 shrink-0 flex flex-col gap-2", !isCollapsed && "p-6")}>
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <Link to="/admin" className="flex items-center gap-2 overflow-hidden">
              <img src={companyLogo} alt="Logo" className="h-8 object-contain shrink-0" />
              <span className="font-display text-lg font-bold text-sidebar-primary whitespace-nowrap">Admin Panel</span>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="shrink-0 h-8 w-8 text-white hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        {!isCollapsed ? (
          <Link to="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1">
            <ArrowLeft className="h-3 w-3 shrink-0" /> Back to Store
          </Link>
        ) : (
          <Link to="/" className="flex items-center justify-center mt-1" title="Back to Store">
            <ArrowLeft className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </Link>
        )}
      </div>
      
      <nav 
        ref={navRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 space-y-1 pb-4 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isCollapsed ? "justify-center" : "gap-3",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      
      <div className={cn("shrink-0 border-t border-border mt-auto", isCollapsed ? "p-3 flex justify-center" : "p-4")}>
        <Button 
          onClick={handleLogout} 
          variant="default" 
          className={cn("flex items-center justify-center bg-red-600 hover:bg-red-700 text-white border-none", isCollapsed ? "w-10 h-10 p-0" : "w-full gap-2")}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
      
      {/* Spacer to push main content to the right so it doesn't get hidden under the fixed sidebar */}
      <div className={cn(
        "shrink-0 hidden lg:block transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )} />
    </>
  );
};

export default AdminSidebar;
