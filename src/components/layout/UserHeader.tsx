import companyLogo from "@/assets/saiyogi-logo-1.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, ChevronDown, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const UserHeader = () => {
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-100 transition-all duration-300 w-full">
        {/* Top Contact Bar */}
        <div className="bg-[#A80000] text-white text-xs py-1.5 hidden md:block">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex gap-4">
              <span>{settings.contact?.email || "Info@SaiYogi.com"}</span>
              <span>|</span>
              <span>Call us: {settings.contact?.phone || "+91 94880 73004"}</span>
            </div>
            <div className="flex items-center gap-1 cursor-pointer">
              Language: English <ChevronDown className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Main Header & Navbar Row */}
        <div className="container mx-auto px-4 py-2.5 md:py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img src={companyLogo} alt="Sai Yogi Crackers" className="h-14 object-contain" />
          </Link>

          {/* Navigation Bar (Desktop) */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-[12px] lg:text-[13px] uppercase tracking-wide">
            <Link to="/" className={getLinkClass('/')}>
              HOME
            </Link>
            <Link to="/catalog" className={getLinkClass('/catalog')}>
              ALL PRODUCTS
            </Link>
            <Link to="/quick-enquiry" className={getLinkClass('/quick-enquiry') + " relative flex items-center gap-1"}>
              QUICK ENQUIRY
              <span className="bg-[#DDAA55] text-white text-[8px] px-1 py-0.5 rounded animate-pulse absolute -right-6 -top-2">NEW</span>
            </Link>
            <Link to="/chit-scheme" className={getLinkClass('/chit-scheme')}>
              CHIT SCHEME
            </Link>
            <Link to="/about-us" className={getLinkClass('/about-us')}>
              ABOUT US
            </Link>
            <Link to="/safety-tips" className={getLinkClass('/safety-tips')}>
              SAFETY TIPS
            </Link>
            <Link to="/contact" className={getLinkClass('/contact')}>
              CONTACT US
            </Link>
          </nav>

          {/* Right Corner Buttons: Login & Cart Logo Button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* User Symbol Button / Phone Badge */}
            <button
              onClick={openLoginModal}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 cursor-pointer ${
                isUserLoggedIn
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
          <div className="relative overflow-hidden bg-[#F4C542] text-[#A80000] py-2 border-y border-[#A80000]/20 select-none z-[110]">
            <div className="animate-top-marquee font-bold text-[10px] md:text-xs uppercase tracking-widest py-1">
              <div className="flex gap-16 whitespace-nowrap">
                <span>✨ Welcome to Sai Yogi Crackers - Sivakasi's Premium Fireworks at Wholesale Price! ✨</span>
                <span>💥 Special Diwali Offer: Up to 50% discount on all Family Packs! 💥</span>
                <span>🚚 Direct delivery from Sivakasi to your doorstep! 🚚</span>
                <span>📞 WhatsApp us now to place your inquiry and custom orders! 📞</span>
              </div>
              <div className="flex gap-16 whitespace-nowrap">
                <span>✨ Welcome to Sai Yogi Crackers - Sivakasi's Premium Fireworks at Wholesale Price! ✨</span>
                <span>💥 Special Diwali Offer: Up to 50% discount on all Family Packs! 💥</span>
                <span>🚚 Direct delivery from Sivakasi to your doorstep! 🚚</span>
                <span>📞 WhatsApp us now to place your inquiry and custom orders! 📞</span>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu Drawer */}
        <div className={`md:hidden fixed inset-0 z-[60] ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
          {/* Backdrop overlay */}
          <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
              menuOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setMenuOpen(false)}
          />
          
          {/* Drawer content */}
          <div 
            className={`absolute top-0 left-0 h-full w-[75vw] max-w-[300px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
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
              <Link to="/chit-scheme" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/chit-scheme')}>CHIT SCHEME</Link>
              <Link to="/about-us" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/about-us')}>ABOUT US</Link>
              <Link to="/safety-tips" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/safety-tips')}>SAFETY TIPS</Link>
              <Link to="/contact" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/contact')}>CONTACT US</Link>
            </nav>
          </div>
        </div>
      </header>
      {/* Responsive layout spacer so fixed header doesn't cover top of page content */}
      <div className={isHomePage ? "w-full shrink-0 h-[92px] md:h-[172px]" : "w-full shrink-0 h-[60px] md:h-[108px]"} />
    </>
  );
};

export default UserHeader;
