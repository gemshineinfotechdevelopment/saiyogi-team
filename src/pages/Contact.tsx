import { useState } from "react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { MapPin, MessageSquare, Mail, Phone, Calendar, User, FileText, Send } from "lucide-react";

import contactImg from "@/assets/contact.png";

const Contact = () => {
  const { settings } = useSiteSettings();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    eventDate: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Thank you for your enquiry! Our team will get back to you within 4 hours.");
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      eventDate: "",
      message: "",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF6E5] font-sans text-gray-900 antialiased">
      <UserHeader />

      {/* ──────────────── Premium Hero Banner ──────────────── */}
      <section className="relative w-full py-24 md:py-32 px-4 overflow-hidden bg-black flex items-center justify-center">
        {/* Background image with mix-blend opacity */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity scale-105"
          style={{ backgroundImage: `url(${contactImg})` }}
        />
        {/* Elegant Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/50 to-black/90" />
        
        <div className="relative max-w-4xl mx-auto text-center z-10 space-y-6">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#F4C542] bg-black/40 text-[#F4C542] text-[10px] font-black tracking-widest uppercase mb-2 shadow-sm">
            ⚡ GET IN TOUCH WITH US ⚡
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md uppercase">
            Let's Light Up Your <br className="hidden sm:inline" /> Next Celebration
          </h1>
          <p className="text-gray-200 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed opacity-95">
            Have questions about our crackers, bulk packages, or customized festival estimates? Reach out and our Sivakasi experts will guide you.
          </p>
        </div>
      </section>

      {/* ──────────────── Form + Headquarters Info ──────────────── */}
      <section className="w-full py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* ─── Left: Premium Form ─── */}
            <div className="lg:col-span-7 bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-6 md:p-10 shadow-xl text-left">
              <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-900 mb-2 uppercase tracking-wide">
                Start Your Enquiry
              </h2>
              <p className="text-xs text-gray-500 font-semibold mb-8 uppercase tracking-wider">
                Fill in the details below to receive a personalized quote.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-700 tracking-wider mb-2 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#A80000]" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 outline-none focus:border-[#A80000] focus:ring-2 focus:ring-[#A80000]/10 transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-700 tracking-wider mb-2 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#A80000]" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="ramesh@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 outline-none focus:border-[#A80000] focus:ring-2 focus:ring-[#A80000]/10 transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-700 tracking-wider mb-2 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#A80000]" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="e.g. +91 94880 73004"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 outline-none focus:border-[#A80000] focus:ring-2 focus:ring-[#A80000]/10 transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-700 tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#A80000]" />
                      Festival / Event Date
                    </label>
                    <input
                      type="date"
                      name="eventDate"
                      required
                      value={formData.eventDate}
                      onChange={handleChange}
                      className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 outline-none focus:border-[#A80000] focus:ring-2 focus:ring-[#A80000]/10 transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-black uppercase text-gray-700 tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#A80000]" />
                    Message &amp; Requirements
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    placeholder="Tell us about the scale of your event, crackers requirements, or custom packages..."
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 outline-none focus:border-[#A80000] focus:ring-2 focus:ring-[#A80000]/10 transition-all resize-none bg-white"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="bg-[#A80000] hover:bg-[#F4C542] hover:text-gray-900 text-white font-black text-xs px-8 py-3.5 rounded-xl transition-all duration-300 shadow-md hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Enquiry</span>
                </button>
              </form>
            </div>

            {/* ─── Right: Global Headquarters Card ─── */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-white/80 border border-gray-200/50 rounded-3xl p-6 md:p-8 shadow-xl text-left space-y-6">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-black text-[#A80000] mb-2 uppercase tracking-wide">
                    Global Headquarters
                  </h3>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    Our master pyrotechnicians operate directly from the heart of the Sivakasi fireworks industry, ensuring safety and precision.
                  </p>
                </div>

                {/* Physical Office Info */}
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-50/50 border border-amber-100/50">
                  <div className="w-10 h-10 bg-[#A80000] rounded-xl flex items-center justify-center shrink-0 shadow-md text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#A80000] font-black mb-1">
                      Physical Office
                    </p>
                    <p className="text-xs font-black text-gray-900 uppercase">
                      Sai Yogi Crackers
                    </p>
                    <p className="text-xs text-gray-600 font-semibold mt-0.5">
                      Sivakasi Main Road, Virudhunagar District, Tamil Nadu – 626123
                    </p>
                    <a
                      href={`tel:${settings.contact?.phone?.replace(/[^0-9+]/g, "") || "+919488073004"}`}
                      className="text-xs text-[#A80000] font-black mt-2 inline-block hover:underline"
                    >
                      📞 {settings.contact?.phone || "+91 94880 73004"}
                    </a>
                  </div>
                </div>

                {/* WhatsApp Support Box */}
                <a
                  href={`https://wa.me/${(settings.contact?.phone || "+919488073004").replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-white border border-green-200/80 rounded-2xl px-5 py-4 hover:bg-green-50/50 hover:border-green-300 transition-all shadow-md group"
                >
                  <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center shrink-0 shadow-md">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#25D366] uppercase tracking-wider group-hover:text-green-700 transition-colors">
                      WhatsApp Support
                    </p>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                      Chat directly with our Sales Team
                    </p>
                  </div>
                </a>

                {/* Map Embed */}
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-md h-[200px]">
                  <iframe
                    title="Sai Yogi Crackers Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3937.5!2d77.8!3d9.45!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMjcnMDAuMCJOIDc3wrA0OCcwMC4wIkU!5e0!3m2!1sen!2sin!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
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
