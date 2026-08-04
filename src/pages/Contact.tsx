import { useState } from "react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { MapPin, MessageSquare } from "lucide-react";

import contactHeroFireworks from "@/assets/contact-hero-fireworks.png";

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
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <UserHeader />

      {/* ──────────────── Hero Banner ──────────────── */}
      <section className="relative w-full h-[280px] sm:h-[380px] md:h-[440px] lg:h-[480px] overflow-hidden bg-white">
        <img
          src={contactHeroFireworks}
          alt="Fireworks celebration"
          className="w-full h-full object-cover object-center"
        />
        {/* Text content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <p
            className="uppercase tracking-[0.25em] text-amber-300 text-xs sm:text-sm font-semibold mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Connect With Ignite
          </p>
          <h1
            className="text-white text-2xl sm:text-4xl md:text-5xl font-bold italic drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Let's Create Your Next Masterpiece
          </h1>
        </div>
      </section>

      {/* ──────────────── Form + HQ Card ──────────────── */}
      <section className="w-full bg-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12">
            {/* ─── Left: Form ─── */}
            <div className="lg:col-span-3">
              <h2
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-8"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Start Your Curation
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="e.g. Julian Paterson"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#7A1416] focus:ring-1 focus:ring-[#7A1416]/30 transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="alexander@luxury.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#7A1416] focus:ring-1 focus:ring-[#7A1416]/30 transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="91 00000 00000"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#7A1416] focus:ring-1 focus:ring-[#7A1416]/30 transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Event Date
                    </label>
                    <input
                      type="date"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#7A1416] focus:ring-1 focus:ring-[#7A1416]/30 transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Message &amp; Requirements
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    placeholder="Tell us about the scale of your event and your vision..."
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#7A1416] focus:ring-1 focus:ring-[#7A1416]/30 transition-all resize-none bg-white"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="bg-[#7A1416] hover:bg-red-800 text-white font-bold text-sm px-8 py-3 rounded-md transition-colors shadow-md hover:shadow-lg"
                >
                  Send Enquiry
                </button>
              </form>
            </div>

            {/* ─── Right: Global Headquarters Card ─── */}
            <div className="lg:col-span-2">
              <div className="bg-[#F5F0E8] rounded-xl p-6 md:p-8 shadow-sm border border-[#E8DFD0]">
                <h3
                  className="text-xl md:text-2xl font-bold text-gray-900 mb-3 italic"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Global Headquarters
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  Our master pyrotechnicians operate from the heart of the
                  industry, ensuring every shell is crafted to perfection.
                </p>

                {/* Physical Office */}
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-8 h-8 bg-[#7A1416] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-0.5">
                      Physical Office
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      Sivakasi Main Road,
                    </p>
                    <p className="text-sm text-gray-700">
                      Virudhunagar District,
                    </p>
                    <p className="text-sm text-gray-700">
                      Tamil Nadu – 626123
                    </p>
                    <a
                      href={`tel:${settings.contact?.phone?.replace(/[^0-9+]/g, "") || "+919488073004"}`}
                      className="text-sm text-[#7A1416] font-semibold mt-1 inline-block hover:underline"
                    >
                      {settings.contact?.phone || "+91 94880 73004"}
                    </a>
                  </div>
                </div>

                {/* WhatsApp Support */}
                <a
                  href="https://wa.me/919488073004"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white border border-green-200 rounded-lg px-4 py-3 mb-6 hover:bg-green-50 transition-colors group"
                >
                  <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#25D366] group-hover:text-green-700 transition-colors">
                      WhatsApp Support
                    </p>
                    <p className="text-xs text-gray-500">
                      Chat with a Specialist
                    </p>
                  </div>
                </a>

                {/* Map Embed */}
                <div className="rounded-lg overflow-hidden border border-gray-200 h-[180px]">
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
      <section className="w-full bg-[#FAFAFA] border-t border-gray-100 py-14 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            What Happens Next?
          </h2>
          <p
            className="text-sm text-gray-500 italic mb-12"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Our refined process for bringing your vision to light.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-5 group-hover:shadow-md group-hover:border-[#7A1416]/30 transition-all">
                <svg
                  className="w-7 h-7 text-[#7A1416]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                  />
                </svg>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                01. Verification
              </p>
              <h4
                className="text-sm font-bold text-gray-900 mb-2 italic"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Immediate Review
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                Our concierge team validates your event requirements and site
                safety within 4 hours.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-5 group-hover:shadow-md group-hover:border-[#7A1416]/30 transition-all">
                <svg
                  className="w-7 h-7 text-[#7A1416]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                02. Curation
              </p>
              <h4
                className="text-sm font-bold text-gray-900 mb-2 italic"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Artistic Design
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                Pyrotechnicians curate a color palette and shell sequence
                tailored to your theme.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-5 group-hover:shadow-md group-hover:border-[#7A1416]/30 transition-all">
                <svg
                  className="w-7 h-7 text-[#7A1416]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                03. Proposal
              </p>
              <h4
                className="text-sm font-bold text-gray-900 mb-2 italic"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Bespoke Quote
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                A comprehensive document detailing the display choreography and
                logistics.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-5 group-hover:shadow-md group-hover:border-[#7A1416]/30 transition-all">
                <svg
                  className="w-7 h-7 text-[#7A1416]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                  />
                </svg>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                04. Delivery
              </p>
              <h4
                className="text-sm font-bold text-gray-900 mb-2 italic"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Grand Display
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                Full execution including legal permits, onsite arrangement, and
                the final show.
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
