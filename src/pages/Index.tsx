import { Link } from "react-router-dom";
import { Play, Pause, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import narendira1 from "@/assets/narendira1.png";
import narendira2 from "@/assets/narendira2.png";
import { useState, useEffect } from "react";
import { getProducts } from "@/lib/api";
import { Product } from "@/data/products";
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
  { id: 13, name: "Supreme Crackers Box", oldPrice: 8500, price: 6200, image: "/sky_rocket_box.png" },
  { id: 14, name: "Luxury Festival Sparklers", oldPrice: 5000, price: 3800, image: "/flower_pots.png" },
  { id: 15, name: "Mini Celebration Combo", oldPrice: 1500, price: 999, image: "/sky_rocket_box.png" },
  { id: 16, name: "Premium Golden Chakkars Pack", oldPrice: 4000, price: 2900, image: "/flower_pots.png" },
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
  }
];

const Index = () => {
  const { settings } = useSiteSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);
  const [videoIndex, setVideoIndex] = useState(0);
  const [familyIndex, setFamilyIndex] = useState(0);

  // Hero image slideshow (right-to-left slide)
  const heroImages = [narendira1, narendira2];
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
    // We could fetch dynamic data here, but we will use the static data to match the UI precisely for now.
    getProducts().then((prods) => {
      setProducts(prods);
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
      <section className="relative w-full h-[300px] md:h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden bg-black">
          <img
            key={`enter-${slideKey}`}
            src={heroImages[currentSlide]}
            alt="Sai Yogi Crackers"
            className="absolute inset-0 w-full h-full object-cover object-center hero-slide-enter opacity-80"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center mt-8">
            <h1 className="text-5xl md:text-8xl font-black text-[#FFD700] drop-shadow-lg tracking-wider" style={{ fontFamily: 'serif' }}>Sai Yogi</h1>
            <p className="text-xl md:text-3xl text-white tracking-[0.3em] font-light mt-2 uppercase">Crackers</p>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-12 container mx-auto px-4 max-w-6xl overflow-hidden">
        <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-2">
          <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-widest relative">
            Best Sellers
            <div className="absolute -bottom-2.5 left-0 w-1/2 h-0.5 bg-[#A80000]"></div>
          </h2>
          <Link to="/catalog" className="text-red-600 font-bold text-xs hover:underline uppercase">View All &gt;</Link>
        </div>
        
        <div className="relative w-full overflow-hidden py-4">
          <div className="animate-best-sellers-scroll">
            {[...staticBestSellers, ...staticBestSellers].map((item, index) => (
              <div 
                key={`${item.id}-${index}`} 
                className="bg-white border border-gray-200 p-4 flex flex-col items-center text-center shadow-md rounded-xl min-w-[200px] max-w-[200px] transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-[#A80000]/20 group cursor-pointer"
              >
                <div className="w-full aspect-square bg-gray-50 flex items-center justify-center p-2 mb-3 rounded-lg overflow-hidden relative">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110" 
                  />
                  <span className="absolute top-2 left-2 bg-[#A80000] text-[#F4C542] font-black text-[9px] px-2 py-0.5 rounded shadow">
                    BEST
                  </span>
                </div>
                <h3 className="font-bold text-xs text-gray-800 uppercase mb-1 min-h-[32px] line-clamp-2">{item.name}</h3>
                <div className="flex gap-1 mb-2 text-yellow-400">
                  {'★★★★★'.split('').map((star, i) => <span key={i} className="text-[10px]">{star}</span>)}
                </div>
                <p className="text-[#A80000] font-extrabold text-sm mb-3">₹ {item.price}</p>
                
                <div className="flex items-center gap-2 mt-auto w-full">
                  <div className="flex items-center border border-gray-300 rounded text-xs flex-1 bg-gray-50 overflow-hidden">
                    <button className="px-2 py-1 text-gray-600 hover:bg-gray-200 font-bold" onClick={(e) => { e.stopPropagation(); }}>-</button>
                    <input type="text" value="1" readOnly className="w-6 text-center outline-none bg-transparent font-semibold" />
                    <button className="px-2 py-1 text-gray-600 hover:bg-gray-200 font-bold" onClick={(e) => { e.stopPropagation(); }}>+</button>
                  </div>
                  <button className="bg-[#A80000] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-800 transition-colors" onClick={(e) => { e.stopPropagation(); }}>ADD</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Videos Section */}
      <section className="py-12 bg-gradient-to-b from-white to-[#FFF6E5] relative px-10 md:px-12 overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl relative">
          <div className="flex items-center justify-between gap-4">
            {/* Left Arrow Button */}
            <button 
              onClick={() => setVideoIndex((prev) => (prev === 0 ? demoVideos.length - 1 : prev - 1))}
              className="absolute left-[-2rem] top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-[#A80000] hover:text-white border border-gray-200 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {[0, 1, 2].map((offset) => {
                const idx = (videoIndex + offset) % demoVideos.length;
                const video = demoVideos[idx];
                const isPlaying = playingVideo === video.id;
                return (
                  <div 
                    key={`${video.id}-${idx}`} 
                    className="relative rounded-2xl overflow-hidden aspect-video bg-black group cursor-pointer shadow-lg transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl border border-gray-150 w-full"
                    onClick={() => setPlayingVideo(isPlaying ? null : video.id)}
                  >
                    {isPlaying ? (
                      <video 
                        src={video.url} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity" 
                      />
                    )}
                    
                    {/* Button overlay */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/60 via-transparent to-black/20">
                      <span className="text-white font-bold text-xs bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm self-start">
                        {video.title}
                      </span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-xl transition-all duration-300 hover:scale-110 hover:bg-[#A80000] hover:border-red-500 hover:shadow-red-500/50">
                          {isPlaying ? (
                            <Pause className="text-white fill-white w-6 h-6 transition-transform hover:rotate-90 duration-300" />
                          ) : (
                            <Play className="text-white fill-white w-6 h-6 ml-1 transition-transform hover:scale-110 duration-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Arrow Button */}
            <button 
              onClick={() => setVideoIndex((prev) => (prev === demoVideos.length - 1 ? 0 : prev + 1))}
              className="absolute right-[-2rem] top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-[#A80000] hover:text-white border border-gray-200 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Shop By Category */}
      <section className="py-12 container mx-auto px-4 max-w-6xl overflow-hidden">
        <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-2">
          <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-widest relative">
            Shop By Category
            <div className="absolute -bottom-2.5 left-0 w-1/2 h-0.5 bg-[#A80000]"></div>
          </h2>
          <Link to="/catalog" className="text-red-600 font-bold text-xs hover:underline uppercase">View All &gt;</Link>
        </div>
        
        <div className="relative w-full overflow-hidden py-4">
          <div className="animate-best-sellers-scroll">
            {[...premiumCategories, ...premiumCategories].map((cat, i) => (
              <Link
                key={i}
                to={`/catalog?category=${cat.categoryId}`}
                className="bg-white border border-gray-200 p-4 flex flex-col items-center text-center shadow-md rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-[#A80000]/20 group cursor-pointer min-w-[170px] max-w-[170px]"
              >
                <div className="w-full aspect-square flex items-center justify-center bg-gray-50 rounded-xl p-2 mb-3 transition-transform duration-300 group-hover:scale-110">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <h3 className="font-bold text-xs text-gray-800 uppercase tracking-wider group-hover:text-[#A80000] transition-colors text-center line-clamp-1">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Shop By Brand */}
      <section className="py-12 container mx-auto px-4 max-w-6xl overflow-hidden">
        <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-2">
          <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-widest relative">
            Shop By Brand
            <div className="absolute -bottom-2.5 left-0 w-1/2 h-0.5 bg-[#A80000]"></div>
          </h2>
          <Link to="/catalog" className="text-red-600 font-bold text-xs hover:underline uppercase">View All &gt;</Link>
        </div>

        <div className="relative w-full overflow-hidden py-4">
          <div className="animate-best-sellers-scroll">
            {[...shopByBrands, ...shopByBrands].map((brand, i) => (
              <Link
                key={i}
                to={`/catalog?search=${brand.name}`}
                className="bg-white border border-gray-200 p-4 flex flex-col items-center justify-between text-center shadow-md rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-[#A80000]/20 group cursor-pointer relative overflow-hidden min-w-[180px] max-w-[180px]"
              >
                {/* Brand Tag Pill */}
                <span className="text-[9px] font-black text-[#A80000] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full mb-3 uppercase tracking-wider">
                  {brand.tag}
                </span>

                {/* Brand Image Container */}
                <div className="w-full aspect-square bg-gray-50 rounded-xl p-2 mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <img
                    src={brand.image}
                    alt={brand.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <div className="flex flex-col items-center w-full">
                  <span className="font-bold text-xs text-gray-800 uppercase tracking-wide group-hover:text-[#A80000] transition-colors line-clamp-1">
                    {brand.name}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium mt-0.5 line-clamp-1 text-center w-full">
                    {brand.subtitle}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Combo Packs */}
      <section className="py-16 bg-[#FFF6E5] overflow-hidden px-10 md:px-12">
        <div className="text-center mb-10">
          <h2 className="font-black text-[#A80000] text-2xl uppercase tracking-widest mb-2">Combo Packs</h2>
          <p className="text-gray-700 text-xs font-bold uppercase">Our Special combo packages for you and your whole family</p>
        </div>
        
        <div className="container mx-auto px-4 max-w-6xl relative">
          <div className="flex items-center justify-between gap-4">
            {/* Left Arrow Button */}
            <button 
              onClick={() => setFamilyIndex((prev) => (prev === 0 ? staticFamilyPacks.length - 1 : prev - 1))}
              className="absolute left-[-2rem] top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-[#A80000] hover:text-white border border-gray-200 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {[0, 1, 2].map((offset) => {
                const idx = (familyIndex + offset) % staticFamilyPacks.length;
                const item = staticFamilyPacks[idx];
                return (
                  <div key={`${item.id}-${idx}`} className="bg-white/40 backdrop-blur-md border border-white/60 p-6 rounded-2xl shadow-lg flex flex-col justify-between items-center text-center transition-all duration-300 hover:scale-105 hover:bg-white/65 hover:shadow-2xl hover:border-[#F4C542]/40 h-[450px] group w-full">
                    <div className="w-full aspect-[4/3] bg-gray-50 flex items-center justify-center p-2 mb-4 rounded-xl overflow-hidden shrink-0 h-44">
                      <img src={item.image} alt={item.name} className="max-w-full max-h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900 uppercase mb-2 line-clamp-2 min-h-[40px]">{item.name}</h3>
                    <div className="flex gap-2 items-center mb-4">
                      <span className="text-gray-400 line-through text-xs font-bold">₹{item.oldPrice}</span>
                      <span className="text-[#A80000] font-black text-lg">₹{item.price}</span>
                    </div>
                    <button className="w-full bg-[#A80000] text-white py-3.5 rounded-xl font-bold text-xs tracking-widest hover:bg-[#F4C542] hover:text-[#1A1A1A] hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] uppercase flex items-center justify-center gap-2 mt-auto">
                      <ShoppingCart className="h-4 w-4" /> Add To Cart
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Right Arrow Button */}
            <button 
              onClick={() => setFamilyIndex((prev) => (prev === staticFamilyPacks.length - 1 ? 0 : prev + 1))}
              className="absolute right-[-2rem] top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-[#A80000] hover:text-white border border-gray-200 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Premium Quality Grid Sections */}
      <section className="py-16 bg-[#FFF6E5] border-t border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Card 1: Premium Quality */}
            <div className="bg-gradient-to-br from-[#A80000] to-[#750000] rounded-3xl p-6 shadow-xl flex items-center justify-between overflow-hidden hover:scale-[1.03] transition-transform duration-300 relative group h-56 border border-white/10">
              <div className="flex flex-col text-left max-w-[55%] justify-center h-full">
                <span className="text-[#F4C542] text-[10px] font-black tracking-widest uppercase mb-2">Premium Quality</span>
                <h3 className="font-extrabold text-white text-lg md:text-xl leading-tight tracking-wide">
                  Best Quality from Verified Manufacturers
                </h3>
              </div>
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <div className="absolute w-32 h-32 rounded-full border border-dashed border-white/20 animate-spin-slow"></div>
                <div className="relative w-26 h-26 rounded-full border-2 border-[#F4C542] bg-white flex flex-col items-center justify-center text-center shadow-lg z-10 p-2">
                  <span className="text-[12px] font-black text-[#A80000] leading-none uppercase tracking-tighter">SAI YOGI</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-0.5">CRACKERS</span>
                  <div className="w-10 h-[1px] bg-[#F4C542] my-1"></div>
                  <span className="text-[8px] font-bold text-white bg-[#A80000] px-2 py-0.5 rounded-full uppercase scale-90">Verified</span>
                </div>
                <img src="/sky_rocket_box.png" alt="Rocket" className="absolute top-0 left-2 w-11 h-11 object-contain -rotate-12 group-hover:scale-110 transition-transform" />
                <img src="/flower_pots.png" alt="Flower Pot" className="absolute bottom-1 right-2 w-11 h-11 object-contain rotate-12 group-hover:scale-110 transition-transform" />
                <img src="/sky_rocket_box.png" alt="Rocket" className="absolute top-2 right-1 w-9 h-9 object-contain rotate-45 group-hover:scale-110 transition-transform" />
                <img src="/flower_pots.png" alt="Flower Pot" className="absolute bottom-2 left-2 w-10 h-10 object-contain -rotate-45 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            {/* Card 2: Trusted Partners */}
            <div className="bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#111111] rounded-3xl p-6 shadow-xl flex items-center justify-between overflow-hidden hover:scale-[1.03] transition-transform duration-300 relative group h-56 border border-[#F4C542]/10">
              <div className="flex flex-col text-left max-w-[55%] justify-center h-full">
                <span className="text-[#F4C542] text-[10px] font-black tracking-widest uppercase mb-2">Trusted Partners</span>
                <h3 className="font-extrabold text-white text-lg md:text-xl leading-tight tracking-wide">
                  We collab with Top Partners from Sivakasi
                </h3>
              </div>
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <div className="absolute w-32 h-32 rounded-full border border-dashed border-white/20 animate-spin-slow"></div>
                <div className="relative w-26 h-26 rounded-full border-2 border-[#F4C542] bg-white flex flex-col items-center justify-center text-center shadow-lg z-10 p-2">
                  <span className="text-[12px] font-black text-[#A80000] leading-none uppercase tracking-tighter">SAI YOGI</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-0.5">CRACKERS</span>
                  <div className="w-10 h-[1px] bg-[#F4C542] my-1"></div>
                  <span className="text-[8px] font-bold text-white bg-[#A80000] px-2 py-0.5 rounded-full uppercase scale-90">Collab</span>
                </div>
                <img src="/sky_rocket_box.png" alt="Rocket" className="absolute top-0 left-2 w-11 h-11 object-contain -rotate-12 group-hover:scale-110 transition-transform" />
                <img src="/flower_pots.png" alt="Flower Pot" className="absolute bottom-1 right-2 w-11 h-11 object-contain rotate-12 group-hover:scale-110 transition-transform" />
                <img src="/sky_rocket_box.png" alt="Rocket" className="absolute top-2 right-1 w-9 h-9 object-contain rotate-45 group-hover:scale-110 transition-transform" />
                <img src="/flower_pots.png" alt="Flower Pot" className="absolute bottom-2 left-2 w-10 h-10 object-contain -rotate-45 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            {/* Card 3: Authentic Brands */}
            <div className="bg-gradient-to-br from-[#D4A316] to-[#A37B0C] rounded-3xl p-6 shadow-xl flex items-center justify-between overflow-hidden hover:scale-[1.03] transition-transform duration-300 relative group h-56 border border-white/10">
              <div className="flex flex-col text-left max-w-[55%] justify-center h-full">
                <span className="text-white text-[10px] font-black tracking-widest uppercase mb-2">Authentic Brands</span>
                <h3 className="font-extrabold text-[#1A1A1A] text-lg md:text-xl leading-tight tracking-wide">
                  We are Selling Crackers from Authentic Brands
                </h3>
              </div>
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <div className="absolute w-32 h-32 rounded-full border border-dashed border-white/20 animate-spin-slow"></div>
                <div className="relative w-26 h-26 rounded-full border-2 border-[#1A1A1A] bg-white flex flex-col items-center justify-center text-center shadow-lg z-10 p-2">
                  <span className="text-[12px] font-black text-[#A80000] leading-none uppercase tracking-tighter">SAI YOGI</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-0.5">CRACKERS</span>
                  <div className="w-10 h-[1px] bg-[#1A1A1A] my-1"></div>
                  <span className="text-[7px] font-bold text-white bg-[#A80000] px-2 py-0.5 rounded-full uppercase scale-90">Authentic</span>
                </div>
                <img src="/sky_rocket_box.png" alt="Rocket" className="absolute top-0 left-2 w-11 h-11 object-contain -rotate-12 group-hover:scale-110 transition-transform" />
                <img src="/flower_pots.png" alt="Flower Pot" className="absolute bottom-1 right-2 w-11 h-11 object-contain rotate-12 group-hover:scale-110 transition-transform" />
                <img src="/sky_rocket_box.png" alt="Rocket" className="absolute top-2 right-1 w-9 h-9 object-contain rotate-45 group-hover:scale-110 transition-transform" />
                <img src="/flower_pots.png" alt="Flower Pot" className="absolute bottom-2 left-2 w-10 h-10 object-contain -rotate-45 group-hover:scale-110 transition-transform" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Dynamic Diwali Celebration Countdown */}
      <section className="py-20 bg-gradient-to-br from-[#A80000] via-[#5c0a0b] to-[#1A1A1A] border-y border-[#F4C542]/20 relative overflow-hidden">
        {/* Subtle decorative background lights */}
        <div className="absolute top-0 left-10 w-24 h-24 bg-[#F4C542]/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="text-center mb-12 relative z-10">
          <h2 className="font-black text-[#F4C542] text-3xl uppercase tracking-widest mb-3 font-display" style={{ fontFamily: 'serif' }}>
            Diwali Celebration {diwaliInfo.year}
          </h2>
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest">
            Celebrate the festival of lights on {diwaliInfo.formattedDate}
          </p>
        </div>

        <div className="flex justify-center gap-4 md:gap-8 relative z-10">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border border-white/30 bg-gradient-to-br from-white/20 via-white/10 to-[#F4C542]/10 backdrop-blur-md flex flex-col items-center justify-center mb-2 shadow-2xl transition-all duration-300 hover:scale-105 hover:border-[#F4C542] hover:shadow-[#F4C542]/20 relative overflow-hidden group">
              <span className="font-black text-[#F4C542] text-xl md:text-3xl tracking-tight">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">Days</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border border-white/30 bg-gradient-to-br from-white/20 via-white/10 to-[#F4C542]/10 backdrop-blur-md flex flex-col items-center justify-center mb-2 shadow-2xl transition-all duration-300 hover:scale-105 hover:border-[#F4C542] hover:shadow-[#F4C542]/20 relative overflow-hidden group">
              <span className="font-black text-[#F4C542] text-xl md:text-3xl tracking-tight">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">Hrs</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border border-white/30 bg-gradient-to-br from-white/20 via-white/10 to-[#F4C542]/10 backdrop-blur-md flex flex-col items-center justify-center mb-2 shadow-2xl transition-all duration-300 hover:scale-105 hover:border-[#F4C542] hover:shadow-[#F4C542]/20 relative overflow-hidden group">
              <span className="font-black text-[#F4C542] text-xl md:text-3xl tracking-tight">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">Min</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border border-white/30 bg-gradient-to-br from-white/20 via-white/10 to-[#F4C542]/10 backdrop-blur-md flex flex-col items-center justify-center mb-2 shadow-2xl transition-all duration-300 hover:scale-105 hover:border-[#F4C542] hover:shadow-[#F4C542]/20 relative overflow-hidden group">
              <span className="font-black text-[#F4C542] text-xl md:text-3xl tracking-tight">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">Sec</span>
            </div>
          </div>
        </div>
      </section>

      <UserFooter />
    </div>
  );
};

export default Index;
