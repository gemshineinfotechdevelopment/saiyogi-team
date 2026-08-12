import companyLogo from "@/assets/saiyogi-logo-1.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface UserHeaderProps {
  isHidden?: boolean;
}

const UserHeader: React.FC<UserHeaderProps> = ({ isHidden = false }) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { settings } = useSiteSettings();
  const { isUserLoggedIn, userPhone, userName, openLoginModal, logoutUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    if (path === '/') {
      return currentPath === '/';
    }
    if (path === '/about-us') {
      return currentPath === '/about-us' || currentPath === '/about';
    }
    if (path === '/catalog') {
      return currentPath === '/catalog' || currentPath.startsWith('/product/');
    }
    if (path === '/chit-scheme') {
      return currentPath === '/chit-scheme';
    }
    return currentPath === path;
  };

  const getLinkClass = (path: string) => {
    const active = isActive(path);
    return active
      ? "text-[#A80000] border-b-2 border-[#A80000] pb-1 transition-colors font-extrabold"
      : "text-gray-700 hover:text-[#A80000] pb-1 transition-colors font-bold";
  };

  const getMobileLinkClass = (path: string) => {
    const active = isActive(path);
    return active
      ? "text-[#A80000] font-extrabold border-l-4 border-[#A80000] pl-2"
      : "text-gray-700 hover:text-[#A80000] font-bold";
  };

  const isHomePage = location.pathname === "/";

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-100 transition-transform duration-300 w-full ${isHidden ? "-translate-y-full" : "translate-y-0"}`}>
        {/* Top Announcement Bar */}
        <div className="bg-[#A80000] text-[#FEF200] text-xs py-1.5 overflow-hidden relative z-50">
          <div className="flex items-center justify-between container mx-auto px-4">
            <div className="w-full overflow-hidden">
              <div className="animate-marquee whitespace-nowrap flex items-center gap-4 text-[11px] sm:text-xs font-black tracking-wider text-[#FEF200]">
                <span>DIWALI 2026 BOOKING OPENS! | In compliance with the 2018 Supreme Court order, online sale of firecrackers is strictly prohibited. This site only provides price estimates for reference. </span>
                <span className="text-white">✦</span>
                <span>DIWALI 2026 BOOKING OPENS! | In compliance with the 2018 Supreme Court order, online sale of firecrackers is strictly prohibited. This site only provides price estimates for reference. </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header & Navbar Row */}
        <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img src={companyLogo} alt="Sai Yogi Crackers" className="h-14 md:h-16 scale-110 md:scale-125 origin-left object-contain transition-all duration-200" />
          </Link>

          {/* Navigation Bar (Desktop) */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-[15px] font-medium tracking-wide">
            <Link to="/" className={getLinkClass('/')}>
              Home
            </Link>
            <Link to="/catalog" className={getLinkClass('/catalog')}>
              All Products
            </Link>
            <Link to="/quick-enquiry" className={getLinkClass('/quick-enquiry') + " relative flex items-center gap-1"}>
              Quick Enquiry
              <span className="bg-[#DDAA55] text-white text-[8px] px-1 py-0.5 rounded animate-pulse absolute -right-6 -top-2 font-bold uppercase">NEW</span>
            </Link>
            <Link to="/price-list" className={getLinkClass('/price-list')}>
              Price List
            </Link>
            <Link to="/chit-scheme" className={getLinkClass('/chit-scheme')}>
              Chit Scheme
            </Link>
            <Link to="/about-us" className={getLinkClass('/about-us')}>
              About Us
            </Link>
            <Link to="/safety-tips" className={getLinkClass('/safety-tips')}>
              Safety Tips
            </Link>
            <Link to="/contact" className={getLinkClass('/contact')}>
              Contact Us
            </Link>
          </nav>

          {/* Right Corner Buttons: Login & Cart Logo Button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* User Symbol Button / Phone Badge */}
            <button
              onClick={openLoginModal}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 cursor-pointer ${isUserLoggedIn
                ? "bg-red-50 border-[#A80000] text-[#A80000] font-bold"
                : "bg-gray-50 border-gray-200 text-gray-700 hover:text-[#A80000] hover:border-[#A80000]"
                }`}
              title={isUserLoggedIn ? `User Account (${userName && userName !== "Customer" ? userName : (userPhone ? `+91 ${userPhone}` : "")})` : "Login"}
            >
              <User className="h-5 w-5" />
              {isUserLoggedIn && (
                <span className="hidden lg:inline text-xs font-black tracking-tight">
                  {userName && userName !== "Customer" ? userName : (userPhone ? `+91 ${userPhone}` : "Account")}
                </span>
              )}
            </button>

            {/* Cart Logo Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-[#A80000] hover:bg-red-800 text-white rounded-xl transition-all flex items-center justify-center shadow-md hover:scale-105 active:scale-95 cursor-pointer"
              title="View Cart"
            >
              <ShoppingCart className="h-5 w-5 text-white" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#F4C542] text-[#1A1A1A] text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2 text-gray-700" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Marquee Banner between Header and Content (Home Page Only) */}
        {isHomePage && (
          <div className="relative overflow-hidden bg-[#A80000] text-white py-2 border-y border-red-900 select-none z-[110]">
            <div className="animate-top-marquee font-bold text-[10px] md:text-xs uppercase tracking-widest py-1">
              <div className="flex gap-16 whitespace-nowrap">
                <span>{settings?.news || "✨ Welcome to Sai Yogi Crackers - Sivakasi's Premium Fireworks at Wholesale Price! ✨ 💥 Special Diwali Offer: Up to 50% discount on all Family Packs! 💥 🚚 Direct delivery from Sivakasi to your doorstep! 🚚 📞 WhatsApp us now to place your inquiry and custom orders! 📞"}</span>
              </div>
              <div className="flex gap-16 whitespace-nowrap">
                <span>{settings?.news || "✨ Welcome to Sai Yogi Crackers - Sivakasi's Premium Fireworks at Wholesale Price! ✨ 💥 Special Diwali Offer: Up to 50% discount on all Family Packs! 💥 🚚 Direct delivery from Sivakasi to your doorstep! 🚚 📞 WhatsApp us now to place your inquiry and custom orders! 📞"}</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Drawer (Placed outside header so it doesn't get affected by header scroll-hide translate-y) */}
      <div className={`md:hidden fixed inset-0 z-[100] ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        {/* Backdrop overlay */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"
            }`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Drawer content */}
        <div
          className={`absolute top-0 left-0 h-full w-[85vw] max-w-[320px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <img src={companyLogo} alt="Sai Yogi" className="h-14 object-contain" />
            <button onClick={() => setMenuOpen(false)} className="p-2 text-gray-500 hover:text-black hover:bg-gray-200 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-6 p-6 text-sm uppercase font-bold overflow-y-auto">
            <Link to="/" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/')}>HOME</Link>
            <Link to="/catalog" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/catalog')}>ALL PRODUCTS</Link>
            <Link to="/quick-enquiry" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/quick-enquiry') + " flex items-center gap-2"}>
              QUICK ENQUIRY <span className="bg-[#DDAA55] text-white text-[8px] px-1 py-0.5 rounded">NEW</span>
            </Link>
            <Link to="/price-list" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/price-list')}>PRICE LIST</Link>
            <Link to="/chit-scheme" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/chit-scheme')}>CHIT SCHEME</Link>
            <Link to="/about-us" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/about-us')}>ABOUT US</Link>
            <Link to="/safety-tips" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/safety-tips')}>SAFETY TIPS</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/contact')}>CONTACT US</Link>
          </nav>
        </div>
      </div>

      {/* Responsive layout spacer so fixed header doesn't cover top of page content */}
      <div className={isHomePage ? "w-full shrink-0 h-[92px] md:h-[172px]" : "w-full shrink-0 h-[60px] md:h-[108px]"} />
    </>
  );
};

export default UserHeader;
