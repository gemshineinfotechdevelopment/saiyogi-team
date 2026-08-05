import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function MainLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Wait for auth check
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <Outlet />
      </div>
    </SidebarProvider>
  );
}
