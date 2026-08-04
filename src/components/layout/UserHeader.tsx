import companyLogo from "@/assets/1.png";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const UserHeader = () => {
  const { totalItems } = useCart();
  const { settings } = useSiteSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm border-b border-gray-100 transition-all duration-500 ease-in-out hover:shadow-md animate-fade-in">
      <div className="container flex h-16 md:h-20 items-center justify-between gap-4 py-2 md:py-0">
        <Link to="/" className="flex items-center shrink-0">
          <img src={companyLogo} alt="Logo" className="h-10 md:h-12 object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-gray-600">
          <Link to="/" className="relative text-gray-700 hover:text-red-600 transition-colors duration-300 group overflow-visible pb-1">
            Home
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 origin-left transform scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 rounded-full"></span>
          </Link>
          <Link to="/catalog" className="relative text-gray-700 hover:text-red-600 transition-colors duration-300 group overflow-visible pb-1">
            Shop
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 origin-left transform scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 rounded-full"></span>
          </Link>
          <Link to="/safety-tips" className="relative text-gray-700 hover:text-red-600 transition-colors duration-300 group overflow-visible pb-1">
            Safety Guide
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 origin-left transform scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 rounded-full"></span>
          </Link>
          <Link to="/contact" className="relative text-gray-700 hover:text-red-600 transition-colors duration-300 group overflow-visible pb-1">
            Contact
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 origin-left transform scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 rounded-full"></span>
          </Link>
        </nav>

        <div className="flex items-center gap-4 text-gray-500">
          <Link to="/cart" className="relative p-2 hover:text-primary transition-colors duration-200 group flex items-center justify-center">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
                {totalItems}
              </span>
            )}
          </Link>
          <button className="md:hidden p-2 hover:text-primary transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white p-4 animate-fade-in shadow-md absolute w-full left-0">
          <nav className="flex flex-col gap-4 text-sm font-semibold text-gray-600">
            <Link to="/catalog" onClick={() => setMenuOpen(false)} className="text-red-600">Shop</Link>
            <Link to="/safety-tips" onClick={() => setMenuOpen(false)} className="hover:text-primary">Safety Guide</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)} className="hover:text-primary">Contact</Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default UserHeader;
