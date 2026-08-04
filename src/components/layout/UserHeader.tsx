import companyLogo from "@/assets/saiyogi-logo-1.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, Search, ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const UserHeader = () => {
  const { totalItems } = useCart();
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
      ? "text-[#7A1416] border-b-2 border-[#7A1416] pb-1 transition-colors font-extrabold"
      : "text-gray-700 hover:text-[#7A1416] pb-1 transition-colors font-bold";
  };

  const getMobileLinkClass = (path: string) => {
    const active = isActive(path);
    return active
      ? "text-[#7A1416] font-extrabold border-l-4 border-[#7A1416] pl-2"
      : "text-gray-700 hover:text-[#7A1416] font-bold";
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100 transition-all duration-500 ease-in-out hover:shadow-md animate-fade-in w-full">
      {/* Top Bar */}
      <div className="bg-[#7A1416] text-white text-xs py-1.5 hidden md:block">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex gap-4">
            <span>Info@SaiYogi.com</span>
            <span>|</span>
            <span>Call us: +91 94880 73004</span>
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
          <button className="bg-[#7A1416] text-white px-5 py-2.5 hover:bg-red-800 transition-colors flex items-center justify-center">
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/919488073004"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 border-2 border-[#25D366] text-[#25D366] bg-white px-4 py-1.5 rounded-md hover:bg-[#25D366] hover:text-white transition-colors font-semibold text-sm"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
            WhatsApp
          </a>
          <Link to="/cart">
            <Button className="bg-[#7A1416] hover:bg-red-800 text-white flex items-center gap-2 px-5 py-5 rounded-md">
              <ShoppingCart className="h-5 w-5" />
              <span className="font-semibold text-sm">My Cart</span>
              {totalItems > 0 && (
                <span className="ml-1 bg-white text-[#7A1416] text-[10px] h-5 w-5 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-gray-700" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="hidden md:block border-t border-gray-100">
        <div className="container mx-auto px-4 py-3 flex justify-center">
          <nav className="flex items-center gap-6 lg:gap-8 text-[12px] lg:text-[13px] uppercase tracking-wide">
            <Link to="/" className={getLinkClass('/')}>
              HOME
            </Link>
            <Link to="/quick-enquiry" className={`relative ${getLinkClass('/quick-enquiry')} flex items-center gap-1`}>
              QUICK ENQUIRY
              <span className="bg-[#DDAA55] text-white text-[8px] px-1 py-0.5 rounded animate-pulse absolute -right-6 -top-2">NEW</span>
            </Link>
            <Link to="/safety-tips" className={getLinkClass('/safety-tips')}>
              SAFETY TIPS
            </Link>
            <Link to="/combo-packs" className={`${getLinkClass('/combo-packs')} flex items-center gap-1`}>
              COMBO PACKS <ChevronDown className="h-3 w-3" />
            </Link>
            <Link to="/chit-scheme" className={getLinkClass('/chit-scheme')}>
              CHIT SCHEME
            </Link>
            <Link to="/catalog" className={getLinkClass('/catalog')}>
              ALL PRODUCTS
            </Link>
            <Link to="/about-us" className={getLinkClass('/about-us')}>
              ABOUT US
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
            <button className="bg-[#7A1416] text-white px-4 py-2 hover:bg-red-800 transition-colors">
              <Search className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex flex-col gap-4 text-sm uppercase">
            <Link to="/" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/')}>HOME</Link>
            <Link to="/quick-enquiry" onClick={() => setMenuOpen(false)} className={`${getMobileLinkClass('/quick-enquiry')} flex items-center gap-2`}>QUICK ENQUIRY <span className="bg-[#DDAA55] text-white text-[8px] px-1 py-0.5 rounded">NEW</span></Link>
            <Link to="/safety-tips" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/safety-tips')}>SAFETY TIPS</Link>
            <Link to="/combo-packs" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/combo-packs')}>COMBO PACKS</Link>
            <Link to="/chit-scheme" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/chit-scheme')}>CHIT SCHEME</Link>
            <Link to="/catalog" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/catalog')}>ALL PRODUCTS</Link>
            <Link to="/about-us" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/about-us')}>ABOUT US</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)} className={getMobileLinkClass('/contact')}>CONTACT US</Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default UserHeader;
