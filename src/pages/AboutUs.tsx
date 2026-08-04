import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { Link } from "react-router-dom";
import { Award, ShieldCheck, Sparkles, Truck, Medal, Tag, Leaf, Check } from "lucide-react";
import aboutImg from "@/assets/about.png";

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <UserHeader />

      <main className="flex-1">
        {/* Hero Banner Section */}
        <section className="relative bg-black text-white py-24 md:py-32 px-4 overflow-hidden">
          {/* Background image with overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity"
            style={{ backgroundImage: `url(${aboutImg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80" />

          <div className="relative max-w-5xl mx-auto text-center z-10 space-y-6">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
              Light Up Your Celebrations Since 1985
            </h1>
            <p className="text-gray-200 text-sm sm:text-base md:text-lg max-w-3xl mx-auto leading-relaxed opacity-95">
              Rooted in the heart of Sivakasi, Sai Yogi Crackers brings you the finest quality fireworks that blend traditional craftsmanship with modern safety standards.
            </p>
          </div>
        </section>

        {/* Our Mission & Stats Section */}
        <section className="py-16 md:py-24 bg-[#FAFAFA] px-4 md:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            {/* Left Info Column */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-[#7A1416] font-extrabold text-xs tracking-widest uppercase mb-2 block">
                  OUR MISSION
                </span>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                  Spreading Joy, Safely and Sustainably
                </h2>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
                  At Sai Yogi Crackers, our mission is to be the pulse of every celebration. We strive to provide premium fireworks that create unforgettable memories for families while ensuring absolute peace of mind through rigorous safety protocols and environmental responsibility.
                </p>
              </div>

              {/* Certified Quality Badge */}
              <div className="bg-red-50/70 border border-red-100 p-4 rounded-xl flex items-center gap-4 max-w-md shadow-sm">
                <div className="w-11 h-11 rounded-full bg-red-100 text-[#7A1416] flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Certified Quality</h4>
                  <p className="text-xs text-gray-500">Meeting all national fireworks safety standards.</p>
                </div>
              </div>
            </div>

            {/* Right Stat Cards */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#5B0E10] text-white p-8 rounded-2xl flex flex-col justify-end shadow-lg min-h-[220px]">
                <div className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-2">
                  35+
                </div>
                <p className="text-xs sm:text-sm font-medium text-red-100/90">
                  Years of Excellence
                </p>
              </div>

              <div className="bg-[#FFC700] text-gray-950 p-8 rounded-2xl flex flex-col justify-end shadow-lg min-h-[220px]">
                <div className="font-display text-4xl sm:text-5xl font-extrabold text-gray-950 tracking-tight mb-2">
                  500+
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-800">
                  Product Varieties
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Heritage & Safety First Section */}
        <section className="py-12 md:py-16 px-4 md:px-8 bg-stone-100/60">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Our Heritage Card */}
            <div className="bg-white p-8 md:p-10 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <Sparkles className="w-10 h-10 text-[#7A1416] mb-6" />
                <h3 className="font-display text-2xl md:text-3xl font-extrabold text-gray-900 mb-4">
                  Our Heritage
                </h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                  Established in Sivakasi, the fireworks capital of India, Sai Yogi Crackers started as a small, family unit with a single vision: to perfect the art of the firework. Over decades, we have preserved traditional techniques while integrating state-of-the-art manufacturing processes. Each sparkle is a testament to our legacy of quality and devotion to the craft.
                </p>
              </div>
            </div>

            {/* Safety First Card */}
            <div className="bg-[#5B0E10] text-white p-8 md:p-10 rounded-2xl shadow-lg flex flex-col justify-between">
              <div>
                <ShieldCheck className="w-10 h-10 text-white mb-6" />
                <h3 className="font-display text-2xl md:text-3xl font-extrabold text-white mb-3">
                  Safety First
                </h3>
                <p className="text-red-100/90 text-sm md:text-base mb-6 leading-relaxed">
                  Your safety is our non-negotiable priority. We employ multi-stage testing for every batch produced.
                </p>

                <ul className="space-y-3">
                  {[
                    "ISO Certified Manufacturing",
                    "Low-Emission Formulas",
                    "Child-Safe Distance Guidelines",
                    "Secure Tamper-Proof Packing"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-xs md:text-sm font-medium text-white/95">
                      <span className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center text-white shrink-0">
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
        <section className="bg-[#5B0E10] py-20 px-4 md:px-8 text-white w-full">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white text-center mb-12 tracking-tight">
              Why Choose Sai Yogi?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 p-6 md:p-8 rounded-xl text-center flex flex-col items-center hover:bg-white/[0.12] transition-colors duration-300">
                <Truck className="w-9 h-9 text-[#FFC700] mb-4" />
                <h4 className="font-bold text-lg text-white mb-2">Express Delivery</h4>
                <p className="text-xs md:text-sm text-red-100/80 leading-relaxed">
                  On-time shipping across India to ensure your festival is bright.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 p-6 md:p-8 rounded-xl text-center flex flex-col items-center hover:bg-white/[0.12] transition-colors duration-300">
                <Medal className="w-9 h-9 text-[#FFC700] mb-4" />
                <h4 className="font-bold text-lg text-white mb-2">Premium Quality</h4>
                <p className="text-xs md:text-sm text-red-100/80 leading-relaxed">
                  Hand-picked ingredients for the longest-lasting colors.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 p-6 md:p-8 rounded-xl text-center flex flex-col items-center hover:bg-white/[0.12] transition-colors duration-300">
                <Tag className="w-9 h-9 text-[#FFC700] mb-4" />
                <h4 className="font-bold text-lg text-white mb-2">Best Pricing</h4>
                <p className="text-xs md:text-sm text-red-100/80 leading-relaxed">
                  Direct factory-to-door pricing with no middleman markup.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 p-6 md:p-8 rounded-xl text-center flex flex-col items-center hover:bg-white/[0.12] transition-colors duration-300">
                <Leaf className="w-9 h-9 text-[#FFC700] mb-4" />
                <h4 className="font-bold text-lg text-white mb-2">Eco-Friendly</h4>
                <p className="text-xs md:text-sm text-red-100/80 leading-relaxed">
                  Sustainable formulations for a greener celebration.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner Section */}
        <section className="py-12 md:py-16 px-4 md:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="bg-[#FFC700] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#5B0E10] mb-2">
                  Ready for the Grand Celebration?
                </h3>
                <p className="text-gray-900 font-medium text-sm md:text-base">
                  Browse our exclusive collections and start building your estimate today.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto shrink-0">
                <Link
                  to="/catalog"
                  className="w-full sm:w-auto text-center bg-[#5B0E10] hover:bg-[#43090B] text-white px-7 py-3.5 rounded-lg font-bold text-sm shadow-md transition-all"
                >
                  Explore Products
                </Link>
                <Link
                  to="/contact"
                  className="w-full sm:w-auto text-center bg-white hover:bg-gray-100 text-gray-900 px-7 py-3.5 rounded-lg font-bold text-sm shadow-md transition-all border border-gray-200"
                >
                  Wholesale Inquiry
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <UserFooter />
    </div>
  );
};

export default AboutUs;
