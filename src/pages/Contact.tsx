import { useSiteSettings } from "@/context/SiteSettingsContext";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const Contact = () => {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FEF9C3' }}>
      <UserHeader />

      {/* Hero Section */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden bg-gradient-to-r from-red-600/10 to-red-500/10">
        <div className="container relative z-10 py-16">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-red-900 mb-4">Contact Us</h1>
          <p className="text-lg text-red-800 max-w-md">
            Get in touch with us for any questions or concerns about your order.
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="container py-16">
        <div>
          {/* Contact Details */}
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-red-900 mb-8">Get In Touch</h2>
              
              {/* Contact Info Cards */}
              <div className="space-y-6">
                {/* Phone */}
                <div className="flex gap-4 p-4 rounded-lg bg-red-50 border-l-4 border-red-600">
                  <Phone className="h-6 w-6 text-red-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Phone</h3>
                    <p className="text-red-800">
                      {settings.contact?.phone || "+91 98765 43210"}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-4 p-4 rounded-lg bg-yellow-50 border-l-4 border-yellow-600">
                  <Mail className="h-6 w-6 text-yellow-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Email</h3>
                    <p className="text-red-800">
                      {settings.contact?.email || "contact@narendiraa-enterprises.com"}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex gap-4 p-4 rounded-lg bg-orange-50 border-l-4 border-orange-600">
                  <MapPin className="h-6 w-6 text-orange-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Address</h3>
                    <p className="text-red-800">
                      {settings.contact?.address || "Sivakasi, Tamil Nadu, India"}
                    </p>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="flex gap-4 p-4 rounded-lg bg-green-50 border-l-4 border-green-600">
                  <Clock className="h-6 w-6 text-green-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Business Hours</h3>
                    <p className="text-red-800">Mon - Sun: 9:00 AM - 9:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="w-full py-16 bg-gradient-to-b from-red-50 to-yellow-50">
        <div className="container">
          <h2 className="font-display text-3xl font-bold text-red-900 mb-8 text-center">Find Our Location</h2>
          <div className="rounded-lg overflow-hidden shadow-lg border-4 border-red-300 h-[400px] md:h-[500px]">
            <iframe
              title="Narendiraa Enterprises Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3937.486688298857!2d97.7641!3d8.7658!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOETCsDQ1JzU0LjkiTiA5N8K3NDV%27NDguNyJF!5e0!3m2!1sen!2sin!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: "none" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <UserFooter />
    </div>
  );
};

export default Contact;
