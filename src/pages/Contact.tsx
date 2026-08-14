import { useSiteSettings } from "@/context/SiteSettingsContext";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { MapPin, MessageSquare, Phone, Navigation } from "lucide-react";
import contactImg from "@/assets/contact.png";

const Contact = () => {
  const { settings } = useSiteSettings();

  const phoneNum = settings.contact?.phone || "+91 94880 73004";
  const cleanPhone = phoneNum.replace(/[^0-9]/g, "");

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF6E5] font-sans text-gray-900 antialiased">
      <UserHeader />

      {/* ──────────────── Premium Hero Banner ──────────────── */}
      <section className="relative w-full py-20 md:py-28 px-4 overflow-hidden bg-black flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity scale-105"
          style={{ backgroundImage: `url(${contactImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/50 to-black/90" />
        
        <div className="relative max-w-4xl mx-auto text-center z-10 space-y-4">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#F4C542] bg-black/40 text-[#F4C542] text-[10px] font-black tracking-widest uppercase mb-1 shadow-sm">
            ⚡ REACH OUR SIVAKASI HEADQUARTERS ⚡
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md uppercase">
            Visit &amp; Contact Us
          </h1>
          <p className="text-gray-200 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed opacity-95">
            Located directly in the heart of Sivakasi, Tamil Nadu. Find our location on the map below or contact our experts directly.
          </p>
        </div>
      </section>

      {/* ──────────────── Map + Headquarters Info ──────────────── */}
      <section className="w-full py-12 md:py-16 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            
            {/* ─── Left: Embedded Google Map ─── */}
            <div className="lg:col-span-7 bg-white border border-gray-200/80 rounded-3xl p-4 md:p-6 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#A80000] text-white flex items-center justify-center shadow-md">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-black text-gray-900 uppercase tracking-wide">
                      Interactive Location Map
                    </h2>
                    <p className="text-[11px] text-gray-500 font-semibold uppercase">
                      Sivakasi, Tamil Nadu - 626123
                    </p>
                  </div>
                </div>

                <a
                  href="https://maps.app.goo.gl/2rSEUcrmFBpJ2qcA7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 bg-[#A80000] hover:bg-red-800 text-white text-xs font-black px-4 py-2 rounded-xl shadow-sm transition-all hover:scale-105"
                >
                  <span>Get Directions</span>
                </a>
              </div>

              {/* Responsive Map iFrame */}
              <div className="w-full flex-1 min-h-[380px] md:min-h-[460px] rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative bg-gray-100">
                <iframe
                  title="Sai Yogi Crackers Map Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3110.7130149435898!2d77.81535597375743!3d9.439364682433059!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b06cffcd663a897%3A0xe2760844220366de!2sSai%20Yogi%20crackers!5e1!3m2!1sen!2sin!4v1786702640495!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full absolute inset-0"
                />
              </div>
            </div>

            {/* ─── Right: Global Headquarters & Support Cards ─── */}
            <div className="lg:col-span-5 bg-white border border-gray-200/80 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col justify-between space-y-6">
              <div>
                <h3 className="font-display text-2xl font-black text-[#A80000] mb-2 uppercase tracking-wide">
                  Global Headquarters
                </h3>
                <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                  Our master pyrotechnicians operate directly from the heart of the Sivakasi fireworks industry, ensuring maximum safety, quality control, and factory-direct pricing.
                </p>
              </div>

              {/* Physical Office Card */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
                <div className="w-11 h-11 bg-[#A80000] rounded-xl flex items-center justify-center shrink-0 shadow-md text-white">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#A80000] font-black mb-1">
                    Physical Office &amp; Factory
                  </p>
                  <p className="text-xs font-black text-gray-900 uppercase">
                    Sai Yogi Crackers
                  </p>
                  <p className="text-xs text-gray-600 font-semibold mt-0.5 leading-relaxed">
                    3/1255/1B, Sri Ram Nagar, Paraipatti, Viswanatham, Sivakasi 626189
                  </p>
                </div>
              </div>

              {/* Call Support Card */}
              <a
                href={`tel:${cleanPhone}`}
                className="flex items-center gap-4 bg-white border border-red-200 rounded-2xl px-5 py-4 hover:bg-red-50/60 hover:border-red-300 transition-all shadow-md group cursor-pointer"
              >
                <div className="w-11 h-11 bg-[#A80000] rounded-xl flex items-center justify-center shrink-0 shadow-md">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#A80000] uppercase tracking-wider group-hover:text-red-900 transition-colors">
                    Direct Phone Call
                  </p>
                  <p className="text-xs font-black text-gray-900 mt-0.5">
                    {phoneNum}
                  </p>
                </div>
              </a>

              {/* WhatsApp Support Box */}
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-white border border-green-200/80 rounded-2xl px-5 py-4 hover:bg-green-50/60 hover:border-green-300 transition-all shadow-md group cursor-pointer"
              >
                <div className="w-11 h-11 bg-[#25D366] rounded-xl flex items-center justify-center shrink-0 shadow-md">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#25D366] uppercase tracking-wider group-hover:text-green-700 transition-colors">
                    WhatsApp Sales Support
                  </p>
                  <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                    Instant response for bulk inquiries &amp; estimates
                  </p>
                </div>
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────── What Happens Next ──────────────── */}
      <section className="w-full bg-white/40 border-t border-gray-200/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-900 mb-2 uppercase tracking-wide">
            What Happens Next?
          </h2>
          <div className="w-16 h-1 bg-[#A80000] mx-auto my-3 rounded-full"></div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-12">
            Our step-by-step process for confirming and delivering your order.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-md flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:border-[#A80000]/25 hover:scale-105 transition-all duration-300">
                <svg
                  className="w-7 h-7 text-[#A80000]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                  />
                </svg>
              </div>
              <p className="text-[9px] uppercase tracking-widest text-[#A80000] font-black mb-1">
                01. Review
              </p>
              <h4 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-wider">
                Immediate Review
              </h4>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed max-w-[220px]">
                Our dedicated sales team checks product availability and delivery safety guidelines within 4 hours.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-md flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:border-[#A80000]/25 hover:scale-105 transition-all duration-300">
                <svg
                  className="w-7 h-7 text-[#A80000]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </div>
              <p className="text-[9px] uppercase tracking-widest text-[#A80000] font-black mb-1">
                02. Curation
              </p>
              <h4 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-wider">
                Custom Selection
              </h4>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed max-w-[220px]">
                We help curate the perfect combinations of sound, light, and duration based on your custom event.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-md flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:border-[#A80000]/25 hover:scale-105 transition-all duration-300">
                <svg
                  className="w-7 h-7 text-[#A80000]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <p className="text-[9px] uppercase tracking-widest text-[#A80000] font-black mb-1">
                03. Confirmation
              </p>
              <h4 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-wider">
                Order Enquiry
              </h4>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed max-w-[220px]">
                Receive a detailed enquiry summary containing bulk discounts, special festival offers, and direct bank details.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-md flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:border-[#A80000]/25 hover:scale-105 transition-all duration-300">
                <svg
                  className="w-7 h-7 text-[#A80000]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                  />
                </svg>
              </div>
              <p className="text-[9px] uppercase tracking-widest text-[#A80000] font-black mb-1">
                04. Shipping
              </p>
              <h4 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-wider">
                Direct Delivery
              </h4>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed max-w-[220px]">
                Safe, legal transport directly from Sivakasi to your location in secure, moisture-proof cargo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <UserFooter />
    </div>
  );
};

export default Contact;
