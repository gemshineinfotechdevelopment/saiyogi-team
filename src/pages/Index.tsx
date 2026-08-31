import { Link, useNavigate } from "react-router-dom";
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
import offerBanner from "@/assets/banner -1.jpeg";
import dayCrackersImg from "@/assets/daycrackers.png";
import giftBoxCrackersImg from "@/assets/giftboxcrackers.png";
import kidsCrackersImg from "@/assets/kidscrackers.png";
import nightCrackersImg from "@/assets/nightcrackers.png";
import comboPacksImg from "@/assets/combo-packs.png";
import { useState, useEffect, useRef } from "react";
import { getProducts, getCategories, getBrands, Brand } from "@/lib/api";
import { Product, Category } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { getUpcomingDiwaliInfo, calculateTimeLeft, UpcomingDiwaliInfo } from "@/lib/diwaliCountdown";
import { Fireworks } from '@fireworks-js/react';

// Our Products Section Data
const ourProducts = [
  { name: "Kids", image: kidsCrackersImg, link: "/catalog?category=Kids" },
  { name: "Day Crackers", image: dayCrackersImg, link: "/catalog?category=Day%20Crackers" },
  { name: "Night Crackers", image: nightCrackersImg, link: "/catalog?category=Night%20Crackers" },
  { name: "Gift Box", image: giftBoxCrackersImg, link: "/catalog?category=Gift%20Box" },
];


const premiumCategories = [
  { name: "Sparklers", image: "/saiyogi-logo-1.png", categoryId: "cat-1" },
  { name: "Flower Pots", image: "/saiyogi-logo-1.png", categoryId: "cat-2" },
  { name: "Rockets & Sky Shots", image: "/saiyogi-logo-1.png", categoryId: "cat-3" },
  { name: "Ground Chakkars", image: "/saiyogi-logo-1.png", categoryId: "cat-4" },
  { name: "Combo Packs", image: "/saiyogi-logo-1.png", categoryId: "cat-5" },
  { name: "Gift Boxes", image: "/saiyogi-logo-1.png", categoryId: "all" },
];

const demoVideos = [
  {
    id: 1,
    title: "1000 Wala Sky Shots - Grand Night Celebration",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/fireworks_bg.png"
  },
  {
    id: 2,
    title: "Multi Color Fountain Flower Pots Magic",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/fireworks_bg.png"
  },
  {
    id: 3,
    title: "Royal Celebration 120 Shots Aerial Show",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/fireworks_bg.png"
  },
  {
    id: 4,
    title: "Mega Sound Ground Chakkars & Electric Sparklers",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/fireworks_bg.png"
  },
  {
    id: 5,
    title: "Diwali Special Aerial Repeating Shots",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/fireworks_bg.png"
  }
];

