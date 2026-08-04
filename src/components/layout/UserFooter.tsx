import companyLogo from "@/assets/1.png";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const UserFooter = () => {
  const { settings } = useSiteSettings();

  const socialIcons = {
    facebook: <Facebook className="h-5 w-5" />,
    twitter: <Twitter className="h-5 w-5" />,
    instagram: <Instagram className="h-5 w-5" />,
    youtube: <Youtube className="h-5 w-5" />,
  };

  return (
    <footer className="bg-[#002366] text-white mt-auto font-body border-t-4 border-[#ED1C24]">
      <div className="container py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* About Section */}
        <div>
          <div className="flex flex-col items-start gap-0 mb-6">
            <img src={companyLogo} alt="Logo" className="h-16 object-contain bg-white rounded p-1" />
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Bringing your celebrations to life for over 20 years. We specialize in premium crackers from the heart of Sivakasi.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-display font-bold text-white mb-6 uppercase tracking-widest text-sm">Quick Links</h4>
          <nav className="flex flex-col gap-2 text-sm text-gray-200">
            <Link to="/catalog" className="hover:text-accent font-semibold transition-colors duration-200">
              Shop All
            </Link>
            <Link to="/catalog?category=sparklers" className="hover:text-accent font-semibold transition-colors duration-200">
              Sparklers
            </Link>
            <Link to="/catalog?category=rockets" className="hover:text-accent font-semibold transition-colors duration-200">
              Rockets
            </Link>
            <Link to="/contact" className="hover:text-accent font-semibold transition-colors duration-200">
              Contact Us
            </Link>
            <Link to="/safety-tips" className="hover:text-accent font-semibold transition-colors duration-200">
              Safety Tips
            </Link>
          </nav>
        </div>

        {/* Customer Service */}
        <div>
          <h4 className="font-display font-bold text-white mb-6 uppercase tracking-widest text-sm">Customer Care</h4>
          <nav className="flex flex-col gap-2 text-sm text-gray-200">
            <span className="hover:text-accent cursor-pointer font-semibold transition-colors duration-200">
              Safety Guidelines
            </span>
            <span className="hover:text-accent cursor-pointer font-semibold transition-colors duration-200">
              FAQs
            </span>
          </nav>
        </div>

        {/* Contact & Social */}
        <div>
          <h4 className="font-display font-bold text-white mb-6 uppercase tracking-widest text-sm">Get In Touch</h4>
          <div className="flex flex-col gap-3 text-sm text-gray-200 mb-4">
            {settings.contact?.phone && (
              <span>📞 {settings.contact.phone}</span>
            )}
            {settings.contact?.email && (
              <span>📧 {settings.contact.email}</span>
            )}
            {settings.contact?.address && (
              <span>📍 {settings.contact.address}</span>
            )}
          </div>

          {/* Social Links */}
          {settings.socialLinks && (
            <div className="flex gap-3 mt-4">
              {Object.entries(settings.socialLinks).map(([platform, url]) => {
                if (!url) return null;
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={platform}
                    className="text-gray-300 hover:text-accent transition-colors duration-200"
                  >
                    {socialIcons[platform as keyof typeof socialIcons] || null}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#001844] py-6 text-center text-[10px] text-gray-500 font-medium border-t border-white/5 uppercase tracking-widest">
        © 2026 {settings.siteName || "Narendraa Enterprises"}. All rights reserved.{" "}
        <span className="text-[#FFD700]">Safety First 🎇</span>
      </div>
    </footer>
  );
};

export default UserFooter;
