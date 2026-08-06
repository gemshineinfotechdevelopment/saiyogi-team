import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import ComboPacks from "./pages/ComboPacks";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import CartDrawer from "./components/cart/CartDrawer";
import SafetyTips from "./pages/SafetyTips";
import Contact from "./pages/Contact";
import QuickEnquiry from "./pages/QuickEnquiry";
import AboutUs from "./pages/AboutUs";
import ChitScheme from "./pages/ChitScheme";
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCustomers from "./pages/admin/AdminCustomers";
import InventoryManagement from "./pages/admin/inventory/InventoryManagement";
import StockTransfer from "./pages/admin/inventory/StockTransfer";
import TransferHistory from "./pages/admin/inventory/TransferHistory";
import AdminContent from "./pages/admin/AdminContent";

import NotFound from "./pages/NotFound";

import { SettingsProvider } from "@/context/SettingsContext";
import ScrollToTop from "@/components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SiteSettingsProvider>
        <AuthProvider>
          <SettingsProvider>
            <CartProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/combo-packs" element={<ComboPacks />} />
                  <Route path="/chit-scheme" element={<ChitScheme />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/safety-tips" element={<SafetyTips />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/quick-enquiry" element={<QuickEnquiry />} />
                  <Route path="/quick-enquery" element={<Navigate to="/quick-enquiry" replace />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/about-us" element={<AboutUs />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/products"
                    element={
                      <ProtectedRoute>
                        <AdminProducts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/orders"
                    element={
                      <ProtectedRoute>
                        <AdminOrders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/categories"
                    element={
                      <ProtectedRoute>
                        <AdminCategories />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/customers"
                    element={
                      <ProtectedRoute>
                        <AdminCustomers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/content"
                    element={
                      <ProtectedRoute>
                        <AdminContent />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/inventory"
                    element={
                      <ProtectedRoute>
                        <InventoryManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <CartDrawer />
              </BrowserRouter>
            </CartProvider>
          </SettingsProvider>
        </AuthProvider>
      </SiteSettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
