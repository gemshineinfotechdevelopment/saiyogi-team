import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { Link } from "react-router-dom";
import { ShieldCheck, Sparkles, Tag, Leaf, CheckCircle2, ArrowRight, Award, ShoppingBag, MapPin, HeartHandshake, FileSpreadsheet } from "lucide-react";
import aboutImg from "@/assets/about.png";

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-gray-900 antialiased">
      <UserHeader />

      <main className="flex-1">
        {/* Premium Hero Banner Section */}
        <section className="relative w-full py-20 md:py-28 px-4 overflow-hidden bg-black flex items-center justify-center">
          {/* Background image with mix-blend opacity */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 mix-blend-luminosity scale-105"
            style={{ backgroundImage: `url(${aboutImg})` }}
          />
          {/* Elegant Dark Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-black/95" />
          
          <div className="relative max-w-4xl mx-auto text-center z-10 space-y-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F4C542]/60 bg-[#F4C542]/10 text-[#F4C542] text-xs font-black tracking-widest uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              SIVAKASI DIRECT WHOLESALE CRACKERS
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md uppercase">
              ABOUT US !!
            </h1>
            <div className="w-20 h-1 bg-[#F4C542] mx-auto rounded-full"></div>
            <p className="text-gray-200 text-sm sm:text-base md:text-lg max-w-3xl mx-auto leading-relaxed font-medium">
              Welcome to{" "}
              <Link to="/" className="text-[#F4C542] font-bold underline hover:text-yellow-300">
                Saiyogicrakers.com
              </Link>{" "}
              from the city of crackers called Sivakasi, we are in this crackers industry for past 11 years and delivering crackers online from 2017 in wholesale price.
            </p>
          </div>
        </section>

        {/* Quick Highlights / Stats Bar */}
        <section className="relative z-20 -mt-8 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 flex flex-col items-center text-center transform transition-all duration-300 hover:-translate-y-1">
              <div className="text-3xl sm:text-4xl font-black text-[#A80000] font-display">11+</div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-1">Years in Industry</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 flex flex-col items-center text-center transform transition-all duration-300 hover:-translate-y-1">
              <div className="text-3xl sm:text-4xl font-black text-[#A80000] font-display">2017</div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-1">Delivering Online Since</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 flex flex-col items-center text-center transform transition-all duration-300 hover:-translate-y-1">
              <div className="text-3xl sm:text-4xl font-black text-[#A80000] font-display">10,000+</div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-1">Orders Delivered</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 flex flex-col items-center text-center transform transition-all duration-300 hover:-translate-y-1">
              <div className="text-3xl sm:text-4xl font-black text-[#F4C542] font-display">80%</div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-1">Wholesale Discount</p>
            </div>
          </div>
        </section>

        {/* Welcome & Diwali 2025 Introduction Card */}
        <section className="py-12 md:py-16 px-4 max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-200/80 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#A80000]"></div>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#A80000] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-wide">
                  Welcome to Saiyogicrackers
                </h2>
              </div>

              <div className="space-y-4 text-gray-700 text-sm sm:text-base leading-relaxed">
                <p>
                  Welcome to{" "}
                  <Link to="/" className="text-[#A80000] font-bold hover:underline">
                    Saiyogicrakers.com
                  </Link>{" "}
                  from the city of crackers called Sivakasi, we are in this crackers industry for past 11 years and delivering crackers online from 2017 in wholesale price.
                </p>

                <p>
                  We are glad to say that we successfully delivered 10000+ orders over india in the past years, now our team{" "}
                  <Link to="/" className="text-[#A80000] font-bold hover:underline">
                    Saiyogicrakers.com
                  </Link>{" "}
                  are ready for the Diwali 2025 with a lot of new arrival firecrackers and kids special crackers which are going to make sparkles in your festival days.{" "}
                  <Link
                    to="/price-list"
                    className="inline-flex items-center gap-1 font-bold text-[#A80000] bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg border border-red-200 transition-colors ml-1"
                  >
                    <FileSpreadsheet className="w-4 h-4 inline text-[#A80000]" />
                    Click to get the Price List
                    <ArrowRight className="w-3.5 h-3.5 inline" />
                  </Link>
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to="/price-list"
                  className="inline-flex items-center gap-2 bg-[#A80000] hover:bg-red-800 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  View 2025 Price List
                </Link>
                <Link
                  to="/quick-enquiry"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Quick Order
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SAFETY FIRST Section */}
        <section className="py-12 md:py-16 px-4 max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-[#A80000] to-[#7a0002] rounded-3xl p-6 sm:p-10 md:p-12 text-white shadow-2xl relative overflow-hidden border border-red-400/30">
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <ShieldCheck className="w-7 h-7 text-[#F4C542]" />
                </div>
                <div>
                  <span className="text-[#F4C542] text-xs font-black uppercase tracking-widest">Our Top Commitment</span>
                  <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
                    SAFETY FIRST
                  </h2>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/20">
                <p className="text-sm sm:text-base md:text-lg font-bold text-yellow-100 leading-relaxed">
                  For safety purpose we are only Dealing premium Quality crackers from authentic brands in Sivakasi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* How we are selecting safe crackers? */}
                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-[#F4C542] font-black text-sm sm:text-base uppercase tracking-wide">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <h3>How we are selecting safe crackers?</h3>
                  </div>
                  <p className="text-red-100 text-xs sm:text-sm leading-relaxed font-medium">
                    As a Quality assurance team we are committed to delivering only the best crackers that are tested rigorously for quality and performance to guarantee the safety{" "}
                    <Link to="/quick-enquiry" className="font-bold text-[#F4C542] underline hover:text-yellow-300 inline-flex items-center gap-1">
                      Shop Here
                      <ArrowRight className="w-3.5 h-3.5 inline" />
                    </Link>
                    . We are committed to providing a safe and enjoyable Diwali festival experience by introducing a range of eco-friendly crackers.
                  </p>
                </div>

                {/* What is eco-friendly crackers! */}
                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-[#F4C542] font-black text-sm sm:text-base uppercase tracking-wide">
                    <Leaf className="w-5 h-5 shrink-0" />
                    <h3>What is eco-friendly crackers!</h3>
                  </div>
                  <p className="text-red-100 text-xs sm:text-sm leading-relaxed font-medium">
                    We prioritize both customer satisfaction and environmental responsibility. We proudly offer eco-friendly{" "}
                    <Link to="/catalog" className="font-bold text-[#F4C542] underline hover:text-yellow-300">
                      firecrackers
                    </Link>{" "}
                    to reduce their impact on the environment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING Section */}
        <section className="py-12 md:py-16 px-4 max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-200 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-gray-100 pb-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[#A80000] text-xs font-black uppercase tracking-widest">Wholesale & Retail</span>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase text-gray-900">
                    PRICING
                  </h2>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-[#A80000] font-black text-sm border border-red-200">
                🔥 80% Wholesale Discount Available
              </span>
            </div>

            <div className="space-y-4 text-gray-700 text-sm sm:text-base leading-relaxed">
              <p>
                We provide competitively priced wholesale online crackers from Sivakasi, ensuring both safety and quality without compromising on affordability. For this Diwali buy online crackers wholesale price with 80% discount for special crackers like{" "}
                <Link to="/catalog" className="text-[#A80000] font-bold underline hover:text-red-800">
                  skyshot, aerial fire works
                </Link>
                .
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-4">
              <Link
                to="/quick-enquiry"
                className="bg-[#A80000] hover:bg-red-800 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all inline-flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Order Online with 80% Off
              </Link>
              <Link
                to="/price-list"
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Check Price List
              </Link>
            </div>
          </div>
        </section>

        {/* Story of Sivakasi Section */}
        <section className="py-12 md:py-20 px-4 max-w-6xl mx-auto">
          <div className="bg-gradient-to-b from-white to-gray-50 rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl border border-gray-200 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#A80000] flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[#A80000] text-xs font-black uppercase tracking-widest">Heritage & Origin</span>
                <h2 className="text-2xl sm:text-4xl font-black uppercase text-gray-900">
                  Story of Sivakasi
                </h2>
              </div>
            </div>

            <div className="space-y-6 text-gray-700 text-sm sm:text-base leading-relaxed font-medium">
              <p>
                Sivakasi, a city nestled in Tamil Nadu's Virudhunagar district, stands as the unrivaled hub for fireworks and crackers production in India and the broader Asian market. Renowned for its superior quality, Sivakasi's crackers have become a global sensation, gracing celebrations ranging from the grandeur of Diwali to the excitement of New Year's festivities, the charm of weddings, and the delight of birthdays.
              </p>

              <p>
                During the festive season, particularly Diwali, Sivakasi experiences a surge in visitors from every corner of the nation. These travelers are drawn by the irresistible allure of Sivakasi crackers, which illuminate the sky with vivid colors and resonate with joyous sounds, making it an experience worth traveling miles for.
              </p>

              <p>
                Yet, venturing to Sivakasi during peak festival times can prove to be a challenging ordeal, marked by congested roads, bustling crowds, and unpredictable weather conditions. As dedicated owners of a reputable crackers business, we empathize with the difficulties our cherished customers face when procuring Sivakasi's finest in person. Thus, we have taken the proactive step of launching our{" "}
                <Link to="/quick-enquiry" className="text-[#A80000] font-bold underline hover:text-red-800">
                  online crackers emporium
                </Link>
                .
              </p>

              <p>
                Our online platform is an extension of our commitment to quality and convenience. It offers you effortless access to the exquisite world of Sivakasi crackers, allowing you to savor their brilliance without the inconveniences of travel and crowded marketplaces. Rest assured, our pledge is to not only meet but exceed your expectations by delivering the finest Sivakasi crackers directly to your doorstep.
              </p>

              <div className="bg-amber-50 border border-amber-200/70 p-6 rounded-2xl mt-6">
                <p className="text-amber-950 font-bold text-base sm:text-lg leading-relaxed">
                  With our online store, your celebrations are poised to be nothing short of extraordinary, illuminated by the unparalleled radiance and joy that only Sivakasi crackers can bestow.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner Section */}
        <section className="pb-16 px-4 md:px-8 bg-transparent max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-[#F4C542] via-[#E8B830] to-[#D4A31C] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl border border-[#F4C542]/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="text-left space-y-2">
              <span className="text-[#A80000] text-xs font-black uppercase tracking-widest">Diwali 2025 Special</span>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-[#A80000] uppercase tracking-wide">
                Ready for a Grand Celebration?
              </h3>
              <p className="text-amber-950 font-bold text-xs md:text-sm">
                Get Sivakasi's premium fireworks delivered straight to your doorstep at wholesale prices.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto shrink-0 z-10">
              <Link
                to="/quick-enquiry"
                className="w-full sm:w-auto text-center bg-[#A80000] hover:bg-red-800 text-white px-7 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:scale-[1.02] transition-all"
              >
                Order Now
              </Link>
              <Link
                to="/price-list"
                className="w-full sm:w-auto text-center bg-white hover:bg-gray-50 text-gray-900 px-7 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:scale-[1.02] transition-all border border-gray-200"
              >
                Download Price List
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

