import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import quickEnquiryImg from "@/assets/quick-enquiry.png";

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
      className="fixed bottom-36 right-2 sm:bottom-32 sm:right-6 z-40 group cursor-pointer select-none outline-none focus:outline-none focus:ring-0 border-0 bg-transparent shadow-none"
      title="Quick Enquiry"
    >
      <div className="relative flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 outline-none border-0 bg-transparent drop-shadow-md group-hover:drop-shadow-xl">
        <img
          src={quickEnquiryImg}
          alt="Quick Enquiry"
          className="w-32 xs:w-36 sm:w-44 md:w-52 max-w-[55vw] sm:max-w-[35vw] h-auto transition-all duration-300 filter group-hover:brightness-105 object-contain outline-none border-0 ring-0 bg-transparent"
        />
      </div>
    </Link>
  );
};

export default FloatingQuickEnquiry;
