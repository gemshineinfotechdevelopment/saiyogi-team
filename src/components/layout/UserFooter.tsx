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
      <div className="bg-[#F9F6F0] py-8 border-t border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center divide-x divide-gray-200">
            <div className="flex flex-col items-center justify-center gap-2">
              <ShieldCheck className="h-8 w-8 text-[#7A1416]" />
              <h4 className="font-bold text-sm text-gray-800">Premium Quality</h4>
              <p className="text-[10px] text-gray-500 hidden md:block">100% safe & certified</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 pl-6">
              <Tag className="h-8 w-8 text-[#7A1416]" />
              <h4 className="font-bold text-sm text-gray-800">Best Price & Discounts</h4>
              <p className="text-[10px] text-gray-500 hidden md:block">Direct from Sivakasi</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 pl-6">
              <Truck className="h-8 w-8 text-[#7A1416]" />
              <h4 className="font-bold text-sm text-gray-800">Fast Shipping</h4>
              <p className="text-[10px] text-gray-500 hidden md:block">Pan India delivery</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 pl-6">
              <CreditCard className="h-8 w-8 text-[#7A1416]" />
              <h4 className="font-bold text-sm text-gray-800">Secure Payments</h4>
              <p className="text-[10px] text-gray-500 hidden md:block">100% secure checkout</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 pl-6">
              <HeadphonesIcon className="h-8 w-8 text-[#7A1416]" />
              <h4 className="font-bold text-sm text-gray-800">Customer Support</h4>
              <p className="text-[10px] text-gray-500 hidden md:block">24/7 dedicated support</p>
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
              <h3 className="text-xl font-black text-[#7A1416] uppercase font-display">Sai Yogi Crackers</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable.
            </p>
            {/* Social Links */}
            {settings.socialLinks && (
              <div className="flex gap-3">
                {Object.entries(settings.socialLinks).map(([platform, url]) => {
                  if (!url) return null;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={platform}
                      className="w-8 h-8 flex items-center justify-center bg-gray-300 rounded text-gray-600 hover:bg-[#7A1416] hover:text-white transition-colors duration-200"
                    >
                      {socialIcons[platform as keyof typeof socialIcons] || null}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-black mb-6 text-sm uppercase">Quick Links</h4>
            <nav className="flex flex-col gap-3 text-xs text-gray-600 font-semibold">
              <Link to="/" className="hover:text-[#7A1416] transition-colors duration-200">
                Home
              </Link>
              <Link to="/about-us" className="hover:text-[#7A1416] transition-colors duration-200">
                About Us
              </Link>
              <Link to="/privacy-policy" className="hover:text-[#7A1416] transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-[#7A1416] transition-colors duration-200">
                Terms & Conditions
              </Link>
            </nav>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold text-black mb-6 text-sm uppercase">Customer Service</h4>
            <nav className="flex flex-col gap-3 text-xs text-gray-600 font-semibold">
              <span className="hover:text-[#7A1416] cursor-pointer transition-colors duration-200">
                My Account
              </span>
              <span className="hover:text-[#7A1416] cursor-pointer transition-colors duration-200">
                Track Your Order
              </span>
              <span className="hover:text-[#7A1416] cursor-pointer transition-colors duration-200">
                Returns/Exchange
              </span>
              <span className="hover:text-[#7A1416] cursor-pointer transition-colors duration-200">
                FAQs
              </span>
            </nav>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="font-bold text-black mb-6 text-sm uppercase">Contact Us</h4>
            <div className="flex flex-col gap-3 text-xs text-gray-600 font-semibold mb-4">
              <span>Sai Yogi Crackers, Sivakasi.</span>
              <div className="flex flex-col gap-1 mt-2">
                {settings.contact?.phone && (
                  <a href={`tel:${settings.contact.phone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-2 border border-gray-300 bg-white px-3 py-1.5 rounded text-[#7A1416] hover:bg-gray-50 transition-colors w-max">
                    📞 {settings.contact.phone}
                  </a>
                )}
                {settings.contact?.email && (
                  <a href={`mailto:${settings.contact.email}`} className="hover:text-[#7A1416] transition-colors mt-2">
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
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default UserFooter;
