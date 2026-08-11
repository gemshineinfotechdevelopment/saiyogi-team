import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { Link } from "react-router-dom";
import { Award, ShieldCheck, Sparkles, Truck, Medal, Tag, Leaf, Check } from "lucide-react";
import aboutImg from "@/assets/about.png";

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-gray-900 antialiased">
      <UserHeader />

      <main className="flex-1">
        {/* Premium Hero Banner Section */}
        <section className="relative w-full py-24 md:py-32 px-4 overflow-hidden bg-black flex items-center justify-center">
          {/* Background image with mix-blend opacity */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity scale-105"
            style={{ backgroundImage: `url(${aboutImg})` }}
          />
          {/* Elegant Dark Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/50 to-black/90" />
          
          <div className="relative max-w-4xl mx-auto text-center z-10 space-y-6">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#F4C542] bg-black/40 text-[#F4C542] text-[10px] font-black tracking-widest uppercase mb-2 shadow-sm">
              ✨ SHINING BRIGHT FOR DECADES ✨
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md uppercase">
              Light Up Celebrations <br className="hidden sm:inline" /> Since 1985
            </h1>
            <p className="text-gray-200 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed opacity-95">
              Rooted in the historical heart of Sivakasi, Sai Yogi Crackers brings you the finest quality fireworks that blend generations of traditional craftsmanship with modern safety standards.
            </p>
          </div>
        </section>

        {/* Our Mission & Stats Section */}
        <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Info Column */}
            <div className="lg:col-span-7 flex flex-col space-y-6 text-left">
              <div>
                <span className="text-[#A80000] font-black text-xs tracking-widest uppercase mb-2 block">
                  OUR MISSION
                </span>
                <h2 className="font-display text-2xl sm:text-4xl font-black text-gray-900 leading-tight">
                  Spreading Joy, Safely & Sustainably
                </h2>
                <div className="w-16 h-1 bg-[#A80000] my-4 rounded-full"></div>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6 font-semibold">
                  At Sai Yogi Crackers, our mission is to be the pulse of every celebration. We strive to provide premium fireworks that create unforgettable memories for families while ensuring absolute peace of mind through rigorous safety protocols and environmental responsibility.
                </p>
              </div>

              {/* Certified Quality Badge */}
              <div className="bg-white/50 backdrop-blur-md border border-white/60 p-5 rounded-2xl flex items-center gap-4 max-w-md shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-[#A80000] flex items-center justify-center shrink-0 border border-red-100/50 shadow-sm">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-sm uppercase tracking-wide">Certified Quality</h4>
                  <p className="text-xs text-gray-500 font-semibold">Meeting all national fireworks safety guidelines in India.</p>
                </div>
              </div>
            </div>

            {/* Right Stat Cards */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-6 w-full">
              <div className="bg-[#A80000] text-white p-4 sm:p-8 rounded-2xl flex flex-col justify-end shadow-xl min-h-[110px] sm:min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border border-red-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-white/5 rounded-full blur-xl transition-all group-hover:scale-125"></div>
                <div className="font-display text-3xl sm:text-5xl font-black text-[#F4C542] tracking-tight mb-1 sm:mb-2">
                  35+
                </div>
                <p className="text-[10px] sm:text-sm font-black uppercase tracking-wider sm:tracking-widest text-red-100 leading-tight">
                  Years of Excellence
                </p>
              </div>

              <div className="bg-white/80 border border-gray-200/50 text-gray-950 p-4 sm:p-8 rounded-2xl flex flex-col justify-end shadow-xl min-h-[110px] sm:min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-[#F4C542]/10 rounded-full blur-xl transition-all group-hover:scale-125"></div>
                <div className="font-display text-3xl sm:text-5xl font-black text-[#A80000] tracking-tight mb-1 sm:mb-2">
                  500+
                </div>
                <p className="text-[10px] sm:text-sm font-black uppercase tracking-wider sm:tracking-widest text-gray-500 leading-tight">
                  Product Varieties
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Heritage & Safety First Section */}
        <section className="bg-white/40 border-y border-gray-200/50 py-16 px-4 md:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Our Heritage Card */}
            <div className="bg-white/80 border border-gray-200/60 p-8 md:p-10 rounded-3xl shadow-lg flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
              <div>
                <div className="bg-red-50 text-[#A80000] w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-red-100/50 shadow-sm">
                  <Sparkles className="w-6 h-6 fill-current" />
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-black text-gray-900 mb-4 uppercase tracking-wide">
                  Our Heritage
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-semibold">
                  Established in Sivakasi, the fireworks capital of India, Sai Yogi Crackers started as a small, family unit with a single vision: to perfect the art of the firework. Over decades, we have preserved traditional techniques while integrating state-of-the-art manufacturing processes. Each sparkle is a testament to our legacy of quality and devotion to the craft.
                </p>
              </div>
            </div>

            {/* Safety First Card */}
            <div className="bg-gradient-to-br from-[#A80000] to-[#6b0002] text-white p-8 md:p-10 rounded-3xl shadow-xl flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left border border-[#A80000]/20">
              <div>
                <div className="bg-white/10 text-white w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-black text-[#F4C542] mb-3 uppercase tracking-wide">
                  Safety First
                </h3>
                <p className="text-red-100/90 text-xs sm:text-sm mb-6 leading-relaxed font-semibold">
                  Your safety is our non-negotiable priority. We employ multi-stage testing for every single batch produced in our Sivakasi facility.
                </p>

                <ul className="space-y-3">
                  {[
                    "ISO Certified Manufacturing Standards",
                    "Low-Emission Green Formulations",
                    "Child-Safe Distance Guidelines Included",
                    "Secure Tamper-Proof & Moisture-Proof Packing"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-xs font-black uppercase tracking-wider text-white/95">
                      <span className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center text-[#F4C542] shrink-0 bg-white/5">
                        <Check className="w-3 h-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Sai Yogi Section */}
        <section className="bg-gradient-to-br from-[#A80000] via-[#5c0a0b] to-[#1A1A1A] py-20 px-4 text-white w-full border-t border-[#F4C542]/20">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-2xl sm:text-4xl font-black text-white text-center mb-12 uppercase tracking-widest">
              Why Choose Sai Yogi?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-2xl text-center flex flex-col items-center hover:bg-white/[0.12] hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 border border-white/10">
                  <Truck className="w-6 h-6 text-[#F4C542]" />
                </div>
                <h4 className="font-black text-sm uppercase tracking-wider text-white mb-2">Express Delivery</h4>
                <p className="text-[11px] text-red-100/80 leading-relaxed font-semibold">
                  On-time shipping across India to ensure your festival is bright and loud.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-2xl text-center flex flex-col items-center hover:bg-white/[0.12] hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 border border-white/10">
                  <Medal className="w-6 h-6 text-[#F4C542]" />
                </div>
                <h4 className="font-black text-sm uppercase tracking-wider text-white mb-2">Premium Quality</h4>
                <p className="text-[11px] text-red-100/80 leading-relaxed font-semibold">
                  Hand-picked Sivakasi ingredients for the longest-lasting vibrant colors.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-2xl text-center flex flex-col items-center hover:bg-white/[0.12] hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 border border-white/10">
                  <Tag className="w-6 h-6 text-[#F4C542]" />
                </div>
                <h4 className="font-black text-sm uppercase tracking-wider text-white mb-2">Best Pricing</h4>
                <p className="text-[11px] text-red-100/80 leading-relaxed font-semibold">
                  Direct factory-to-door wholesale pricing with zero middleman markup.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-2xl text-center flex flex-col items-center hover:bg-white/[0.12] hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 border border-white/10">
                  <Leaf className="w-6 h-6 text-[#F4C542]" />
                </div>
                <h4 className="font-black text-sm uppercase tracking-wider text-white mb-2">Eco-Friendly</h4>
                <p className="text-[11px] text-red-100/80 leading-relaxed font-semibold">
                  Sustainable low-smoke green formulations for a cleaner celebration.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner Section */}
        <section className="py-16 px-4 md:px-8 bg-transparent max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#F4C542] to-[#D4A31C] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl border border-[#F4C542]/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="text-left">
              <h3 className="font-display text-2xl sm:text-3xl font-black text-[#A80000] mb-2 uppercase tracking-wide">
                Ready for a Grand Celebration?
              </h3>
              <p className="text-amber-950 font-black text-xs md:text-sm uppercase tracking-wider">
                Browse our exclusive collections and build your custom estimate today.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto shrink-0 z-10">
              <Link
                to="/catalog"
                className="w-full sm:w-auto text-center bg-[#A80000] hover:bg-red-800 text-white px-7 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:scale-[1.02] transition-all"
              >
                Explore Products
              </Link>
              <Link
                to="/contact"
                className="w-full sm:w-auto text-center bg-white hover:bg-gray-50 text-gray-900 px-7 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:scale-[1.02] transition-all border border-gray-200"
              >
                Wholesale Inquiry
              </Link>
            </div>
          </div>
        </section>
      </main>

      <UserFooter />
    </div>
  );
};

export default AboutUs;
