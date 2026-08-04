import { Link } from "react-router-dom";
import { Award, ShieldCheck, Tag, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import tomJerry from "@/assets/tom-jerry.jpeg";
import narendira1 from "@/assets/narendira1.png";
import narendira2 from "@/assets/narendira2.png";
import { useState, useEffect } from "react";
import { getCategories, getProducts } from "@/lib/api";
import { Category } from "@/data/products";

const Index = () => {
  const { settings } = useSiteSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Hero image slideshow (right-to-left slide)
  const heroImages = [narendira1, narendira2];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
  const [slideKey, setSlideKey] = useState(0); // force re-mount to retrigger animation

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((cur) => {
        const next = (cur + 1) % heroImages.length;
        setPrevSlide(cur);
        setSlideKey((k) => k + 1);
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([getCategories(), getProducts()])
      .then(([cats, prods]) => {
        const updatedCats = cats.map(cat => {
          const count = prods.filter(p => {
            const productCat = p.category as any;
            const productCatId = typeof productCat === 'object' && productCat !== null ? (productCat._id || productCat.id || productCat) : productCat;
            return productCatId === (cat._id || cat.id);
          }).length;
          return {
            ...cat,
            productCount: count
          };
        });
        setCategories(updatedCats);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading categories or products:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white relative">
      <UserHeader />

      {/* Floating Discount Badge */}
      {settings.discountPercent > 0 && (
        <div className="fixed left-0 top-1/3 z-50 pointer-events-none select-none">
          <Link
            to="/catalog"
            className="bg-gradient-to-r from-[#ED1C24] to-red-700 text-white font-display px-3 py-4 rounded-r-2xl shadow-[0_8px_30px_rgba(237,28,36,0.3)] border-y border-r border-yellow-400/40 flex flex-col items-center gap-1 origin-left animate-blink pointer-events-auto transition-transform hover:scale-105 duration-200"
          >
            <span className="text-[9px] md:text-[11px] text-yellow-300 uppercase tracking-widest font-black">Diwali</span>
            <span className="text-base md:text-2xl text-white font-black leading-none drop-shadow-sm">{settings.discountPercent}%</span>
            <span className="text-[9px] md:text-[11px] text-yellow-300 uppercase font-black tracking-widest leading-none">OFF</span>
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative w-full h-[280px] md:h-[900px] flex items-center justify-center overflow-hidden">
        {/* Hero image slideshow — above background, below dark overlay */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Exiting slide */}
          {prevSlide !== null && (
            <img
              key={`exit-${slideKey}`}
              src={heroImages[prevSlide]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top hero-slide-exit"
              aria-hidden="true"
            />
          )}
          {/* Entering slide */}
          <img
            key={`enter-${slideKey}`}
            src={heroImages[currentSlide]}
            alt="Narendiraa Enterprises"
            className="absolute inset-0 w-full h-full object-cover object-top hero-slide-enter"
          />
        </div>

        {/* Floating WhatsApp */}
        <a href="https://wa.me/919585975756" target="_blank" rel="noopener noreferrer" className="absolute bottom-6 right-6 bg-[#25D366] text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-transform">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
        </a>
      </section>

      {/* News Marquee */}
      {settings.news && (
        <div className="bg-[#ED1C24] text-white py-1.5 md:py-2 overflow-hidden flex items-center font-bold text-[10px] md:text-sm tracking-wide shadow-md z-20 relative">
          <div className="whitespace-nowrap animate-marquee flex items-center">
            <span className="mx-4">🔔</span>
            {settings.news}
            <span className="mx-4">🔔</span>
            {settings.news}
            <span className="mx-4">🔔</span>
            {settings.news}
          </div>
        </div>
      )}

      <section className="w-full bg-white py-6 px-4 text-center">
        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 leading-tight tracking-wider uppercase mb-1">
          Narendiraa
        </h1>
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black text-[#FFD700] leading-tight tracking-wide md:tracking-widest uppercase mb-4" style={{WebkitTextStroke: '1px #b8960c'}}>
          Enterprises
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm md:text-base mb-6 max-w-xs sm:max-w-lg mx-auto font-medium tracking-wide">
          Premium fireworks handcrafted in Sivakasi, designed to turn every moment into a golden memory.
        </p>
        <Button asChild className="bg-[#ED1C24] hover:bg-red-800 text-white font-bold h-12 px-10 rounded-full text-xs tracking-wider transition-all shadow-lg hover:shadow-xl uppercase">
          <Link to="/catalog">Shop Now</Link>
        </Button>
      </section>


      {/* The Legacy Section */}
      <section className="relative w-full overflow-hidden bg-[#fafafa]">
        <div className="absolute inset-0 z-0">
          <img src="/fireworks_bg.png" alt="Fireworks" className="w-full h-full object-cover opacity-60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>

        <div className="container relative z-10 py-16 md:py-24">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            {/* Left text */}
            <div className="lg:w-1/3 bg-white/95 backdrop-blur p-6 sm:p-8 rounded-xl shadow-2xl border border-gold/20">
              <h2 className="font-display text-sm sm:text-2xl font-bold text-gray-800 uppercase tracking-wider sm:tracking-widest mb-1">The Legacy Of</h2>
              <h2 className="font-display text-base sm:text-2xl font-black text-[#FFD700] uppercase tracking-wider sm:tracking-widest mb-6">Narendraa Enterprises</h2>

              <p className="text-gray-600 text-sm leading-relaxed mb-4 font-medium">
                With 20+ years of excellence in Sivakasi, Narendiraa Enterprises brings the prestige of Narendraa Enterprises to your door step. We are the leading supplier of fancy crackers, committed to unmatched quality and safety.
              </p>
            </div>

            {/* Right Images */}
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              <div className="relative group rounded-2xl overflow-hidden shadow-2xl transform transition-transform hover:-translate-y-2">
                <img src="/sky_rocket_box.png" alt="Aerial Sky Shots" className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 text-left">
                  <h3 className="font-display text-white font-bold text-xl uppercase tracking-wider mb-1">Aerial Sky Shots</h3>
                  <p className="text-gray-300 text-xs mb-4">Multi-color bursts illuminating the night sky with grandeur.</p>
                  <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-black font-bold text-[10px] px-6 h-8 rounded-full uppercase tracking-wider">
                    <Link to="/catalog">Explore Range</Link>
                  </Button>
                </div>
              </div>

              <div className="relative group rounded-2xl overflow-hidden shadow-2xl transform transition-transform hover:-translate-y-2 mt-0 md:mt-12">
                <img src="/flower_pots.png" alt="Golden Flower Pots" className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 text-left">
                  <h3 className="font-display text-white font-bold text-xl uppercase tracking-wider mb-1">Golden Flower Pots</h3>
                  <p className="text-gray-300 text-xs mb-4">Traditional brilliant spark fountains that last longer and burn brighter.</p>
                  <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-black font-bold text-[10px] px-6 h-8 rounded-full uppercase tracking-wider">
                    <Link to="/catalog">Explore Range</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop By Category */}
      <section className="py-16 bg-gray-50/50 border-y border-gray-100">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-widest">
            Shop By Category
          </h2>
          <div className="h-1 w-12 bg-red-600 mx-auto mt-3 rounded-full"></div>
        </div>

        <div className="container px-4">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <>
              {/* Mobile View: Auto-sliding Carousel */}
              <div className="block md:hidden overflow-hidden w-full">
                <div className="flex gap-4 py-2 w-max animate-category-slide">
                  {[...categories, ...categories].map((cat, index) => (
                    <Link
                      key={`${cat._id || cat.id}-slide-${index}`}
                      to={`/catalog?category=${cat._id || cat.id}`}
                      className="flex-none w-[140px] bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.01)] flex flex-col items-center text-center"
                    >
                      {/* Image Container */}
                      <div className="w-20 h-20 flex items-center justify-center mb-3 bg-slate-50/50 rounded-xl overflow-hidden p-1.5">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="text-gray-300 font-bold text-[10px] uppercase">No Image</div>
                        )}
                      </div>

                      {/* Text Container */}
                      <h3 className="font-display font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-0.5 line-clamp-1">
                        {cat.name}
                      </h3>
                      <p className="text-[9px] text-gray-400 font-medium">
                        {cat.productCount} {cat.productCount === 1 ? "item" : "items"}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Desktop View: Static Flex Layout */}
              <div className="hidden md:flex flex-wrap justify-center gap-6 py-2">
                {categories.map((cat) => (
                  <Link
                    key={cat._id || cat.id}
                    to={`/catalog?category=${cat._id || cat.id}`}
                    className="w-[180px] bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.01)] hover:shadow-[0_10px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group"
                  >
                    {/* Image Container */}
                    <div className="w-28 h-28 flex items-center justify-center mb-4 bg-slate-50/50 rounded-xl overflow-hidden p-2 group-hover:scale-105 transition-transform duration-300">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="text-gray-300 font-bold text-xs uppercase">No Image</div>
                      )}
                    </div>

                    {/* Text Container */}
                    <h3 className="font-display font-bold text-slate-800 text-xs uppercase tracking-wider mb-1 line-clamp-1 group-hover:text-red-600 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {cat.productCount} {cat.productCount === 1 ? "item" : "items"}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Our Speciality */}
      <section className="py-10 md:py-20 bg-[#fafafa]">
        <div className="container px-4">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-wider md:tracking-widest">Our Speciality</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto">
            {/* Speciality 1 */}
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 text-slate-800 rounded-full flex items-center justify-center mb-4 md:mb-6">
                <Award className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="font-display font-bold text-slate-800 text-base md:text-lg uppercase tracking-wider mb-2 md:mb-4">Unmatched<br />Quality</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                We use premium ingredients and strict quality control, ensuring vibrant colors and a spectacular display every time you light our crackers.
              </p>
            </div>

            {/* Speciality 2 */}
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 md:mb-6">
                <Tag className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="font-display font-bold text-slate-800 text-base md:text-lg uppercase tracking-wider mb-2 md:mb-4">Genuine Pricing</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                Our products offer unmatched value without compromising on quality, providing you with incredible savings that make your celebrations affordable.
              </p>
            </div>

            {/* Speciality 3 */}
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 text-slate-800 rounded-full flex items-center justify-center mb-4 md:mb-6">
                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="font-display font-bold text-slate-800 text-base md:text-lg uppercase tracking-wider mb-2 md:mb-4">Safe To Use</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                Crafted meticulously by experts, our fireworks guarantee a 100% safe, worry-free, and joyous display every time you light them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tom and Jerry Banner */}
      <section className="w-full py-6 bg-slate-50/50">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 bg-white">
            <img
              src={tomJerry}
              alt="Celebration Banner"
              className="w-full h-auto object-cover hover:scale-[1.01] transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section className="py-12 md:py-20 bg-[#f8fafc]">
        <div className="container px-4 text-center">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl md:rounded-[4rem] px-6 py-10 md:px-12 md:py-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center relative overflow-hidden">
            {/* Decorative faint circle behind */}
            <div className="absolute top-1/2 left-12 -translate-y-1/2 w-24 h-24 rounded-full border border-gray-100 hidden md:block"></div>
            <div className="absolute top-1/2 right-12 -translate-y-1/2 w-24 h-24 rounded-full border border-gray-100 hidden md:block"></div>

            <h2 className="font-display text-xl md:text-3xl font-black text-slate-800 uppercase tracking-wider md:tracking-widest mb-4 z-10">
              Ready to Sparkle This Diwali?
            </h2>
            <p className="text-gray-500 text-xs md:text-sm leading-relaxed mb-8 max-w-xs md:max-w-xl z-10 px-2">
              Get exclusive wholesale rates and bulk discounts on our premium range. Our Diwali sale is now open for pre-bookings. Order now and guarantee a majestic celebration for your loved ones.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 z-10">
              <Button asChild className="bg-[#002366] hover:bg-[#001844] text-white font-bold h-12 px-8 rounded-full text-xs tracking-wider uppercase transition-all shadow-md">
                <Link to="/catalog">View Brochure</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <UserFooter />
    </div>
  );
};

export default Index;
