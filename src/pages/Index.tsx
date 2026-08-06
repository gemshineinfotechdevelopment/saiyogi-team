import { Link } from "react-router-dom";
import { Play, Pause, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import banner1 from "@/assets/banner1.png";
import banner2 from "@/assets/banner2.png";
import banner3 from "@/assets/banner3.png";
import { useState, useEffect } from "react";
import { getProducts, getCategories, getBrands, Brand } from "@/lib/api";
import { Product, Category } from "@/data/products";
import { getUpcomingDiwaliInfo, calculateTimeLeft, UpcomingDiwaliInfo } from "@/lib/diwaliCountdown";
import { Fireworks } from '@fireworks-js/react';
import ProductCard from "@/components/ProductCard";

// Static Data based on the design
const staticBestSellers = [
  { id: 1, name: "Whistling Birds", price: 240, image: "/sky_rocket_box.png" },
  { id: 2, name: "Flower Pots Big", price: 450, image: "/flower_pots.png" },
  { id: 3, name: "1000 Wala", price: 1200, image: "/sky_rocket_box.png" },
  { id: 4, name: "King Of Kings", price: 350, image: "/flower_pots.png" },
  { id: 5, name: "Twinkling Star", price: 150, image: "/sky_rocket_box.png" },
  { id: 6, name: "Chakkra Special", price: 280, image: "/flower_pots.png" },
];

const staticFamilyPacks = [
  { id: 7, name: "Mega Family Pack", oldPrice: 4500, price: 3200, image: "/sky_rocket_box.png" },
  { id: 8, name: "Grand Celebration Combo", oldPrice: 6000, price: 4500, image: "/flower_pots.png" },
  { id: 9, name: "Sky Show Magic", oldPrice: 7500, price: 5500, image: "/sky_rocket_box.png" },
  { id: 10, name: "Classic Family Pack", oldPrice: 3000, price: 2100, image: "/flower_pots.png" },
  { id: 11, name: "Royal Festival Pack", oldPrice: 10000, price: 7200, image: "/sky_rocket_box.png" },
  { id: 12, name: "Kids Joy Cracker", oldPrice: 2000, price: 1500, image: "/flower_pots.png" },
];

const premiumCategories = [
  { name: "Sparklers", image: "/flower_pots.png", categoryId: "cat-1" },
  { name: "Flower Pots", image: "/sky_rocket_box.png", categoryId: "cat-2" },
  { name: "Rockets & Sky Shots", image: "/sky_rocket_box.png", categoryId: "cat-3" },
  { name: "Ground Chakkars", image: "/flower_pots.png", categoryId: "cat-4" },
  { name: "Combo Packs", image: "/family_star_kit.png", categoryId: "cat-5" },
  { name: "Gift Boxes", image: "/bestseller_pack.png", categoryId: "all" },
];

const manufacturers = [
  { name: "STANDARD", logo: "S" },
  { name: "AJANTA", logo: "A" },
  { name: "CORONATION", logo: "C" },
  { name: "VADIVEL", logo: "V" },
  { name: "ANIL", logo: "AN" },
  { name: "SONY", logo: "SF" },
];

const demoVideos = [
  {
    id: 1,
    title: "Golden Fountain Flowerpot",
    url: "https://assets.mixkit.co/videos/preview/mixkit-bright-fireworks-in-the-night-sky-40292-large.mp4",
    thumbnail: "/fireworks_bg.png"
  },
  {
    id: 2,
    title: "Sky Shot Aerial Display",
    url: "https://assets.mixkit.co/videos/preview/mixkit-fireworks-illuminating-the-dark-sky-40291-large.mp4",
    thumbnail: "/fireworks_bg.png"
  },
  {
    id: 3,
    title: "Colorful Garland Celebration",
    url: "https://assets.mixkit.co/videos/preview/mixkit-dramatic-fireworks-display-in-the-night-sky-40293-large.mp4",
    thumbnail: "/fireworks_bg.png"
  },
  {
    id: 4,
    title: "Sparkling Stars Close Up",
    url: "https://assets.mixkit.co/videos/preview/mixkit-sparks-from-a-sparkler-40295-large.mp4",
    thumbnail: "/fireworks_bg.png"
  },
  {
    id: 5,
    title: "Ultimate Night Celebration",
    url: "https://assets.mixkit.co/videos/preview/mixkit-bright-fireworks-in-the-night-sky-40292-large.mp4",
    thumbnail: "/fireworks_bg.png"
  },
  {
    id: 6,
    title: "Vibrant Ring Aerial Shot",
    url: "https://assets.mixkit.co/videos/preview/mixkit-fireworks-illuminating-the-dark-sky-40291-large.mp4",
    thumbnail: "/fireworks_bg.png"
  },
  {
    id: 7,
    title: "Ground Crackling Sparklers",
    url: "https://assets.mixkit.co/videos/preview/mixkit-sparks-from-a-sparkler-40295-large.mp4",
    thumbnail: "/fireworks_bg.png"
  },
  {
    id: 8,
    title: "Dazzling Rainbow Fountain",
    url: "https://assets.mixkit.co/videos/preview/mixkit-dramatic-fireworks-display-in-the-night-sky-40293-large.mp4",
    thumbnail: "/fireworks_bg.png"
  }
];

const shopByBrands = [
  { name: "Standard", subtitle: "Standard Fireworks", tag: "Most Popular", image: "/sky_rocket_box.png" },
  { name: "Ajanta", subtitle: "Ajanta Pyrotechnics", tag: "Top Quality", image: "/flower_pots.png" },
  { name: "Coronation", subtitle: "Coronation Sparklers", tag: "High Demand", image: "/bestseller_pack.png" },
  { name: "Vadivel", subtitle: "Vadivel Fireworks", tag: "Sivakasi Original", image: "/grand_sky_delight.png" },
  { name: "Sony", subtitle: "Sony Crackers", tag: "Festive Special", image: "/family_star_kit.png" },
  { name: "Kaliswari", subtitle: "Sri Kaliswari Cock", tag: "Heritage Brand", image: "/royal_celebration.png" },
];

const Index = () => {
  const { settings } = useSiteSettings();
  const { items: cartItems, addToCart, updateQuantity } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);
  const [videoIndex, setVideoIndex] = useState(0);
  const [comboIndex, setComboIndex] = useState(0);

  // Hero image slideshow (right-to-left slide)
  const heroImages = [banner1, banner2, banner3];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideKey, setSlideKey] = useState(0);

  // Dynamic Diwali date & Live countdown
  const [diwaliInfo, setDiwaliInfo] = useState<UpcomingDiwaliInfo>(() => getUpcomingDiwaliInfo());
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(diwaliInfo.targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((cur) => {
        const next = (cur + 1) % heroImages.length;
        setSlideKey((k) => k + 1);
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    const updateCountdown = () => {
      const info = getUpcomingDiwaliInfo();
      setDiwaliInfo(info);
      setTimeLeft(calculateTimeLeft(info.targetDate));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getProducts().then((prods) => {
      setProducts(Array.isArray(prods) ? prods : []);
    });
    getCategories().then((cats) => {
      setCategories(Array.isArray(cats) ? cats : []);
    });
    getBrands().then((b) => {
      setBrands(Array.isArray(b) ? b.filter((brand) => brand.isActive !== false) : []);
    });
  }, []);

  // Custom Canvas for Hyper-Realistic Flower Pots
  useEffect(() => {
    const canvas = document.getElementById('fountain-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    let particles: any[] = [];
    let saravediParticles: any[] = [];
    
    const createFlowerPotParticle = (x: number, y: number) => {
      const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6;
      const speed = Math.random() * 9 + 5;
      particles.push({
        x, y,
        vx: Math.sin(angle) * speed,
        vy: -Math.cos(angle) * speed,
        life: 1,
        decay: Math.random() * 0.015 + 0.008,
        color: Math.random() > 0.3 ? '255, 215, 0' : '255, 140, 0'
      });
    };
    
    const createSaravediParticle = (x: number, y: number) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      saravediParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: Math.random() * 0.04 + 0.02,
        color: Math.random() > 0.5 ? '255, 50, 50' : '255, 220, 0'
      });
    };

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (Math.random() < 0.8) {
        const sx = canvas.width / 2;
        const sy = canvas.height - 20;
        for (let i = 0; i < 4; i++) {
          createFlowerPotParticle(sx, sy);
        }
      }

      if (Math.random() < 0.15) {
        const sx = Math.random() * canvas.width;
        const sy = canvas.height - Math.random() * 50;
        for (let i = 0; i < 15; i++) {
          createSaravediParticle(sx, sy);
        }
      }
      
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.15;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
        ctx.strokeStyle = `rgba(${p.color}, ${p.life})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      for (let i = saravediParticles.length - 1; i >= 0; i--) {
        const p = saravediParticles[i];
        p.vy += 0.1;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        
        if (p.life <= 0) {
          saravediParticles.splice(i, 1);
          continue;
        }
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
        ctx.fill();
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white relative font-sans">
      <UserHeader />

      {/* Real Crackers Animation Overlay */}
      <Fireworks
        options={{
          opacity: 0.5,
          particles: 80,
          explosion: 5,
          intensity: 15,
          friction: 0.97,
          gravity: 1.5,
          acceleration: 1.05,
          hue: { min: 0, max: 360 },
        }}
        style={{
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 40,
        }}
      />

      {/* Hero Section */}
      <section className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[600px] min-h-[220px] flex items-center justify-center overflow-hidden bg-black">
        <img
          key={`enter-${slideKey}`}
          src={heroImages[currentSlide]}
          alt="Sai Yogi Crackers Festival Banner"
          className="w-full h-full object-cover object-center hero-slide-enter opacity-100"
        />
      </section>

      {/* Best Sellers */}
      <section className="py-12 container mx-auto px-4 max-w-6xl overflow-hidden">
        <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-2">
          <h2 className="text-xl md:text-2xl font-black text-[#A80000] uppercase tracking-widest relative font-display">
            Best Sellers
            <div className="absolute -bottom-2.5 left-0 w-1/2 h-0.5 bg-[#A80000]"></div>
          </h2>
          <Link to="/catalog" className="text-red-600 font-bold text-xs hover:underline uppercase">View All &gt;</Link>
        </div>
        {/* Infinite scrolling marquee from right to left */}
        <div className="relative w-full overflow-hidden py-4">
          <div className="flex flex-nowrap gap-6 animate-marquee hover:[animation-play-state:paused] w-max select-none">
            {[...(products.length > 0 ? products : staticBestSellers), ...(products.length > 0 ? products : staticBestSellers), ...(products.length > 0 ? products : staticBestSellers)].map((item: any, index: number) => {
              const itemId = item.id || item._id;
              return (
                <div key={`${itemId}-${index}`} className="min-w-[260px] max-w-[260px] shrink-0">
                  <ProductCard product={item} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Videos Section */}
      <section className="py-16 bg-gradient-to-b from-white to-[#FFF6E5]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <span className="bg-[#A80000]/10 text-[#A80000] text-[10px] font-black px-3.5 py-1.5 uppercase tracking-widest mb-3 inline-block rounded-full">
              ✨ Watch the Magic ✨
            </span>
            <h2 className="font-black text-[#A80000] text-2xl uppercase tracking-widest mb-2 font-display">
              Fireworks Showcase
            </h2>
            <p className="text-gray-500 text-xs mt-2 max-w-md mx-auto">
              Click on any card to watch our premium Sivakasi crackers light up the night sky!
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            {/* Left Button */}
            <button
              onClick={() => setVideoIndex((prev) => (prev - 1 + demoVideos.length) % demoVideos.length)}
              className="absolute -left-4 md:-left-8 z-20 w-10 h-10 rounded-full bg-white text-[#A80000] border border-gray-200 flex items-center justify-center shadow-lg hover:bg-[#F4C542] hover:text-[#1A1A1A] transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Video Card Showcase */}
            <div className="w-full max-w-xl bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-[#F4C542]/30 relative aspect-video flex items-center justify-center">
              <video
                src={demoVideos[videoIndex].url}
                poster={demoVideos[videoIndex].thumbnail}
                controls
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Button */}
            <button
              onClick={() => setVideoIndex((prev) => (prev + 1) % demoVideos.length)}
              className="absolute -right-4 md:-right-8 z-20 w-10 h-10 rounded-full bg-white text-[#A80000] border border-gray-200 flex items-center justify-center shadow-lg hover:bg-[#F4C542] hover:text-[#1A1A1A] transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
      {/* Categories Grid */}
      <section className="py-16 bg-[#FFF8EE] border-b border-amber-100/50">
        <div className="text-center mb-10 container mx-auto px-4">
          <span className="bg-[#A80000]/10 text-[#A80000] text-[10px] font-black px-3.5 py-1.5 uppercase tracking-widest mb-3 inline-block rounded-full">
            ✨ POPULAR CATEGORIES ✨
          </span>
          <h2 className="font-black text-[#A80000] text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight mb-2 font-display">
            Explore Categories
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto font-medium">
            Discover our vast range of Sivakasi fireworks tailored for all your celebrations.
          </p>
        </div>

        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {(categories.length > 0 ? categories : premiumCategories).map((cat: any, i: number) => (
              <div 
                key={cat.id || cat._id || i} 
                onClick={() => window.location.href=`/catalog?category=${cat.id || cat._id || cat.categoryId || 'all'}`} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-amber-100 flex flex-col items-center p-4 cursor-pointer group hover:-translate-y-1 w-[calc(50%-8px)] sm:w-[170px] lg:w-[175px] shrink-0"
              >
                <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-b from-amber-50/50 to-orange-50/20 rounded-xl p-3 mb-3 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                  <img src={cat.image || "/sky_rocket_box.png"} alt={cat.name} className="max-w-full max-h-full object-contain drop-shadow-md" />
                  <span className="absolute top-2 right-2 bg-[#7A1416] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full opacity-90">Hot</span>
                </div>
                <h3 className="font-extrabold text-xs sm:text-sm text-gray-800 uppercase text-center group-hover:text-[#7A1416] transition-colors">{cat.name}</h3>
                <p className="text-[11px] text-amber-700 font-semibold mt-1">Explore →</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Manufacturers */}
      <section className="py-16 bg-gradient-to-b from-white to-[#FFF6E5]">
        <div className="text-center mb-10">
          <span className="bg-[#A80000]/10 text-[#A80000] text-[10px] font-black px-3.5 py-1.5 uppercase tracking-widest mb-3 inline-block rounded-full">
            ⭐ AUTHENTIC PARTNERS ⭐
          </span>
          <h2 className="font-black text-[#A80000] text-2xl uppercase tracking-widest mb-2 font-display">Trusted Manufacturers</h2>
          <p className="text-gray-500 text-xs mt-1">We are supplying high quality fireworks from top brands in Sivakasi.</p>
        </div>

        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-wrap justify-center gap-6">
            {manufacturers.map((brand, i) => (
              <div 
                key={i} 
                className="bg-white border-2 border-gray-100/80 rounded-2xl px-6 py-4 flex items-center gap-4 min-w-[200px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-xl hover:border-[#A80000]/30 transition-all duration-300 hover:-translate-y-1 hover:bg-gradient-to-br hover:from-[#A80000] hover:to-[#8a0000] hover:text-white group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A80000] to-[#750000] text-white flex items-center justify-center font-black text-xs tracking-wider shrink-0 transition-all duration-300 group-hover:from-[#F4C542] group-hover:to-[#d4a215] group-hover:text-[#1A1A1A]">
                  {brand.logo}
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-black text-[9px] text-[#A80000]/80 tracking-widest uppercase transition-colors duration-300 group-hover:text-[#F4C542]">
                    PARTNER
                  </span>
                  <span className="font-black text-sm text-gray-800 tracking-wider uppercase transition-colors duration-300 group-hover:text-white">
                    {brand.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop By Brand */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="text-center mb-10 container mx-auto px-4">
          <h2 className="font-black text-[#7A1416] text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight mb-2 drop-shadow-2xs font-display">
            Shop By Brand
          </h2>
          <div className="w-24 h-1 bg-[#7A1416] mx-auto rounded-full mb-3"></div>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto font-medium">
            We supply 100% genuine and high quality fireworks directly from Sivakasi's top trusted manufacturers.
          </p>
        </div>

        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {(brands.length > 0
              ? brands
              : shopByBrands
            ).map((brand: any, i: number) => (
              <div 
                key={brand._id || brand.id || i} 
                onClick={() => window.location.href=`/catalog?search=${encodeURIComponent(brand.name)}`}
                className="bg-gradient-to-b from-white to-amber-50/30 border border-gray-200 hover:border-[#7A1416] rounded-2xl p-4 flex flex-col items-center justify-between text-center shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1 w-[calc(50%-8px)] sm:w-[170px] lg:w-[175px] shrink-0"
              >
                <span className="text-[9px] font-extrabold text-[#7A1416] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full mb-2 font-mono">
                  {brand.tag || "BRAND"}
                </span>
                <div className="w-full aspect-square flex items-center justify-center p-2 mb-2 group-hover:scale-105 transition-transform duration-300">
                  <img src={brand.logo || brand.image || "/sky_rocket_box.png"} alt={brand.name} className="max-w-full max-h-full object-contain drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-800 uppercase tracking-wide group-hover:text-[#7A1416] transition-colors">{brand.name}</h3>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">{brand.subtitle || brand.description || "Original Sivakasi"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Combo Packs (formerly Family Packs) */}
      <section className="py-16 bg-[#FFF6E5]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <span className="bg-[#A80000]/10 text-[#A80000] text-[10px] font-black px-3.5 py-1.5 uppercase tracking-widest mb-3 inline-block rounded-full">
              🎁 GREAT VALUE COMBOS 🎁
            </span>
            <h2 className="font-black text-[#A80000] text-2xl uppercase tracking-widest mb-2 font-display">Combo Packs</h2>
            <p className="text-gray-700 text-xs font-bold uppercase">Our Special combo packages for you and your whole family</p>
          </div>

          <div className="relative flex items-center justify-center">
            {/* Left Button */}
            <button
              onClick={() => setComboIndex((prev) => {
                const comboPacksList = products.filter(p => p.name.toLowerCase().includes('combo') || p.name.toLowerCase().includes('pack')).length > 0
                  ? products.filter(p => p.name.toLowerCase().includes('combo') || p.name.toLowerCase().includes('pack'))
                  : staticFamilyPacks;
                return (prev - 1 + comboPacksList.length) % comboPacksList.length;
              })}
              className="absolute -left-4 md:-left-8 z-20 w-10 h-10 rounded-full bg-white text-[#A80000] border border-gray-200 flex items-center justify-center shadow-lg hover:bg-[#F4C542] hover:text-[#1A1A1A] transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full px-4">
              {[0, 1, 2].map((offset) => {
                const comboPacksList = products.filter(p => p.name.toLowerCase().includes('combo') || p.name.toLowerCase().includes('pack')).length > 0
                  ? products.filter(p => p.name.toLowerCase().includes('combo') || p.name.toLowerCase().includes('pack'))
                  : staticFamilyPacks;
                
                const idx = (comboIndex + offset) % comboPacksList.length;
                const item = comboPacksList[idx] as any;
                const itemId = item.id || item._id;
                const cartItem = cartItems.find((i) => (i.product._id || i.product.id) === itemId);
                const quantity = cartItem?.quantity || 0;

                return (
                  <div 
                    key={`${itemId}-${offset}`} 
                    className="bg-white/45 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xl flex flex-col justify-between items-center text-center transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:border-[#F4C542]/40 group cursor-pointer relative overflow-hidden h-[460px] w-full"
                    onClick={() => window.location.href=`/catalog`}
                  >
                    <div className="w-full aspect-[4/3] bg-gray-50/50 rounded-2xl flex items-center justify-center p-2 mb-4 overflow-hidden shrink-0 h-44 border border-gray-100">
                      <img 
                        src={item.image || "/sky_rocket_box.png"} 
                        alt={item.name} 
                        className="max-w-full max-h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                    </div>
                    <h3 className="font-black text-sm text-gray-900 uppercase mb-2 group-hover:text-[#A80000] transition-colors">{item.name}</h3>
                    <div className="flex gap-2 items-center mb-6">
                      {item.oldPrice && (
                        <span className="text-gray-400 line-through text-xs font-bold">₹{item.oldPrice}</span>
                      )}
                      <span className="text-[#A80000] font-black text-lg">₹{item.price}</span>
                    </div>

                    {quantity > 0 ? (
                      <div className="flex items-center justify-between bg-red-50/50 border border-red-200/50 rounded-xl p-1.5 w-full mt-auto" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => updateQuantity(itemId, quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-[#A80000] font-black hover:bg-red-50 transition-colors shadow-sm"
                        >
                          -
                        </button>
                        <span className="font-black text-sm text-[#A80000] px-2">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(itemId, quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#A80000] text-white font-black hover:bg-red-800 transition-colors shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        className="w-full bg-[#A80000] hover:bg-[#F4C542] hover:text-[#1A1A1A] text-white font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] mt-auto"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add To Cart</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Button */}
            <button
              onClick={() => setComboIndex((prev) => {
                const comboPacksList = products.filter(p => p.name.toLowerCase().includes('combo') || p.name.toLowerCase().includes('pack')).length > 0
                  ? products.filter(p => p.name.toLowerCase().includes('combo') || p.name.toLowerCase().includes('pack'))
                  : staticFamilyPacks;
                return (prev + 1) % comboPacksList.length;
              })}
              className="absolute -right-4 md:-right-8 z-20 w-10 h-10 rounded-full bg-white text-[#A80000] border border-gray-200 flex items-center justify-center shadow-lg hover:bg-[#F4C542] hover:text-[#1A1A1A] transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Premium Quality Cards Section (Visual Banner representation from reference) */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Banner Card 1 */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#A80000] to-[#750000] p-8 text-white shadow-xl hover:scale-[1.02] transition-transform duration-300 flex items-center justify-between min-h-[180px]">
              <div className="max-w-[60%] flex flex-col items-start gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase text-[#F4C542] bg-[#A80000]/30 px-2.5 py-1 rounded">
                  Premium Quality
                </span>
                <h3 className="text-lg font-black uppercase tracking-wide leading-tight">
                  Best Quality from Verified Manufacturers
                </h3>
              </div>
              <div className="relative border-4 border-[#F4C542] rounded-full bg-white flex flex-col items-center justify-center text-center w-24 h-24 shadow-[0_0_20px_rgba(244,197,66,0.3)] shrink-0 select-none">
                <span className="text-[9px] font-black text-[#A80000] tracking-wider uppercase font-display leading-none">SAI YOGI</span>
                <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">CRACKERS</span>
              </div>
            </div>

            {/* Banner Card 2 */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#111111] p-8 text-white shadow-xl hover:scale-[1.02] transition-transform duration-300 flex items-center justify-between min-h-[180px]">
              <div className="max-w-[60%] flex flex-col items-start gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase text-[#F4C542] bg-white/10 px-2.5 py-1 rounded">
                  Trusted Partners
                </span>
                <h3 className="text-lg font-black uppercase tracking-wide leading-tight">
                  We collab with Top Partners from Sivakasi
                </h3>
              </div>
              <div className="relative border-4 border-[#F4C542] rounded-full bg-white flex flex-col items-center justify-center text-center w-24 h-24 shadow-[0_0_20px_rgba(244,197,66,0.3)] shrink-0 select-none">
                <span className="text-[9px] font-black text-[#A80000] tracking-wider uppercase font-display leading-none">SAI YOGI</span>
                <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">CRACKERS</span>
              </div>
            </div>

            {/* Banner Card 3 */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#D4A316] to-[#A37B0C] p-8 text-[#1A1A1A] shadow-xl hover:scale-[1.02] transition-transform duration-300 flex items-center justify-between min-h-[180px]">
              <div className="max-w-[60%] flex flex-col items-start gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase text-white bg-black/20 px-2.5 py-1 rounded">
                  Authentic Brands
                </span>
                <h3 className="text-lg font-black uppercase tracking-wide leading-tight text-[#1A1A1A]">
                  We are Selling Crackers from Authentic Brands
                </h3>
              </div>
              <div className="relative border-4 border-white rounded-full bg-white flex flex-col items-center justify-center text-center w-24 h-24 shadow-lg shrink-0 select-none">
                <span className="text-[9px] font-black text-[#A80000] tracking-wider uppercase font-display leading-none">SAI YOGI</span>
                <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">CRACKERS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Diwali Celebration Countdown */}
      <section className="py-20 bg-gradient-to-br from-[#A80000] via-[#5c0a0b] to-[#1A1A1A] border-y border-[#F4C542]/20 relative overflow-hidden">
        {/* Glowing sparkles background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="text-center mb-12 relative z-10">
          <span className="bg-[#F4C542] text-[#1A1A1A] text-[10px] font-black px-3.5 py-1.5 uppercase tracking-widest mb-3 inline-block rounded-full shadow-md">
            💥 countdown to lights 💥
          </span>
          <h2 className="font-black text-white text-3xl md:text-4xl uppercase tracking-widest mb-2 font-display">
            Diwali Celebration {diwaliInfo.year}
          </h2>
          <p className="text-gray-300 text-xs font-semibold uppercase tracking-wider">
            Celebrate the festival of lights on {diwaliInfo.formattedDate}
          </p>
        </div>

        <div className="flex justify-center gap-4 md:gap-8 relative z-10">
          {[
            { label: "Days", val: timeLeft.days },
            { label: "Hrs", val: timeLeft.hours },
            { label: "Min", val: timeLeft.minutes },
            { label: "Sec", val: timeLeft.seconds },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border border-white/30 bg-gradient-to-br from-white/20 via-white/10 to-[#F4C542]/10 backdrop-blur-md flex flex-col items-center justify-center mb-2 shadow-2xl transition-all duration-300 hover:scale-105 hover:border-[#F4C542] hover:shadow-[#F4C542]/20 relative overflow-hidden group">
                <span className="font-black text-[#F4C542] text-2xl md:text-3xl tracking-tight">
                  {String(item.val).padStart(2, '0')}
                </span>
                <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <UserFooter />
    </div>
  );
};

export default Index;
