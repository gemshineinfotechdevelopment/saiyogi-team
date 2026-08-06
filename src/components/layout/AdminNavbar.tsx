import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Brands", href: "/admin/brands" },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Content", href: "/admin/content" },
  { label: "Retail Bill", href: "/admin/billing/retail" },
  { label: "Wholesale Bill", href: "/admin/billing/wholesale" },
  { label: "Net Rate Bill", href: "/admin/billing/netrate" },
  { label: "Transport Bill", href: "/admin/billing/transport" },
  { label: "Invoice", href: "/admin/billing/invoice" },
  { label: "Reports", href: "/admin/billing/reports" },
];

const AdminNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <nav className="lg:hidden sticky top-0 z-50 border-b border-border bg-sidebar">
      <div className="flex items-center justify-between p-4">
        <Link to="/admin" className="flex items-center gap-2">
          <span className="text-xl">🎆</span>
          <span className="font-display font-bold text-sidebar-primary hidden sm:inline">Admin Panel</span>
          <span className="font-display font-bold text-sidebar-primary sm:hidden">Admin</span>
        </Link>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-white hover:bg-sidebar-accent hover:text-white rounded-lg transition-colors"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-sidebar p-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            ← Back to Store
          </Link>

          <Button
            onClick={() => {
              handleLogout();
              setMenuOpen(false);
            }}
            variant="default"
            className="w-full mt-4 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white border-none"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;
