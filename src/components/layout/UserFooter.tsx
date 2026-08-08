import companyLogo from "@/assets/saiyogi-logo-1.png";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Facebook, Twitter, Instagram, Youtube, ShieldCheck, Tag, Truck, CreditCard, HeadphonesIcon } from "lucide-react";

const UserFooter = () => {
  const { settings } = useSiteSettings();

  const socialIcons = {
    facebook: <Facebook className="h-5 w-5" />,
    twitter: <Twitter className="h-5 w-5" />,
    instagram: <Instagram className="h-5 w-5" />,
    youtube: <Youtube className="h-5 w-5" />,
  };

  return (
    <footer className="mt-auto font-body flex flex-col">
      {/* Features Bar */}
      <div className="bg-[#F9F6F0] py-4 md:py-8 border-t border-b border-gray-200">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col md:grid md:grid-cols-5 gap-3 md:gap-6 text-center md:divide-x divide-gray-200">
            {/* Top Row for Mobile: 2 Items */}
            <div className="grid grid-cols-2 gap-2 divide-x divide-gray-200 md:contents">
              <div className="flex flex-col items-center justify-center gap-1.5 px-2">
                <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 text-[#A80000]" />
                <h4 className="font-bold text-xs md:text-sm text-gray-800 leading-tight">Premium Quality</h4>
                <p className="text-[10px] text-gray-500 hidden md:block">100% safe & certified</p>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5 px-2 md:pl-6">
                <Tag className="h-6 w-6 md:h-8 md:w-8 text-[#A80000]" />
                <h4 className="font-bold text-xs md:text-sm text-gray-800 leading-tight">Best Price & Discounts</h4>
                <p className="text-[10px] text-gray-500 hidden md:block">Direct from Sivakasi</p>
              </div>
            </div>

            {/* Subtle Divider for Mobile */}
            <div className="border-t border-gray-200/80 my-0.5 md:hidden"></div>

            {/* Bottom Row for Mobile: 3 Items */}
            <div className="grid grid-cols-3 gap-2 divide-x divide-gray-200 md:contents">
              <div className="flex flex-col items-center justify-center gap-1.5 px-1 md:pl-6">
                <Truck className="h-6 w-6 md:h-8 md:w-8 text-[#A80000]" />
                <h4 className="font-bold text-[11px] md:text-sm text-gray-800 leading-tight">Fast Shipping</h4>
                <p className="text-[10px] text-gray-500 hidden md:block">Pan India delivery</p>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5 px-1 md:pl-6">
                <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-[#A80000]" />
                <h4 className="font-bold text-[11px] md:text-sm text-gray-800 leading-tight">Secure Payments</h4>
                <p className="text-[10px] text-gray-500 hidden md:block">100% secure checkout</p>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5 px-1 md:pl-6">
                <HeadphonesIcon className="h-6 w-6 md:h-8 md:w-8 text-[#A80000]" />
                <h4 className="font-bold text-[11px] md:text-sm text-gray-800 leading-tight">Customer Support</h4>
                <p className="text-[10px] text-gray-500 hidden md:block">24/7 dedicated support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-[#EBEBEB] text-gray-800">
        <div className="container mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About Section */}
          <div>
            <div className="flex flex-col items-start mb-4">
              <img src={companyLogo} alt="Sai Yogi Logo" className="h-24 w-auto object-contain" />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              {settings.siteDescription || "Premium crackers and fireworks store based in Sivakasi. We offer the best quality crackers at wholesale prices for all your celebrations."}
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {(Object.entries(socialIcons) as [string, React.ReactNode][]).map(([platform, icon]) => {
                const url = settings.socialLinks?.[platform as keyof typeof settings.socialLinks];
                if (url) {
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                      className="w-8 h-8 flex items-center justify-center bg-[#A80000] rounded text-white hover:bg-[#9c1b1e] transition-colors duration-200"
                    >
                      {icon}
                    </a>
                  );
                }
                return (
                  <span
                    key={platform}
                    title={`${platform.charAt(0).toUpperCase() + platform.slice(1)} (not set)`}
                    className="w-8 h-8 flex items-center justify-center bg-gray-300 rounded text-gray-500 cursor-default"
                  >
                    {icon}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-black mb-6 text-sm uppercase">Quick Links</h4>
            <nav className="flex flex-col gap-3 text-xs text-gray-600 font-semibold">
              <Link to="/" className="hover:text-[#A80000] transition-colors duration-200">
                Home
              </Link>
              <Link to="/about-us" className="hover:text-[#A80000] transition-colors duration-200">
                About Us
              </Link>
              <Link to="/privacy-policy" className="hover:text-[#A80000] transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-[#A80000] transition-colors duration-200">
                Terms & Conditions
              </Link>
            </nav>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold text-black mb-6 text-sm uppercase">Customer Service</h4>
            <nav className="flex flex-col gap-3 text-xs text-gray-600 font-semibold">
              <Link to="/my-account" className="hover:text-[#A80000] cursor-pointer transition-colors duration-200">
                My Account
              </Link>
              <Link to="/my-account" className="hover:text-[#A80000] cursor-pointer transition-colors duration-200">
                Track Your Order
              </Link>
              <Link to="/contact" className="hover:text-[#A80000] cursor-pointer transition-colors duration-200">
                Returns/Exchange
              </Link>
              <Link to="/contact" className="hover:text-[#A80000] cursor-pointer transition-colors duration-200">
                FAQs
              </Link>
            </nav>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="font-bold text-black mb-6 text-sm uppercase">Contact Us</h4>
            <div className="flex flex-col gap-3 text-xs text-gray-600 font-semibold mb-4">
              <span>{settings.contact?.address || "Sai Yogi Crackers, Sivakasi."}</span>
              <div className="flex flex-col gap-1 mt-2">
                {settings.contact?.phone && (
                  <a href={`tel:${settings.contact.phone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-2 border border-gray-300 bg-white px-3 py-1.5 rounded text-[#A80000] hover:bg-gray-50 transition-colors w-max">
                    📞 {settings.contact.phone}
                  </a>
                )}
                {settings.contact?.email && (
                  <a href={`mailto:${settings.contact.email}`} className="hover:text-[#A80000] transition-colors mt-2">
                    ✉️ {settings.contact.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-[#EBEBEB] border-t border-gray-300 py-4">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest font-semibold gap-2">
            <div>
              © 2026 {settings.siteName || "Sai Yogi Crackers"}. All rights reserved.
            </div>
            <div className="flex gap-2 opacity-60">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/320px-Visa_Inc._logo.svg.png" alt="Visa" className="h-4 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/320px-Mastercard-logo.svg.png" alt="Mastercard" className="h-4 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/320px-PayPal.svg.png" alt="PayPal" className="h-4 object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp */}
      <a 
        href={`https://wa.me/${(settings.contact?.phone || "+919488073004").replace(/[^0-9]/g, "")}`} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-6 right-6 bg-[#25D366] text-white px-4 py-3.5 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.6)] hover:shadow-[0_0_30px_rgba(37,211,102,0.9)] hover:scale-110 active:scale-95 transition-all duration-300 z-50 flex items-center gap-2 group"
      >
        <svg className="w-6 h-6 fill-current animate-bounce group-hover:animate-none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
        <span className="max-w-0 overflow-hidden group-hover:max-w-[150px] transition-all duration-500 ease-in-out font-black text-xs uppercase tracking-wider whitespace-nowrap">
          Chat & Inquiry
        </span>
      </a>
    </footer>
  );
};

export default UserFooter;
