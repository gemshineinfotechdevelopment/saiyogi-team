import React from "react";
import { Link, useLocation } from "react-router-dom";

export const FloatingQuickEnquiry: React.FC = () => {
  const location = useLocation();
  const rawPath = location.pathname || "/";
  const normalizedPath = rawPath.toLowerCase().replace(/\/+$/, "") || "/";

  // Show on Home (/), About (/about or /about-us), and Safety Tips (/safety-tips)
  const allowedPaths = ["/", "/about", "/about-us", "/safety-tips"];
  if (!allowedPaths.includes(normalizedPath)) {
    return null;
  }

  return (
    <Link
      to="/quick-enquiry"
      className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[999] group cursor-pointer select-none"
      title="Quick Enquiry"
    >
      <div className="relative flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95">
        <img
          src="/quick-enquiry-btn.png"
          alt="Quick Enquiry"
          className="w-24 sm:w-48 h-auto drop-shadow-[0_10px_25px_rgba(220,38,38,0.4)] transition-all duration-300 filter group-hover:brightness-105"
        />
      </div>
    </Link>
  );
};

export default FloatingQuickEnquiry;