const shopByBrands = [
  { name: "Standard", subtitle: "Standard Fireworks", tag: "Most Popular", image: "/saiyogi-logo-1.png" },
  { name: "Ajanta", subtitle: "Ajanta Pyrotechnics", tag: "Top Quality", image: "/saiyogi-logo-1.png" },
  { name: "Coronation", subtitle: "Coronation Sparklers", tag: "High Demand", image: "/saiyogi-logo-1.png" },
  { name: "Vadivel", subtitle: "Vadivel Fireworks", tag: "Sivakasi Original", image: "/saiyogi-logo-1.png" },
  { name: "Sony", subtitle: "Sony Crackers", tag: "Festive Special", image: "/saiyogi-logo-1.png" },
  { name: "Kaliswari", subtitle: "Sri Kaliswari Cock", tag: "Heritage Brand", image: "/saiyogi-logo-1.png" },
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
  const navigate = useNavigate();
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

  const [isMobileView, setIsMobileView] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hero image slideshow (right-to-left slide)
  const heroImages = settings?.heroBanners && settings.heroBanners.length > 0
    ? settings.heroBanners
    : [heroBanner1, heroBanner2, heroBanner3, heroBanner4];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideKey, setSlideKey] = useState(0);

  // Secondary notice slideshow
  const noticeImages = settings?.noticeBanners && settings.noticeBanners.length > 0
    ? settings.noticeBanners
    : [];
  const [currentNoticeSlide, setCurrentNoticeSlide] = useState(0);
  const [noticeSlideKey, setNoticeSlideKey] = useState(0);

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
    if (noticeImages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentNoticeSlide((cur) => {
        const next = (cur + 1) % noticeImages.length;
        setNoticeSlideKey((k) => k + 1);
        return next;
      });
    }, 6000); // Changes 2 seconds slower than the main banner
    return () => clearInterval(timer);
  }, [noticeImages.length]);

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
    const loadAll = () => {
      getProducts().then((prods) => {
        setProducts(Array.isArray(prods) ? prods : []);
      });
      getCategories().then((cats) => {
        setCategories(Array.isArray(cats) ? cats : []);
      });
      getBrands().then((b) => {
        setBrands(Array.isArray(b) ? b.filter((brand) => brand.isActive !== false) : []);
      });
    };

    loadAll();

    const interval = setInterval(loadAll, 5000);
    const onFocus = () => loadAll();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Listen for YouTube video ENDED (0), PAUSED (2), or UNSTARTED (-1) events to automatically resume marquee scrolling
  useEffect(() => {
    const handleYTMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        if (typeof data === "string") {
          if (!data.includes("playerState") && !data.includes("onStateChange") && !data.includes("infoDelivery")) {
            return;
          }
          data = JSON.parse(data);
        }
        if (!data) return;

        // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED, -1 = UNSTARTED
        const playerState = data.info?.playerState !== undefined
          ? data.info.playerState
          : (typeof data.info === 'number' ? data.info : undefined);

        if (playerState !== undefined) {
          if (playerState === 0 || playerState === 2 || playerState === -1) {
            setPlayingVideo(null);
          }
        }
      } catch (err) {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleYTMessage);
    return () => window.removeEventListener("message", handleYTMessage);
  }, []);





  return (
    <div className="min-h-screen flex flex-col bg-white relative font-sans">
      <UserHeader />

      {/* Hero Section */}
      <section className="bg-white pt-5 pb-4 md:pt-5 md:pb-[20px] select-none overflow-hidden">
        <div className="container mx-auto px-2 sm:px-2 lg:px-3 max-w-[1600px]">
          <div className="flex flex-col lg:flex-row w-full h-auto lg:h-[calc(100vh-200px)] lg:max-h-[650px] lg:min-h-[450px] gap-2 sm:gap-4">

            {/* Main Carousel (Left Side) */}
            <div className={`relative w-full ${noticeImages.length > 0 ? "lg:w-2/3 xl:w-3/4" : ""} h-[320px] sm:h-[450px] lg:h-full overflow-hidden bg-black group rounded-2xl shadow-xl border border-gray-200/50`}>
              {/* Full Width & Height Banner Image */}
              <div key={slideKey} className="absolute inset-0 w-full h-full animate-slide-left">
                <img
                  src={heroImages[currentSlide]}
                  alt={`Sai Yogi Crackers Banner ${currentSlide + 1}`}
                  className={`w-full h-full object-cover filter brightness-105 transition-all duration-500 ${currentSlide === 0 ? "object-[center_15%]" : "object-center"
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
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? "bg-[#F4C542] w-8 shadow-lg shadow-yellow-500/50" : "bg-white/50 w-2.5 hover:bg-white"
                      }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Notice Image Carousel (Right Side) */}
            {noticeImages.length > 0 && (
              <div className="w-full lg:w-1/3 xl:w-1/4 aspect-[2/3] sm:aspect-[3/4] lg:aspect-auto lg:h-full bg-black flex flex-col shadow-xl relative overflow-hidden z-20 rounded-2xl border border-gray-200/50 group">
                <div key={`notice-${noticeSlideKey}`} className="absolute inset-0 w-full h-full animate-slide-left">
                  <img
                    src={noticeImages[currentNoticeSlide]}
                    alt={`Notice Banner ${currentNoticeSlide + 1}`}
                    className="w-full h-full object-contain filter brightness-105 transition-all duration-500"
                  />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-10" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Supreme Court Order Disclaimer Marquee
      <div className="bg-red-600 text-white py-2 overflow-hidden flex items-center relative z-20">
        <div className="animate-marquee whitespace-nowrap text-sm md:text-base font-semibold tracking-wide flex items-center gap-4">
          <span>⚠️ As per the 2018 Supreme Court order, online sale of firecrackers is strictly prohibited. This website is intended for inquiry and catalog browsing purposes only. We process orders through official offline channels only. ⚠️</span>
          <span>⚠️ As per the 2018 Supreme Court order, online sale of firecrackers is strictly prohibited. This website is intended for inquiry and catalog browsing purposes only. We process orders through official offline channels only. ⚠️</span>
          <span>⚠️ As per the 2018 Supreme Court order, online sale of firecrackers is strictly prohibited. This website is intended for inquiry and catalog browsing purposes only. We process orders through official offline channels only. ⚠️</span>
        </div>
      </div> */}



      {/* Background Fireworks Canvas */}
      <Fireworks
        options={{
          rocketsPoint: { min: 0, max: 100 },
          hue: { min: 0, max: 360 },
          // Increased sky shots frequency and intensity for double sky cracker effect
          delay: isMobileView ? { min: 60, max: 90 } : { min: 50, max: 100 },

          acceleration: 1.05,
          friction: 0.97,
          gravity: 1.5,
          particles: isMobileView ? 25 : 45,
          traceLength: 3,
          traceSpeed: isMobileView ? 4 : 8,
          explosion: isMobileView ? 3 : 5,
          intensity: isMobileView ? 12 : 20, // Adjusted intensity for double cracker effect without being too crowded
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

      {/* Our Products Section */}
      <section className="py-6 sm:py-16 bg-white border-b border-gray-100 select-none">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-4 sm:mb-12">
            <h2 className="font-extrabold text-[#1A1A1A] text-xl sm:text-4xl md:text-5xl tracking-tight font-display">
              Our Products
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6 lg:gap-8">
            {ourProducts.map((item, idx) => (
              <div
                key={`our-product-${idx}`}
                onClick={() => navigate(item.link)}
                className="group cursor-pointer flex flex-col items-center"
              >
                <div className="w-full aspect-square overflow-hidden rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 bg-gray-50 transition-all duration-300 group-hover:shadow-xl group-hover:border-[#A80000]/20 group-hover:-translate-y-1">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h3 className="font-black text-xs sm:text-lg md:text-xl text-black text-center mt-2 sm:mt-4 tracking-tight transition-colors group-hover:text-[#A80000]">
                  {item.name}
                </h3>
              </div>
            ))}
          </div>

          {/* Festive Combo Packs Banner */}
          <div className="mt-4 sm:mt-8 w-full">
            <div
              onClick={() => navigate("/catalog?category=Combo%20Packs")}
              className="group cursor-pointer flex flex-col items-center"
              title="View Combo Packs"
            >
              <div className="w-full h-36 xs:h-44 sm:h-56 md:h-64 overflow-hidden rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 bg-gray-50 transition-all duration-300 group-hover:shadow-xl group-hover:border-[#A80000]/20 group-hover:-translate-y-1">
                <img
                  src={comboPacksImg}
                  alt="Combo Packs"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="font-black text-xs sm:text-lg md:text-xl text-black text-center mt-2 sm:mt-4 tracking-tight transition-colors group-hover:text-[#A80000]">
                Combo Packs
              </h3>
            </div>
          </div>
        </div>
      </section>


      {/* Videos Section */}
      <section className="py-16 bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl relative">

          {/* Left Garland Crackers Bursting Animation */}
          <div className="absolute -left-3 sm:left-0 md:-left-12 lg:-left-20 top-1/2 -translate-y-1/2 z-30 pointer-events-none hidden xs:flex flex-col items-center">
            <div className="relative">
              <img
                src="/garland_crackers.png"
                alt="Left Garland Crackers"
                className="w-14 sm:w-20 md:w-28 lg:w-36 h-auto drop-shadow-2xl animate-pulse"
              />
              {/* Bursting sparks effect at bottom */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#F4C542] rounded-full blur-md animate-ping opacity-90"></div>
                <div className="absolute inset-1 bg-red-600 rounded-full blur-xs animate-pulse opacity-80"></div>
                <div className="absolute w-5 h-5 bg-white rounded-full blur-[1px] animate-cracker-burst"></div>
                <span className="absolute w-2.5 h-2.5 bg-yellow-300 rounded-full animate-bounce -top-2 left-1 shadow-[0_0_10px_#facc15]"></span>
                <span className="absolute w-3 h-3 bg-red-500 rounded-full animate-ping -bottom-1 right-1 shadow-[0_0_12px_#ef4444]"></span>
                <span className="absolute w-2 h-2 bg-orange-400 rounded-full animate-pulse top-2 -left-2 shadow-[0_0_8px_#fb923c]"></span>
              </div>
            </div>
          </div>

          {/* Right Garland Crackers Bursting Animation */}
          <div className="absolute -right-3 sm:right-0 md:-right-12 lg:-right-20 top-1/2 -translate-y-1/2 z-30 pointer-events-none hidden xs:flex flex-col items-center">
            <div className="relative">
              <img
                src="/garland_crackers.png"
                alt="Right Garland Crackers"
                className="w-14 sm:w-20 md:w-28 lg:w-36 h-auto drop-shadow-2xl scale-x-[-1] animate-pulse"
              />
              {/* Bursting sparks effect at bottom */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#F4C542] rounded-full blur-md animate-ping opacity-90"></div>
                <div className="absolute inset-1 bg-red-600 rounded-full blur-xs animate-pulse opacity-80"></div>
                <div className="absolute w-5 h-5 bg-white rounded-full blur-[1px] animate-cracker-burst"></div>
                <span className="absolute w-2.5 h-2.5 bg-yellow-300 rounded-full animate-bounce -top-2 right-1 shadow-[0_0_10px_#facc15]"></span>
                <span className="absolute w-3 h-3 bg-red-500 rounded-full animate-ping -bottom-1 left-1 shadow-[0_0_12px_#ef4444]"></span>
                <span className="absolute w-2 h-2 bg-orange-400 rounded-full animate-pulse top-2 -right-2 shadow-[0_0_8px_#fb923c]"></span>
              </div>
            </div>
          </div>

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
                className={`flex flex-nowrap gap-3 sm:gap-6 w-max animate-marquee-videos ${playingVideo ? "paused" : "hover:[animation-play-state:paused]"
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
                        className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-video bg-black group cursor-pointer shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl border border-white/40 min-w-[150px] sm:min-w-[210px] md:min-w-[260px] max-w-[270px] shrink-0"
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
                          <div className="absolute inset-0 flex flex-col justify-between p-2 sm:p-3 bg-gradient-to-t from-black/70 via-transparent to-black/30">
                            <span className="text-white font-bold text-[9px] sm:text-[11px] bg-black/50 px-2 sm:px-2.5 py-0.5 rounded-full backdrop-blur-sm self-start truncate max-w-[85%]">
                              {video.title}
                            </span>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-[#A80000] group-hover:border-red-500">
                                <Play className="text-white fill-white w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
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
      <section className="py-8 sm:py-16 bg-white border-b border-gray-100">
        <div className="text-center mb-5 sm:mb-10 container mx-auto px-4">
          <h2 className="font-black text-[#A80000] text-xl sm:text-3xl md:text-4xl uppercase tracking-tight mb-1 sm:mb-2 font-display">
            Shop By Category
          </h2>
          <p className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            Explore our wide selection of premium fireworks crafted for spectacular celebrations
          </p>
        </div>

        {/* Infinite scrolling categories marquee */}
        <div className="relative w-full overflow-hidden py-2 sm:py-4 mb-4 sm:mb-8">
          <div className="flex flex-nowrap gap-2 sm:gap-6 animate-marquee-categories hover:[animation-play-state:paused] w-max select-none">
            {[...(categories.length > 0 ? categories : premiumCategories), ...(categories.length > 0 ? categories : premiumCategories), ...(categories.length > 0 ? categories : premiumCategories)].map((cat: any, i: number) => {
              const categoryParam = cat.name || cat.id || cat._id || cat.categoryId || '';
              return (
                <div
                  key={`${cat.id || cat._id || cat.name || 'cat'}-${i}`}
                  onClick={() => navigate(`/catalog?category=${encodeURIComponent(categoryParam)}`)}
                  className="bg-white border border-gray-200 p-2 sm:p-4 flex flex-col items-center text-center shadow-md rounded-lg sm:rounded-2xl w-[105px] sm:w-[160px] md:w-[200px] shrink-0 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-[#A80000]/20 group cursor-pointer"
                >
                <div className="w-full aspect-square bg-gray-50 flex items-center justify-center p-1 sm:p-2 mb-1.5 sm:mb-3 rounded-md sm:rounded-xl overflow-hidden relative border border-gray-100/50">
                  <img
                    src={cat.image || "/saiyogi-logo-1.png"}
                    alt={cat.name}
                    className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                  <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-[#A80000] text-[#F4C542] font-black text-[7px] sm:text-[9px] px-1 sm:px-2.5 py-0.5 rounded-full shadow uppercase">
                    SHOP
                  </span>
                </div>
                <h3 className="font-bold text-[9px] sm:text-xs text-gray-800 uppercase text-center min-h-[22px] sm:min-h-[32px] line-clamp-2 transition-colors group-hover:text-[#A80000] mb-1.5 sm:mb-3">{cat.name}</h3>

                <div className="w-full mt-auto">
                  <button className="w-full bg-[#A80000] text-white py-0.5 sm:py-1.5 rounded-sm sm:rounded-lg text-[8px] sm:text-xs font-bold hover:bg-[#F4C542] hover:text-[#1A1A1A] transition-colors uppercase">
                    View Products
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </section>

      {/* Shop By Brand */}
      <section className="py-8 sm:py-16 bg-white border-b border-gray-100">
        <div className="text-center mb-5 sm:mb-10 container mx-auto px-4">
          <h2 className="font-black text-[#A80000] text-xs sm:text-2xl uppercase tracking-widest mb-1 sm:mb-2 font-display">Trusted Manufacturers</h2>
          <h2 className="font-black text-[#7A1416] text-xl sm:text-3xl md:text-5xl uppercase tracking-tight mb-1 sm:mb-2 drop-shadow-2xs font-display">
            Shop By Brand
          </h2>
          <p className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider max-w-xl mx-auto">
            We supply 100% genuine and high quality fireworks directly from Sivakasi's top trusted manufacturers.
          </p>
        </div>

        {/* Infinite scrolling brands marquee from right to left */}
        <div className="relative w-full overflow-hidden py-2 sm:py-4">
          <div className="flex flex-nowrap gap-2 sm:gap-6 animate-marquee-brands hover:[animation-play-state:paused] w-max select-none">
            {[...(brands.length > 0 ? brands : shopByBrands), ...(brands.length > 0 ? brands : shopByBrands), ...(brands.length > 0 ? brands : shopByBrands)].map((brand: any, i: number) => {
              const brandId = brand._id || brand.id || i;
              return (
                <div
                  key={`${brandId}-${i}`}
                  onClick={() => navigate(`/catalog?search=${encodeURIComponent(brand.name)}`)}
                  className="bg-white border border-gray-200 hover:border-[#7A1416] rounded-lg sm:rounded-2xl p-1.5 sm:p-4 flex flex-col items-center justify-between text-center shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1 w-[100px] sm:w-[150px] md:w-[180px] shrink-0"
                >
                  <span className="text-[6px] sm:text-[9px] font-extrabold text-[#7A1416] bg-red-50 border border-red-100 px-1 sm:px-2 py-0.5 rounded-full mb-0.5 sm:mb-2 font-mono">
                    {brand.tag || "BRAND"}
                  </span>
                  <div className="w-full aspect-square flex items-center justify-center p-0.5 sm:p-2 mb-0.5 sm:mb-2 group-hover:scale-105 transition-transform duration-300">
                    <img src={brand.logo || brand.image || "/saiyogi-logo-1.png"} alt={brand.name} className="max-w-full max-h-full object-contain drop-shadow-md" />
                  </div>
                  <div>
                    <h3 className="font-black text-[9px] sm:text-sm text-gray-800 uppercase tracking-wide group-hover:text-[#7A1416] transition-colors line-clamp-1">{brand.name}</h3>
                    <p className="text-[7px] sm:text-[10px] text-gray-500 font-medium mt-0.5 line-clamp-1">{brand.subtitle || brand.description || "Original Sivakasi"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Special Offer Banner */}
      <section className="py-6 sm:py-10 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            <img src={offerBanner} alt="Special Offer" className="w-full h-auto object-cover" />
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
