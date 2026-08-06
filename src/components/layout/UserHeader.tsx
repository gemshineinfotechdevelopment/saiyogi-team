import companyLogo from "@/assets/saiyogi-logo-1.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, Search, ChevronDown, Phone } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const UserHeader = () => {
  const { totalItems, setIsCartOpen } = useCart();
  const { settings } = useSiteSettings();
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
      return (currentPath === '/catalog' && !currentSearch.includes('category=combo-packs')) || currentPath.startsWith('/product/');
    }
    if (path === '/combo-packs') {
      return currentPath === '/combo-packs' || (currentPath === '/catalog' && currentSearch.includes('category=combo-packs'));
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
  const rawPhone = settings.contact?.phone || "+919488073004";
  const phoneDigits = rawPhone.replace(/\D/g, "");

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-100 transition-all duration-300 w-full">
        {/* Top Bar */}
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

        {/* Main Header */}
        <div className="container mx-auto px-4 py-3 md:py-4 flex flex-wrap items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img src={companyLogo} alt="Sai Yogi Crackers" className="h-12 md:h-16 object-contain" />
          </Link>

          {/* Search Bar (Hidden on small mobile, visible on md and up) */}
          <div className="hidden md:flex flex-1 max-w-xl items-center mx-4 border border-gray-300 rounded-md overflow-hidden bg-white">
            <input
              type="text"
              placeholder="Search products..."
              className="flex-1 px-4 py-2 text-sm outline-none text-gray-700 bg-transparent"
            />
            <button className="bg-[#A80000] text-white px-5 py-2.5 hover:bg-red-800 transition-colors flex items-center justify-center">
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${phoneDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-full hover:bg-[#20ba5a] hover:shadow-lg transition-all duration-300 font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <Phone className="w-4 h-4 animate-pulse" />
              WhatsApp Inquiry
            </a>
          <Button onClick={() => setIsCartOpen(true)} className="bg-[#A80000] hover:bg-red-800 text-white flex items-center gap-2 px-5 py-5 rounded-md">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold text-sm">My Cart</span>
            {totalItems > 0 && (
              <span className="ml-1 bg-white text-[#A80000] text-[10px] h-5 w-5 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Button>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-gray-700" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Marquee Banner between Search Bar and Navbar (Home Page Only) */}
      {location.pathname === "/" && (
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

      {/* Navigation Bar */}
      <div className="hidden md:block border-t border-gray-100">
        <div className="container mx-auto px-4 py-3 flex justify-center">
          <nav className="flex items-center gap-6 lg:gap-8 text-[12px] lg:text-[13px] uppercase tracking-wide">
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
            <Link to="/combo-packs" className={getLinkClass('/combo-packs') + " flex items-center gap-1"}>
              COMBO PACKS <ChevronDown className="h-3 w-3" />
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
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white p-4 shadow-md absolute w-full left-0">
          {/* Mobile Search */}
          <div className="flex flex-1 items-center mb-4 border border-gray-300 rounded-md overflow-hidden bg-white">
            <input
              type="text"
              placeholder="Search products..."
              className="flex-1 px-4 py-2 text-sm outline-none text-gray-700 bg-transparent"
            />
            <button className="bg-[#A80000] text-white px-4 py-2 hover:bg-red-800 transition-colors">
              <Search className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex flex-col gap-4 text-sm uppercase">
            <Link to="/" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/')}>HOME</Link>
            <Link to="/quick-enquiry" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/quick-enquiry') + " flex items-center gap-2"}>QUICK ENQUIRY <span className="bg-[#DDAA55] text-white text-[8px] px-1 py-0.5 rounded">NEW</span></Link>
            <Link to="/safety-tips" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/safety-tips')}>SAFETY TIPS</Link>
            <Link to="/combo-packs" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/combo-packs')}>COMBO PACKS</Link>
            <Link to="/catalog" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/catalog')}>ALL PRODUCTS</Link>
            <Link to="/about-us" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/about-us')}>ABOUT US</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/contact')}>CONTACT US</Link>
          </nav>
        </div>
      )}
      </header>
      {/* Responsive layout spacer so fixed header doesn't cover top of page content */}
      <div className={isHomePage ? "w-full shrink-0 h-[104px] md:h-[172px]" : "w-full shrink-0 h-[68px] md:h-[140px]"} />
    </>
  );
};

export default UserHeader;
