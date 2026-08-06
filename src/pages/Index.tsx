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

// Static Data based on the design
const staticBestSellers: Product[] = [
  { id: 1, name: "Whistling Birds", price: 240, image: "/sky_rocket_box.png" },
  { id: 2, name: "Flower Pots Big", price: 450, image: "/flower_pots.png" },
  { id: 3, name: "1000 Wala", price: 1200, image: "/sky_rocket_box.png" },
  { id: 4, name: "King Of Kings", price: 350, image: "/flower_pots.png" },
  { id: 5, name: "Twinkling Star", price: 150, image: "/sky_rocket_box.png" },
  { id: 6, name: "Chakkra Special", price: 280, image: "/flower_pots.png" },
];

const staticFamilyPacks: Product[] = [
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
      const speed = Math.random() * 5 + 1.5;
      saravediParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: Math.random() * 0.04 + 0.02,
        color: Math.random() > 0.4 ? '255, 50, 0' : '255, 200, 0'
      });
    };

    let animationId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const leftPotX = canvas.width * 0.08;
      const rightPotX = canvas.width * 0.92;
      const potY = canvas.height - 40;

      for (let i = 0; i < 4; i++) {
        createFlowerPotParticle(leftPotX, potY);
        createFlowerPotParticle(rightPotX, potY);
      }

      if (Math.random() < 0.25) {
        const saravediX = Math.random() * (canvas.width * 0.6) + canvas.width * 0.2;
        const saravediY = Math.random() * (canvas.height * 0.4) + canvas.height * 0.1;
        for (let i = 0; i < 8; i++) {
          createSaravediParticle(saravediX, saravediY);
        }
      }

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= p.decay;
        
        if (p.life <= 0) {
          particles.splice(index, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.random() * 2.5 + 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = `rgba(${p.color}, 1)`;
          ctx.fill();
        }
      });

      saravediParticles.forEach((sp, index) => {
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life -= sp.decay;

        if (sp.life <= 0) {
          saravediParticles.splice(index, 1);
        } else {
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, Math.random() * 2 + 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${sp.color}, ${sp.life})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(${sp.color}, 1)`;
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white relative font-sans">
      <UserHeader />

      {/* Hero Section */}
      {/* Hero Section */}
      <section className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[600px] min-h-[220px] flex items-center justify-center overflow-hidden bg-black">
        <img
          key={`enter-${slideKey}`}
          src={heroImages[currentSlide]}
          alt="Sai Yogi Crackers Festival Banner"
          className="w-full h-full object-cover object-center hero-slide-enter opacity-100"
        />

        {/* Dots Indicator */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
          {heroImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentSlide(idx);
                setSlideKey((k) => k + 1);
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSlide === idx ? "bg-[#F4C542] w-8 shadow-lg shadow-yellow-500/50" : "bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Hyper-Realistic Background Fireworks Canvas */}
      <canvas 
        id="fountain-canvas" 
        className="fixed inset-0 pointer-events-none z-40 opacity-75"
      />

      {/* Best Sellers Section */}
      <section className="py-16 bg-gradient-to-b from-[#FFF6E5] to-white border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <span className="bg-[#A80000]/10 text-[#A80000] text-[10px] font-black px-3.5 py-1.5 uppercase tracking-widest mb-3 inline-block rounded-full">
              🔥 POPULAR SELECTIONS 🔥
            </span>
            <h2 className="font-black text-[#A80000] text-3xl md:text-4xl uppercase tracking-widest mb-2 font-display">Best Sellers</h2>
            <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">Handpicked customer favorites for grand celebrations</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {(products.length > 0 ? products.slice(0, 6) : staticBestSellers).map((item: any, idx: number) => (
              <div 
                key={`bestseller-${item._id || item.id || idx}`} 
                className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col items-center text-center shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-full aspect-square bg-gray-50 flex items-center justify-center p-2 mb-3 rounded-xl overflow-hidden relative">
                  <img src={item.image || "/sky_rocket_box.png"} alt={item.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                  <span className="absolute top-1.5 left-1.5 bg-[#A80000] text-[#F4C542] font-black text-[8px] px-2 py-0.5 rounded-full uppercase">
                    HOT
                  </span>
                </div>
                <h3 className="font-bold text-xs text-gray-800 uppercase text-center line-clamp-2 min-h-[32px] mb-2">{item.name}</h3>
                <div className="text-[#A80000] font-black text-sm mb-3">₹{item.price}</div>
                <button 
                  onClick={() => addToCart(item)}
                  className="w-full bg-[#A80000] text-white py-1.5 rounded-lg text-xs font-bold hover:bg-[#F4C542] hover:text-[#1A1A1A] transition-colors uppercase flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ShoppingCart className="w-3 h-3" /> Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Gallery Section */}
      <section className="py-16 bg-[#1A1A1A] text-white relative overflow-hidden border-y border-[#F4C542]/20">
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center mb-10">
            <span className="bg-[#F4C542] text-[#1A1A1A] text-[10px] font-black px-3.5 py-1.5 uppercase tracking-widest mb-3 inline-block rounded-full shadow-lg">
              ✨ LIVE DEMO PREVIEWS ✨
            </span>
            <h2 className="font-black text-white text-3xl md:text-4xl uppercase tracking-widest mb-2 font-display">Watch Fireworks In Action</h2>
            <p className="text-gray-300 text-xs font-medium max-w-md mx-auto">Experience high definition live video clips of our top fireworks displays.</p>
          </div>

          <div className="relative flex items-center justify-center">
            {/* Left Button */}
            <button
              onClick={() => setVideoIndex((prev) => (prev - 1 + demoVideos.length) % demoVideos.length)}
              className="absolute -left-4 md:-left-8 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center shadow-lg hover:bg-[#F4C542] hover:text-[#1A1A1A] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-4">
              {[0, 1, 2].map((offset) => {
                const idx = (videoIndex + offset) % demoVideos.length;
                const video = demoVideos[idx];
                const isPlaying = playingVideo === video.id;

                return (
                  <div 
                    key={video.id} 
                    className="relative rounded-2xl overflow-hidden aspect-video bg-black/60 border border-white/10 group shadow-2xl flex flex-col justify-end"
                  >
                    {isPlaying ? (
                      <video 
                        src={video.url} 
                        controls 
                        autoPlay 
                        className="w-full h-full object-cover"
                        onEnded={() => setPlayingVideo(null)}
                      />
                    ) : (
                      <>
                        <img 
                          src={video.thumbnail} 
                          alt={video.title} 
                          className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity group-hover:scale-105 duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-between p-4">
                          <span className="bg-[#A80000] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider self-start shadow-md">
                            HD Video
                          </span>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-extrabold text-sm text-white tracking-wide">{video.title}</h3>
                              <p className="text-gray-400 text-[10px] mt-0.5">Click play to preview effect</p>
                            </div>

                            <button 
                              onClick={() => setPlayingVideo(video.id)}
                              className="w-10 h-10 rounded-full bg-[#F4C542] text-[#1A1A1A] flex items-center justify-center shadow-lg hover:scale-110 transition-all cursor-pointer shrink-0"
                            >
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Button */}
            <button
              onClick={() => setVideoIndex((prev) => (prev + 1) % demoVideos.length)}
              className="absolute -right-4 md:-right-8 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center shadow-lg hover:bg-[#F4C542] hover:text-[#1A1A1A] transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Shop By Category */}
      <section className="py-16 bg-[#FFF6E5]">
        <div className="text-center mb-10 container mx-auto px-4">
          <h2 className="font-black text-[#A80000] text-3xl sm:text-4xl uppercase tracking-tight mb-2 font-display">
            Shop By Category
          </h2>
          <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">
            Explore our wide selection of premium fireworks crafted for spectacular celebrations
          </p>
        </div>

        {/* Infinite scrolling categories marquee */}
        <div className="relative w-full overflow-hidden py-4 mb-8">
          <div className="flex flex-nowrap gap-6 animate-marquee hover:[animation-play-state:paused] w-max select-none">
            {[...(categories.length > 0 ? categories : premiumCategories), ...(categories.length > 0 ? categories : premiumCategories), ...(categories.length > 0 ? categories : premiumCategories)].map((cat: any, i: number) => (
              <div 
                key={`${cat.id || cat._id || 'cat'}-${i}`} 
                onClick={() => window.location.href=`/catalog?category=${cat.id || cat._id}`} 
                className="bg-white border border-gray-200 p-4 flex flex-col items-center text-center shadow-md rounded-2xl min-w-[200px] max-w-[200px] shrink-0 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-[#A80000]/20 group cursor-pointer"
              >
                <div className="w-full aspect-square bg-gray-50 flex items-center justify-center p-2 mb-3 rounded-xl overflow-hidden relative border border-gray-100/50">
                  <img 
                    src={cat.image || "/sky_rocket_box.png"} 
                    alt={cat.name} 
                    className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110" 
                  />
                  <span className="absolute top-2 left-2 bg-[#A80000] text-[#F4C542] font-black text-[9px] px-2.5 py-0.5 rounded-full shadow uppercase">
                    SHOP
                  </span>
                </div>
                <h3 className="font-bold text-xs text-gray-800 uppercase text-center min-h-[32px] line-clamp-2 transition-colors group-hover:text-[#A80000] mb-3">{cat.name}</h3>
                
                <div className="w-full mt-auto">
                  <button className="w-full bg-[#A80000] text-white py-1.5 rounded-lg text-xs font-bold hover:bg-[#F4C542] hover:text-[#1A1A1A] transition-colors uppercase">
                    View Products
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Categories Grid */}
      <section className="py-16 bg-[#FFF8EE] border-b border-amber-100/50">
        <div className="text-center mb-10 container mx-auto px-4">
          <span className="bg-[#A80000]/10 text-[#A80000] text-[10px] font-black px-3.5 py-1.5 uppercase tracking-widest mb-3 inline-block rounded-full">
            ⭐ AUTHENTIC PARTNERS ⭐
          </span>
          <h2 className="font-black text-[#A80000] text-3xl sm:text-4xl uppercase tracking-tight mb-2 font-display">
            Shop By Brand
          </h2>
          <p className="text-gray-600 text-xs font-bold uppercase tracking-wider max-w-xl mx-auto">
            We supply 100% genuine and high quality fireworks directly from Sivakasi's top trusted manufacturers.
          </p>
        </div>

        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {(brands.length > 0 ? brands : shopByBrands).map((brand: any, i: number) => (
              <div 
                key={brand._id || brand.id || i} 
                onClick={() => window.location.href=`/catalog?brand=${encodeURIComponent(brand.name)}`}
                className="bg-gradient-to-b from-white to-amber-50/30 border border-gray-200 hover:border-[#A80000] rounded-2xl p-4 flex flex-col items-center justify-between text-center shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1"
              >
                <span className="text-[9px] font-extrabold text-[#A80000] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full mb-2">
                  {brand.tag || "Authentic"}
                </span>
                <div className="w-full aspect-square flex items-center justify-center p-2 mb-2 group-hover:scale-105 transition-transform duration-300">
                  <img src={brand.image || brand.logoUrl || "/sky_rocket_box.png"} alt={brand.name} className="max-w-full max-h-full object-contain drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-800 uppercase tracking-wide group-hover:text-[#A80000] transition-colors">{brand.name}</h3>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">{brand.subtitle || "Original Brand"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Combo Packs */}
      <section className="py-16 bg-[#FFF6E5]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <span className="bg-[#A80000]/10 text-[#A80000] text-[10px] font-black px-3.5 py-1.5 uppercase tracking-widest mb-3 inline-block rounded-full">
              🎁 GREAT VALUE COMBOS 🎁
            </span>
            <h2 className="font-black text-[#A80000] text-3xl md:text-4xl uppercase tracking-widest mb-2 font-display">Combo Packs</h2>
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
              className="absolute -left-4 md:-left-8 z-20 w-10 h-10 rounded-full bg-white text-[#A80000] border border-gray-200 flex items-center justify-center shadow-lg hover:bg-[#F4C542] hover:text-[#1A1A1A] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full px-4">
              {[0, 1, 2].map((offset) => {
                const comboPacksList = products.filter(p => p.name.toLowerCase().includes('combo') || p.name.toLowerCase().includes('pack')).length > 0
                  ? products.filter(p => p.name.toLowerCase().includes('combo') || p.name.toLowerCase().includes('pack'))
                  : staticFamilyPacks;
                const item = comboPacksList[(comboIndex + offset) % comboPacksList.length];
                const itemId = String(item._id || item.id);
                const cartItem = cartItems.find((i) => String(i.product._id || i.product.id) === itemId);
                const quantity = cartItem?.quantity || 0;

                return (
                  <div 
                    key={`combo-${offset}-${item._id || item.id || offset}`} 
                    className="bg-[#FFFFFF] border-2 border-amber-100 rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center relative group hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-[#A80000] to-[#5c0a0b] text-[#F4C542] font-black text-[10px] px-3 py-1 rounded-full uppercase shadow-md">
                      SAVE BIG
                    </div>

                    <div className="w-full aspect-[4/3] bg-gray-50 flex items-center justify-center p-4 mb-4 rounded-2xl overflow-hidden">
                      <img src={item.image || "/sky_rocket_box.png"} alt={item.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    <h3 className="font-extrabold text-base text-gray-900 uppercase mb-2 line-clamp-1">{item.name}</h3>
                    
                    <div className="flex gap-3 items-center mb-5">
                      {item.oldPrice && (
                        <span className="text-gray-400 line-through text-xs font-bold">₹{item.oldPrice}</span>
                      )}
                      <span className="text-[#A80000] font-black text-xl">₹{item.price}</span>
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
                          addToCart(item as Product);
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
              className="absolute -right-4 md:-right-8 z-20 w-10 h-10 rounded-full bg-white text-[#A80000] border border-gray-200 flex items-center justify-center shadow-lg hover:bg-[#F4C542] hover:text-[#1A1A1A] transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Premium Quality Cards Section */}
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
