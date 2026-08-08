import { Link } from "react-router-dom";
import { Play, Pause, ChevronLeft, ChevronRight, ShoppingCart, X } from "lucide-react";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import companyLogo from "@/assets/saiyogi-logo-1.png";
import heroBanner1 from "@/assets/hero_banner_1.jpg";
import heroBanner2 from "@/assets/hero_banner_2.jpg";
import heroBanner3 from "@/assets/hero_banner_3.jpg";
import heroBanner4 from "@/assets/hero_banner_4.jpg";
import { useState, useEffect, useRef } from "react";
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

const manufacturers = [
  { name: "Standard Fireworks", logo: "SF" },
  { name: "Ajanta Pyrotechnics", logo: "AP" },
  { name: "Coronation Sparklers", logo: "CS" },
  { name: "Vadivel Fireworks", logo: "VF" },
  { name: "Sony Crackers", logo: "SC" },
  { name: "Sri Kaliswari", logo: "SK" },
];

const Index = () => {
  const { settings } = useSiteSettings();
  const { items: cartItems, addToCart, updateQuantity } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [videoIndex, setVideoIndex] = useState(0);
  const videoScrollRef = useRef<HTMLDivElement>(null);

  const scrollVideos = (direction: 'left' | 'right') => {
    if (videoScrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      videoScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  const [comboIndex, setComboIndex] = useState(0);
  const [isMobileView, setIsMobileView] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hero image slideshow (right-to-left slide)
  const heroImages = [heroBanner1, heroBanner2, heroBanner3, heroBanner4];
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

  // Listen for YouTube video ENDED (0) or PAUSED (2) events to automatically resume marquee scrolling
  useEffect(() => {
    const handleYTMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (!data) return;

        // YT.PlayerState: ENDED is 0, PAUSED is 2
        const isEndedOrPaused =
          data.info === 0 ||
          data.info === 2 ||
          data.info?.playerState === 0 ||
          data.info?.playerState === 2 ||
          (data.event === "onStateChange" && (data.info === 0 || data.info === 2)) ||
          (data.event === "infoDelivery" && (data.info?.playerState === 0 || data.info?.playerState === 2));

        if (isEndedOrPaused) {
          setPlayingVideo(null);
        }
      } catch (err) {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleYTMessage);
    return () => window.removeEventListener("message", handleYTMessage);
  }, []);

  // Realistic Flower Pot Effect
  useEffect(() => {
    const canvas = document.getElementById('flower-pot-canvas') as HTMLCanvasElement;
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
    
    const createFlowerPotParticle = (x: number, y: number) => {
      const isMobile = window.innerWidth < 768;
      const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8; // Narrower angle for realistic fountain
      const speed = isMobile ? (Math.random() * 8 + 4) : (Math.random() * 12 + 6); // Stronger initial thrust, less on mobile
      particles.push({
        x, y,
        vx: Math.sin(angle) * speed,
        vy: -Math.cos(angle) * speed,
        life: 1,
        decay: Math.random() * 0.015 + 0.008,
        color: Math.random() > 0.4 ? '255, 215, 0' : '255, 140, 0' // Gold and orange
      });
    };

    let chakkarAngle = 0;
    const createChakkarParticle = (x: number, y: number) => {
      chakkarAngle += 0.8; // Spin speed
      const isMobile = window.innerWidth < 768;
      const speed = isMobile ? (Math.random() * 6 + 4) : (Math.random() * 10 + 5);
      const angle = chakkarAngle + (Math.random() * 0.5 - 0.25);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: (Math.sin(angle) * speed * 0.5) - (isMobile ? 1 : 2), // Elliptical spin + slight upward drift
        life: 1,
        decay: Math.random() * 0.02 + 0.01,
        color: Math.random() > 0.5 ? '255, 255, 255' : '150, 255, 150' // Silver & Green sparks
      });
    };

    let animationId: number;
    let isActive = true;
    let lastToggleTime = performance.now();

    const render = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const elapsed = time - lastToggleTime;
      if (isActive && elapsed > 5000) {
        isActive = false;
        lastToggleTime = time;
      } else if (!isActive && elapsed > 10000) {
        isActive = true;
        lastToggleTime = time;
      }

      const isMobile = window.innerWidth < 768;
      // Move them more inward on mobile so they don't get cut off at the edges
      const leftPotX = canvas.width * (isMobile ? 0.2 : 0.1);
      const rightPotX = canvas.width * (isMobile ? 0.8 : 0.9);
      const centerX = canvas.width * 0.5;
      
      // Move the Y position slightly up on mobile to avoid bottom UI / notch covering it
      const potY = canvas.height - (isMobile ? 40 : 10);
      
      const particleCount = isMobile ? 3 : 5; // Slightly increased for better visibility
      const chakkarCount = isMobile ? 3 : 6;

      if (isActive) {
        for (let i = 0; i < particleCount; i++) {
          createFlowerPotParticle(leftPotX, potY);
          createFlowerPotParticle(rightPotX, potY);
        }
        for (let i = 0; i < chakkarCount; i++) {
          createChakkarParticle(centerX, potY);
        }
      }

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Gravity
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(index, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.random() * 2 + 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(${p.color}, 1)`;
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(render);
    };
    
    animationId = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);



  return (
    <div className="min-h-screen flex flex-col bg-white relative font-sans">
      <UserHeader />

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-black flex flex-col select-none">
        <div className="relative w-full h-[320px] sm:h-[450px] md:h-[550px] lg:h-[620px] overflow-hidden bg-black flex items-center justify-center group">
          {/* Full Width & Height Banner Image */}
          <div key={slideKey} className="absolute inset-0 w-full h-full animate-slide-left">
            <img 
              src={heroImages[currentSlide]} 
              alt={`Sai Yogi Crackers Banner ${currentSlide + 1}`} 
              className={`w-full h-full object-cover filter brightness-105 transition-all duration-500 ${
                currentSlide === 0 ? "object-[center_15%]" : "object-center"
              }`} 
            />
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none z-10" />

          {/* Left Arrow Navigation */}
          <button
            onClick={() => {
              setCurrentSlide((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));
              setSlideKey((k) => k + 1);
            }}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 md:p-3 rounded-full bg-black/50 hover:bg-[#A80000] text-white backdrop-blur-md border border-white/20 transition-all shadow-xl hover:scale-110 opacity-80 group-hover:opacity-100 cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Right Arrow Navigation */}
          <button
            onClick={() => {
              setCurrentSlide((prev) => (prev + 1) % heroImages.length);
              setSlideKey((k) => k + 1);
            }}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 md:p-3 rounded-full bg-black/50 hover:bg-[#A80000] text-white backdrop-blur-md border border-white/20 transition-all shadow-xl hover:scale-110 opacity-80 group-hover:opacity-100 cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 md:bottom-6 left-0 right-0 z-30 flex justify-center items-center gap-2.5">
            {heroImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentSlide(idx);
                  setSlideKey((k) => k + 1);
                }}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlide === idx ? "bg-[#F4C542] w-8 shadow-lg shadow-yellow-500/50" : "bg-white/50 w-2.5 hover:bg-white"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Realistic Flower Pot Canvas */}
      <canvas 
        id="flower-pot-canvas" 
        className="fixed inset-0 pointer-events-none z-[45] opacity-90"
      />

      {/* Background Fireworks Canvas */}
      <Fireworks
        options={{
          rocketsPoint: { min: 0, max: 100 },
          hue: { min: 0, max: 360 },
          // Balanced multi-shot: moderate delay, lower speed
          delay: isMobileView ? { min: 30, max: 50 } : { min: 30, max: 60 },

          acceleration: 1.05,
          friction: 0.97,
          gravity: 1.5,
          particles: isMobileView ? 30 : 50,
          traceLength: 3,
          traceSpeed: isMobileView ? 4 : 10, // Reduced speed
          explosion: isMobileView ? 4 : 5,
          intensity: isMobileView ? 15 : 30, // Reduced intensity slightly to prevent chaos
          flickering: 50,
          lineStyle: 'round',
          lineWidth: { explosion: { min: 1, max: 3 }, trace: { min: 1, max: 2 } },
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
          background: 'transparent',
          zIndex: 40,
          pointerEvents: 'none',
          opacity: 0.5
        }}
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
            {(products.length > 0 ? products.slice(0, 6) : staticBestSellers).map((item: any, idx: number) => {
              const stockVal = item.storeStockPieces !== undefined ? item.storeStockPieces : (item.stock !== undefined ? item.stock : 0);
              const isOutOfStock = stockVal <= 0;
              const displayImg = isOutOfStock ? '/saiyogi-logo-1.png' : (item.image || "/sky_rocket_box.png");
              return (
                <div
                  key={`bestseller-${item._id || item.id || idx}`}
                  className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col items-center text-center shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative"
                >
                  <div className="w-full aspect-square bg-gray-50 flex items-center justify-center p-2 mb-3 rounded-xl overflow-hidden relative">
                    <img src={displayImg} alt={item.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                    {isOutOfStock ? (
                      <span className="absolute top-1.5 left-1.5 bg-gray-900 text-white font-black text-[8px] px-2 py-0.5 rounded-full uppercase">
                        Sold Out
                      </span>
                    ) : (
                      <span className="absolute top-1.5 left-1.5 bg-[#A80000] text-[#F4C542] font-black text-[8px] px-2 py-0.5 rounded-full uppercase">
                        HOT
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-xs text-gray-800 uppercase text-center line-clamp-2 min-h-[32px] mb-2">{item.name}</h3>
                  <div className="text-[#A80000] font-black text-sm mb-3">₹{item.price}</div>
                  <button
                    onClick={() => !isOutOfStock && addToCart(item)}
                    disabled={isOutOfStock}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1 ${
                      isOutOfStock
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#A80000] text-white hover:bg-[#F4C542] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                    }`}
                  >
                    <ShoppingCart className="w-3 h-3" /> {isOutOfStock ? "Sold Out" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Videos Section */}
      <section className="py-16 bg-gradient-to-b from-white to-[#FFF6E5] overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <span className="bg-[#A80000]/10 text-[#A80000] text-[10px] font-black px-3.5 py-1.5 uppercase tracking-widest mb-3 inline-block rounded-full">
              ✨ Watch the Magic ✨
            </span>
            <h2 className="font-black text-[#A80000] text-2xl md:text-3xl uppercase tracking-widest mb-2 font-display">
              Fireworks Showcase
            </h2>
            <p className="text-gray-500 text-xs mt-2 max-w-md mx-auto">
              Click on any video to watch our premium Sivakasi crackers light up the night sky!
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            {/* Left Button */}
            <button
              onClick={() => scrollVideos('left')}
              className="absolute -left-2 md:-left-6 z-20 w-10 h-10 rounded-full bg-white/90 text-[#A80000] border border-gray-200 flex items-center justify-center shadow-lg hover:bg-[#F4C542] hover:text-[#1A1A1A] transition-all cursor-pointer"
              aria-label="Scroll Left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Continuous Horizontal Moving Videos Container */}
            <div 
              ref={videoScrollRef}
              className="w-full overflow-x-auto no-scrollbar scroll-smooth py-4 px-2 select-none"
            >
              <div 
                className={`flex flex-nowrap gap-3 sm:gap-6 w-max animate-marquee ${
                  playingVideo ? "paused" : "hover:[animation-play-state:paused]"
                }`}
                style={playingVideo ? { animationPlayState: 'paused' } : undefined}
              >
                {(() => {
                  const baseVideos = settings.youtubeVideos && settings.youtubeVideos.length > 0 ? settings.youtubeVideos : demoVideos;
                  const allVideos = [...baseVideos, ...baseVideos, ...baseVideos];

                  const getYouTubeId = (url: string) => {
                    if (!url) return null;
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
                    const match = url.match(regExp);
                    return (match && match[2].length === 11) ? match[2] : null;
                  };

                  return allVideos.map((video: any, idx: number) => {
                    const isYouTube = video.url && video.url.includes('youtu');
                    const ytId = isYouTube ? getYouTubeId(video.url) : null;
                    const videoId = isYouTube ? (ytId || `yt-${idx}`) : (video.id || `vid-${idx}`);
                    const isPlaying = playingVideo === `${videoId}-${idx}`;
                    const thumbnail = (isYouTube && ytId) ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : (video.thumbnail || "/fireworks_bg.png");

                    return (
                      <div
                        key={`showcase-video-${idx}`}
                        className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-video bg-black group cursor-pointer shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-white/40 min-w-[210px] sm:min-w-[280px] md:min-w-[360px] shrink-0"
                        onClick={() => setPlayingVideo(isPlaying ? null : `${videoId}-${idx}`)}
                      >
                        {isPlaying ? (
                          <>
                            {isYouTube && ytId ? (
                              <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
                                title={video.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                              ></iframe>
                            ) : (
                              <video
                                src={video.url}
                                autoPlay
                                onPause={() => setPlayingVideo(null)}
                                onEnded={() => setPlayingVideo(null)}
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlayingVideo(null);
                              }}
                              className="absolute top-2 right-2 z-30 w-7 h-7 bg-black/70 hover:bg-[#A80000] text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer shadow-md"
                              title="Stop Video & Resume Scroll"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <img
                            src={thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity"
                          />
                        )}

                        {/* Button overlay */}
                        {!isPlaying && (
                          <div className="absolute inset-0 flex flex-col justify-between p-2.5 sm:p-4 bg-gradient-to-t from-black/70 via-transparent to-black/30">
                            <span className="text-white font-bold text-[10px] sm:text-xs bg-black/50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full backdrop-blur-sm self-start truncate max-w-[85%]">
                              {video.title}
                            </span>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-[#A80000] group-hover:border-red-500">
                                <Play className="text-white fill-white w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Right Button */}
            <button
              onClick={() => scrollVideos('right')}
              className="absolute -right-2 md:-right-6 z-20 w-10 h-10 rounded-full bg-white/90 text-[#A80000] border border-gray-200 flex items-center justify-center shadow-lg hover:bg-[#F4C542] hover:text-[#1A1A1A] transition-all cursor-pointer"
              aria-label="Scroll Right"
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
                onClick={() => window.location.href = `/catalog?category=${cat.id || cat._id}`}
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
      
      {/* Trusted Manufacturers */}
      <section className="py-16 bg-gradient-to-b from-white to-[#FFF6E5]">
        <div className="text-center mb-10 px-4">
          <span className="bg-[#A80000]/10 text-[#A80000] text-[10px] font-black px-3.5 py-1.5 uppercase tracking-widest mb-3 inline-block rounded-full">
            ⭐ AUTHENTIC PARTNERS ⭐
          </span>
          <h2 className="font-black text-[#A80000] text-2xl uppercase tracking-widest mb-2 font-display">Trusted Manufacturers</h2>
          <p className="text-gray-500 text-xs mt-1">We are supplying high quality fireworks from top brands in Sivakasi.</p>
        </div>

        {/* Infinite horizontal scrolling marquee for mobile and desktop */}
        <div className="relative w-full overflow-hidden py-4">
          <div className="flex flex-nowrap gap-6 animate-marquee hover:[animation-play-state:paused] w-max select-none">
            {(() => {
              const activeBrandsList = brands.length > 0 ? brands : manufacturers;
              const displayList = [...activeBrandsList, ...activeBrandsList, ...activeBrandsList, ...activeBrandsList];

              return displayList.map((brand: any, i: number) => {
                const logoSrc = brand.logo || brand.image;
                const isImageLogo = logoSrc && (logoSrc.startsWith('/') || logoSrc.startsWith('http') || logoSrc.startsWith('data:'));

                return (
                  <div
                    key={`${brand.name || 'brand'}-${i}`}
                    onClick={() => window.location.href = `/catalog?search=${encodeURIComponent(brand.name)}`}
                    className="bg-white border-2 border-gray-100/80 rounded-2xl px-6 py-4 flex items-center gap-4 min-w-[220px] shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-xl hover:border-[#A80000]/30 transition-all duration-300 hover:-translate-y-1 hover:bg-gradient-to-br hover:from-[#A80000] hover:to-[#8a0000] hover:text-white group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A80000] to-[#750000] text-white flex items-center justify-center font-black text-xs tracking-wider shrink-0 transition-all duration-300 group-hover:from-[#F4C542] group-hover:to-[#d4a215] group-hover:text-[#1A1A1A] overflow-hidden p-1 bg-white border border-gray-200">
                      {isImageLogo ? (
                        <img src={logoSrc} alt={brand.name} className="w-full h-full object-contain rounded-full" />
                      ) : (
                        <span className="font-black text-xs">{brand.logo || brand.name?.substring(0, 2)?.toUpperCase() || "BR"}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="font-black text-[9px] text-[#A80000]/80 tracking-widest uppercase transition-colors duration-300 group-hover:text-[#F4C542]">
                        PARTNER
                      </span>
                      <span className="font-black text-sm text-gray-800 tracking-wider uppercase transition-colors duration-300 group-hover:text-white whitespace-nowrap">
                        {brand.name}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </section>
      {/* Shop By Brand */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="text-center mb-10 container mx-auto px-4">
          <h2 className="font-black text-[#7A1416] text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight mb-2 drop-shadow-2xs font-display">
            Shop By Brand
          </h2>
          <p className="text-gray-600 text-xs font-bold uppercase tracking-wider max-w-xl mx-auto">
            We supply 100% genuine and high quality fireworks directly from Sivakasi's top trusted manufacturers.
          </p>
        </div>

        {/* Infinite scrolling brands marquee from right to left */}
        <div className="relative w-full overflow-hidden py-4">
          <div className="flex flex-nowrap gap-6 animate-marquee hover:[animation-play-state:paused] w-max select-none">
            {[...(brands.length > 0 ? brands : shopByBrands), ...(brands.length > 0 ? brands : shopByBrands), ...(brands.length > 0 ? brands : shopByBrands)].map((brand: any, i: number) => {
              const brandId = brand._id || brand.id || i;
              return (
                <div
                  key={`${brandId}-${i}`}
                  onClick={() => window.location.href = `/catalog?search=${encodeURIComponent(brand.name)}`}
                  className="bg-gradient-to-b from-white to-amber-50/30 border border-gray-200 hover:border-[#7A1416] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-between text-center shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1 w-[130px] sm:w-[160px] md:w-[180px] shrink-0"
                >
                  <span className="text-[8px] sm:text-[9px] font-extrabold text-[#7A1416] bg-red-50 border border-red-100 px-1.5 sm:px-2 py-0.5 rounded-full mb-1.5 sm:mb-2 font-mono">
                    {brand.tag || "BRAND"}
                  </span>
                  <div className="w-full aspect-square flex items-center justify-center p-1 sm:p-2 mb-1 sm:mb-2 group-hover:scale-105 transition-transform duration-300">
                    <img src={brand.logo || brand.image || "/sky_rocket_box.png"} alt={brand.name} className="max-w-full max-h-full object-contain drop-shadow-md" />
                  </div>
                  <div>
                    <h3 className="font-black text-[11px] sm:text-sm text-gray-800 uppercase tracking-wide group-hover:text-[#7A1416] transition-colors line-clamp-1">{brand.name}</h3>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium mt-0.5 line-clamp-1">{brand.subtitle || brand.description || "Original Sivakasi"}</p>
                  </div>
                </div>
              );
            })}
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
                const comboPacksList = (products.filter(p => p.name.toLowerCase().includes('combo') || p.name.toLowerCase().includes('pack')).length > 0
                  ? products.filter(p => p.name.toLowerCase().includes('combo') || p.name.toLowerCase().includes('pack'))
                  : staticFamilyPacks) as any[];

                const idx = (comboIndex + offset) % comboPacksList.length;
                const item = comboPacksList[idx] as any;
                const itemId = item.id || item._id;
                const cartItem = cartItems.find((i) => (i.product._id || i.product.id) === itemId);
                const quantity = cartItem?.quantity || 0;
                const stockVal = item.storeStockPieces !== undefined ? item.storeStockPieces : (item.stock !== undefined ? item.stock : 0);
                const isOutOfStock = stockVal <= 0;
                const displayImg = isOutOfStock ? '/saiyogi-logo-1.png' : (item.image || "/sky_rocket_box.png");

                return (
                  <div
                    key={`combo-${offset}-${item._id || item.id || offset}`}
                    className={`bg-[#FFFFFF] border-2 border-amber-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md hover:shadow-2xl transition-all duration-300 flex-col items-center text-center relative group hover:-translate-y-1 overflow-hidden max-w-[290px] sm:max-w-none mx-auto w-full ${
                      offset > 0 ? "hidden md:flex" : "flex"
                    }`}
                  >
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-gradient-to-r from-[#A80000] to-[#5c0a0b] text-[#F4C542] font-black text-[9px] sm:text-[10px] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full uppercase shadow-md">
                      SAVE BIG
                    </div>

                    <div className="w-full aspect-[4/3] bg-gray-50 flex items-center justify-center p-2 sm:p-4 mb-2.5 sm:mb-4 rounded-xl sm:rounded-2xl overflow-hidden">
                      <img src={displayImg} alt={item.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900 uppercase mb-1.5 sm:mb-2 line-clamp-1">{item.name}</h3>

                    <div className="flex gap-2 sm:gap-3 items-center mb-3 sm:mb-5">
                      {item.oldPrice && (
                        <span className="text-gray-400 line-through text-xs font-bold">₹{item.oldPrice}</span>
                      )}
                      <span className="text-[#A80000] font-black text-lg sm:text-xl">₹{item.price}</span>
                    </div>
                    {quantity > 0 ? (
                      <div className="flex items-center justify-between bg-red-50/50 border border-red-200/50 rounded-xl p-1.5 w-full mt-auto" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => updateQuantity(itemId, quantity - 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-white text-[#A80000] font-black hover:bg-red-50 transition-colors shadow-sm text-xs sm:text-base"
                        >
                          -
                        </button>
                        <span className="font-black text-xs sm:text-sm text-[#A80000] px-2">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(itemId, quantity + 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-[#A80000] text-white font-black hover:bg-red-800 transition-colors shadow-sm text-xs sm:text-base"
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
                        className="w-full bg-[#A80000] hover:bg-[#F4C542] hover:text-[#1A1A1A] text-white font-black text-[10px] sm:text-xs py-2.5 sm:py-3.5 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] mt-auto"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
              <div className="relative border-4 border-[#F4C542] rounded-full bg-white flex flex-col items-center justify-center text-center w-24 h-24 shadow-[0_0_20px_rgba(244,197,66,0.3)] shrink-0 select-none overflow-hidden p-2">
                <img src={settings?.logo || companyLogo} alt="Sai Yogi Crackers" className="w-full h-full object-contain" />
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
              <div className="relative border-4 border-[#F4C542] rounded-full bg-white flex flex-col items-center justify-center text-center w-24 h-24 shadow-[0_0_20px_rgba(244,197,66,0.3)] shrink-0 select-none overflow-hidden p-2">
                <img src={settings?.logo || companyLogo} alt="Sai Yogi Crackers" className="w-full h-full object-contain" />
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
              <div className="relative border-4 border-white rounded-full bg-white flex flex-col items-center justify-center text-center w-24 h-24 shadow-lg shrink-0 select-none overflow-hidden p-2">
                <img src={settings?.logo || companyLogo} alt="Sai Yogi Crackers" className="w-full h-full object-contain" />
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
