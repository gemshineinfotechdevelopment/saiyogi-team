import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import banner1 from "@/assets/banner1.png";
import banner2 from "@/assets/banner2.png";
import banner3 from "@/assets/banner3.png";
import { useState, useEffect } from "react";
import { getProducts, getCategories } from "@/lib/api";
import { Product, Category } from "@/data/products";
import { getUpcomingDiwaliInfo, calculateTimeLeft, UpcomingDiwaliInfo } from "@/lib/diwaliCountdown";
import { Fireworks } from '@fireworks-js/react';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

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
      const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6; // Spread
      const speed = Math.random() * 9 + 5; // Slower speed
      particles.push({
        x, y,
        vx: Math.sin(angle) * speed,
        vy: -Math.cos(angle) * speed,
        life: 1,
        decay: Math.random() * 0.015 + 0.008, // Slower decay
        color: Math.random() > 0.3 ? '255, 215, 0' : '255, 140, 0' // Gold / Dark Orange
      });
    };

    const createSaravediParticle = (x: number, y: number) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5; // Slower speed
      saravediParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: Math.random() * 0.04 + 0.02, // Slower decay
        color: Math.random() > 0.5 ? '255, 255, 255' : '255, 69, 0'
      });
    };

    let animationId: number;
    let frameCount = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      frameCount++;
      
      const now = Date.now();
      const cycleTime = now % 8000; // 8 seconds total cycle (5s ON, 3s OFF)
      const isFlowerPotActive = cycleTime < 5000;
      
      // Generate Flower Pot particles continuously from bottom only when active
      if (isFlowerPotActive) {
        for (let i = 0; i < 6; i++) {
          createFlowerPotParticle(canvas.width / 2, canvas.height);
          createFlowerPotParticle(canvas.width / 6, canvas.height);
          createFlowerPotParticle(5 * canvas.width / 6, canvas.height);
        }
      }

      // Generate random Saravedi bursts near the ground every few frames
      if (frameCount % 12 === 0) {
        const sx = Math.random() * canvas.width;
        const sy = canvas.height - Math.random() * 50;
        for (let i = 0; i < 15; i++) {
          createSaravediParticle(sx, sy);
        }
      }
      
      // Update and draw Flower Pot particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.15; // Slower gravity
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

      // Update and draw Saravedi particles
      for (let i = saravediParticles.length - 1; i >= 0; i--) {
        const p = saravediParticles[i];
        p.vy += 0.1; // Light gravity
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
          rocketsPoint: { min: 10, max: 90 },
          hue: { min: 0, max: 360 },
          delay: { min: 50, max: 100 },
          acceleration: 1.02,
          friction: 0.95,
          gravity: 1,
          particles: 70,
          traceLength: 3,
          traceSpeed: 2,
          explosion: 5,
          intensity: 20,
          flickering: 50,
          lineStyle: 'round',
          brightness: { min: 50, max: 80 },
          decay: { min: 0.015, max: 0.03 },
          mouse: { click: false, move: false, max: 1 }
        }}
        style={{
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          position: 'fixed',
          zIndex: 100,
          pointerEvents: 'none'
        }}
      />
      
      {/* Hyper-Realistic Custom Canvas for Flower Pots & Saravedi */}
      <canvas id="fountain-canvas" className="fixed inset-0 pointer-events-none z-[101]" />

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
      <section className="py-12 container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-2">
          <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-widest relative">
            Best Sellers
            <div className="absolute -bottom-2.5 left-0 w-1/2 h-0.5 bg-[#7A1416]"></div>
          </h2>
          <Link to="/catalog" className="text-red-600 font-bold text-xs hover:underline uppercase">View All &gt;</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {products.slice(0, 6).map((item) => (
            <div key={item.id || item._id} className="bg-white border border-gray-200 p-3 flex flex-col items-center text-center shadow-sm cursor-pointer" onClick={() => window.location.href=`/catalog`}>
              <div className="w-full aspect-square bg-gray-50 flex items-center justify-center p-2 mb-3">
                <img src={item.image || "/sky_rocket_box.png"} alt={item.name} className="max-w-full max-h-full object-contain" />
              </div>
              <h3 className="font-bold text-xs text-gray-800 uppercase mb-1 min-h-[32px] line-clamp-2">{item.name}</h3>
              <div className="flex gap-1 mb-2 text-yellow-400">
                {'★★★★★'.split('').map((star, i) => <span key={i} className="text-[10px]">{star}</span>)}
              </div>
              <p className="text-red-600 font-bold text-sm mb-3">₹ {item.price}</p>
              
              <div className="flex items-center gap-2 mt-auto w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center border border-gray-300 rounded text-xs flex-1">
                  <button className="px-2 py-1 text-gray-600 hover:bg-gray-100">-</button>
                  <input type="text" value="1" readOnly className="w-6 text-center outline-none bg-transparent" />
                  <button className="px-2 py-1 text-gray-600 hover:bg-gray-100">+</button>
                </div>
                <button className="bg-[#7A1416] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-800">ADD</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Videos Section */}
      <section className="py-8 bg-gradient-to-b from-white to-[#FDF5E6]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden aspect-video bg-gray-800 group cursor-pointer shadow-lg">
                <img src="/fireworks_bg.png" alt="Video thumbnail" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded flex items-center justify-center group-hover:bg-white/50 transition-colors">
                    <Play className="text-white fill-white w-6 h-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop By Category */}
      <section className="py-16 bg-[#FDF5E6] border-b border-amber-100">
        <div className="text-center mb-10 container mx-auto px-4">
          <h2 className="font-black text-[#7A1416] text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight mb-2 drop-shadow-2xs">
            Shop By Category
          </h2>
          <div className="w-24 h-1 bg-[#7A1416] mx-auto rounded-full mb-3"></div>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto font-medium">
            Explore our wide selection of premium fireworks crafted for the most spectacular and joyful celebration.
          </p>
        </div>
        
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {(categories.length > 0 ? categories : premiumCategories).slice(0, 6).map((cat: any, i: number) => (
              <div 
                key={cat.id || cat._id || i} 
                onClick={() => window.location.href=`/catalog?category=${cat.id || cat._id || cat.categoryId || 'all'}`} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-amber-100 flex flex-col items-center p-4 cursor-pointer group hover:-translate-y-1"
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

      {/* Shop By Brand */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="text-center mb-10 container mx-auto px-4">
          <h2 className="font-black text-[#7A1416] text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight mb-2 drop-shadow-2xs">
            Shop By Brand
          </h2>
          <div className="w-24 h-1 bg-[#7A1416] mx-auto rounded-full mb-3"></div>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto font-medium">
            We supply 100% genuine and high quality fireworks directly from Sivakasi's top trusted manufacturers.
          </p>
        </div>

        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {shopByBrands.map((brand, i) => (
              <div 
                key={i} 
                onClick={() => window.location.href=`/catalog?brand=${encodeURIComponent(brand.name)}`}
                className="bg-gradient-to-b from-white to-amber-50/30 border border-gray-200 hover:border-[#7A1416] rounded-2xl p-4 flex flex-col items-center justify-between text-center shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1"
              >
                <span className="text-[9px] font-extrabold text-[#7A1416] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full mb-2">
                  {brand.tag}
                </span>
                <div className="w-full aspect-square flex items-center justify-center p-2 mb-2 group-hover:scale-105 transition-transform duration-300">
                  <img src={brand.image} alt={brand.name} className="max-w-full max-h-full object-contain drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-800 uppercase tracking-wide group-hover:text-[#7A1416] transition-colors">{brand.name}</h3>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">{brand.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Family Packs */}
      <section className="py-16 bg-[#F4E3BA]">
        <div className="text-center mb-10">
          <h2 className="font-black text-[#7A1416] text-2xl uppercase tracking-widest mb-2">Family Packs</h2>
          <p className="text-gray-700 text-xs font-bold uppercase">Our Special combo packages for you and your whole family</p>
        </div>
        
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.filter(p => p.name.toLowerCase().includes('combo') || p.name.toLowerCase().includes('pack')).slice(0, 6).map((item) => (
              <div key={item.id || item._id} className="bg-white p-5 border border-white shadow-sm flex flex-col items-center text-center cursor-pointer" onClick={() => window.location.href=`/catalog`}>
                <div className="w-full aspect-[4/3] bg-gray-50 flex items-center justify-center p-2 mb-4">
                  <img src={item.image || "/sky_rocket_box.png"} alt={item.name} className="max-w-full max-h-full object-cover" />
                </div>
                <h3 className="font-bold text-sm text-gray-900 uppercase mb-2">{item.name}</h3>
                <div className="flex gap-2 items-center mb-4">
                  {item.hasDiscount && (item.netRate || item.wholesalePrice) && (
                    <span className="text-gray-400 line-through text-xs font-bold">₹{item.price}</span>
                  )}
                  <span className="text-[#7A1416] font-black text-lg">₹{item.hasDiscount && item.netRate ? item.netRate : item.price}</span>
                </div>
                <button onClick={(e) => e.stopPropagation()} className="w-full bg-[#7A1416] text-white py-3 font-bold text-xs tracking-wider hover:bg-red-900 uppercase">
                  Add To Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Quality Standards */}
      <section className="py-20 relative bg-gradient-to-r from-[#5a0f10] to-[#8f191b] overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="md:w-1/2 text-left">
              <span className="bg-[#DDAA55] text-black text-[10px] font-bold px-2 py-1 uppercase tracking-widest mb-4 inline-block">Made In Sivakasi</span>
              <h2 className="font-black text-white text-3xl md:text-5xl uppercase leading-tight mb-4 tracking-wide font-display">
                Premium<br/>
                Sivakasi<br/>
                <span className="text-transparent font-outline-2" style={{ WebkitTextStroke: '1px #FFD700' }}>Quality Standards</span>
              </h2>
              <p className="text-gray-300 text-sm mb-8 max-w-md leading-relaxed">
                Premium fireworks handcrafted in Sivakasi, designed to turn every moment into a golden memory. Celebrate with safety and unmatched quality.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-[#F9EAB8] text-black px-6 py-3 font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors">
                  View Our New<br/>Collection
                </button>
                <button className="border border-white text-white px-6 py-3 font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-[#7A1416] transition-colors">
                  View<br/>More
                </button>
              </div>
            </div>
            <div className="md:w-1/2">
              <img src="/sky_rocket_box.png" alt="Premium Quality" className="w-full max-w-lg rounded-lg shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Diwali Celebration Countdown */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="text-center mb-10">
          <h2 className="font-black text-[#7A1416] text-2xl uppercase tracking-widest mb-2">
            Diwali Celebration {diwaliInfo.year}
          </h2>
          <p className="text-gray-600 text-xs font-semibold">
            Celebrate the festival of lights on {diwaliInfo.formattedDate}
          </p>
        </div>

        <div className="flex justify-center gap-4 md:gap-8">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-[#7A1416] flex items-center justify-center mb-2 shadow-sm bg-red-50/20">
              <span className="font-black text-[#7A1416] text-xl md:text-2xl">{String(timeLeft.days).padStart(2, '0')}</span>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Days</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-[#7A1416] flex items-center justify-center mb-2 shadow-sm bg-red-50/20">
              <span className="font-black text-[#7A1416] text-xl md:text-2xl">{String(timeLeft.hours).padStart(2, '0')}</span>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hrs</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-[#7A1416] flex items-center justify-center mb-2 shadow-sm bg-red-50/20">
              <span className="font-black text-[#7A1416] text-xl md:text-2xl">{String(timeLeft.minutes).padStart(2, '0')}</span>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Min</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-[#7A1416] flex items-center justify-center mb-2 shadow-sm bg-red-50/20">
              <span className="font-black text-[#7A1416] text-xl md:text-2xl">{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sec</span>
          </div>
        </div>
      </section>

      <UserFooter />
    </div>
  );
};

export default Index;
