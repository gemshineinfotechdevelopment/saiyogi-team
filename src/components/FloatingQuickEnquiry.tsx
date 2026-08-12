import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export const FloatingQuickEnquiry: React.FC = () => {
  const { isCartOpen } = useCart();
  const { isLoginModalOpen } = useAuth();
  const location = useLocation();
  const rawPath = location.pathname || "/";
  const normalizedPath = rawPath.toLowerCase().replace(/\/+$/, "") || "/";

  // Hide floating badge whenever Cart Drawer or Login Modal is open
  if (isCartOpen || isLoginModalOpen) {
    return null;
  }

  // Hide on Quick Enquiry pages or Admin routes
  if (
    normalizedPath.includes("quick-enquir") ||
    normalizedPath.includes("quick-enquer") ||
    normalizedPath.startsWith("/admin")
  ) {
    return null;
  }

  // Show on Home (/), About (/about or /about-us), and Safety Tips (/safety-tips)
  const allowedPaths = ["/", "/about", "/about-us", "/safety-tips"];
  if (!allowedPaths.includes(normalizedPath)) {
    return null;
  }

  return (
    <Link
      to="/quick-enquiry"
      className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-40 group cursor-pointer select-none outline-none focus:outline-none focus:ring-0 border-0 bg-transparent shadow-none"
      title="Quick Enquiry"
    >
      <div className="relative flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 outline-none border-0 bg-transparent shadow-none">
        <img
          src="/quick-enquiry-btn.png"
          alt="Quick Enquiry"
          className="w-40 xs:w-44 sm:w-52 h-auto transition-all duration-300 filter group-hover:brightness-105 outline-none border-0 ring-0 shadow-none bg-transparent"
        />
      </div>
    </Link>
  );
};

export default FloatingQuickEnquiry;
