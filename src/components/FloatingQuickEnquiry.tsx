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
      className="fixed bottom-20 right-2 sm:bottom-24 sm:right-6 z-40 group cursor-pointer select-none outline-none focus:outline-none focus:ring-0 border-0 bg-transparent shadow-none"
      title="Quick Enquiry"
    >
      <div className="relative flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 outline-none border-0 bg-transparent shadow-none drop-shadow-lg group-hover:drop-shadow-2xl">
        <img
          src="/quick-enquiry-btn.png"
          alt="Quick Enquiry"
          className="w-32 xs:w-36 sm:w-44 md:w-48 max-w-[65vw] h-auto transition-all duration-300 filter group-hover:brightness-105 outline-none border-0 ring-0 shadow-none bg-transparent object-contain"
        />
      </div>
    </Link>
  );
};

export default FloatingQuickEnquiry;
