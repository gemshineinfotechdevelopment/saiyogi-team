import { Link } from "react-router-dom";
import { ChevronDown, ShieldCheck, Package, Truck, Headphones, ShoppingBag, ShoppingCart, Plus, Minus } from "lucide-react";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { useState } from "react";

const comboPacks = [
  {
    id: "combo-1",
    name: "Family Star Kit",
    title: "Family Star Kit",
    badge: "38% OFF",
    badgeColor: "bg-[#A80000] text-[#F4C542]",
    image: "/family_star_kit.png",
    price: 2499,
    discountPrice: 1549,
    description: "A perfect mix of 45 items including Ground Spinners, Sparklers, and Flower Pots.",
    category: "Combo Packs",
    brand: "Standard",
    storeStockPieces: 50,
  },
  {
    id: "combo-2",
    name: "Grand Sky Delight",
    title: "Grand Sky Delight",
    badge: "Bestseller",
    badgeColor: "bg-black text-[#F4C542]",
    image: "/grand_sky_delight.png",
    price: 4999,
    discountPrice: 3499,
    description: "Elite 75-item collection featuring heavy Aerial Shots and Premium Flower Pots.",
    category: "Combo Packs",
    brand: "Standard",
    storeStockPieces: 35,
  },
  {
    id: "combo-3",
    name: "Kids Joy Bundle",
    title: "Kids Joy Bundle",
    badge: "Kids Special",
    badgeColor: "bg-green-600 text-white",
    image: "/kids_joy_bundle.png",
    price: 1899,
    discountPrice: 1199,
    description: "Noise-free and light-focused 30-item kit designed specifically for young ones.",
    category: "Combo Packs",
    brand: "Standard",
    storeStockPieces: 40,
  },
  {
    id: "combo-4",
    name: "Royal Celebration",
    title: "Royal Celebration",
    subtitle: "Mega Gathering Pack",
    badge: "Wholesale",
    badgeColor: "bg-[#A80000] text-white",
    image: "/royal_celebration.png",
    price: 8999,
    discountPrice: 5999,
    description: "Massive 120-item mega combo for large gatherings and community celebrations.",
    category: "Combo Packs",
    brand: "Standard",
    storeStockPieces: 20,
  },
];

const ComboPacks = () => {
  const [email, setEmail] = useState("");
  const { items, addToCart, updateQuantity, totalPrice, totalItems } = useCart();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("Thank you for subscribing!");
      setEmail("");
    }
  };

  const handleAddToCart = (pack: typeof comboPacks[0]) => {
    const product = {
      _id: pack.id,
      id: pack.id,
      name: pack.name,
      price: pack.discountPrice,
      image: pack.image,
      category: pack.category,
      brand: pack.brand,
      storeStockPieces: pack.storeStockPieces,
      hasDiscount: false,
      netRate: pack.discountPrice,
      displayNetRate: true,
    };
    addToCart(product as any);
    toast.success(`${pack.name} added to cart!`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF6E5] font-sans text-gray-900 antialiased">
      {/* Header Component */}
      <UserHeader />

      {/* Hero Section */}
      <section className="relative w-full h-[340px] md:h-[480px] bg-black overflow-hidden flex items-center justify-center">
        {/* Background Fireworks Banner */}
        <div className="absolute inset-0 z-0">
          <img
            src="/celebration_hero.png"
            alt="Celebration Combos"
            className="w-full h-full object-cover opacity-65"
          />
          {/* Subtle 3-Panel Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />
          <div className="absolute inset-0 grid grid-cols-3 divide-x divide-white/10 pointer-events-none opacity-30">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 container mx-auto px-4 max-w-4xl text-center flex flex-col items-center justify-center">
          {/* Sivakasi's Finest Heritage Pill */}
          <div className="inline-flex items-center px-4 py-1 rounded-full border border-[#F4C542] bg-black/40 text-[#F4C542] text-[11px] font-bold tracking-widest uppercase mb-4 shadow-sm">
            SIVAKASI'S FINEST HERITAGE
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-md">
            Celebration Combos
          </h1>

          {/* Subtitle */}
          <p className="text-xs md:text-sm text-gray-200 max-w-2xl leading-relaxed opacity-95">
            Curated bundles of Joy, Brilliance, and Safety for every family occasion.
            <br className="hidden sm:inline" /> Experience the traditional festive spirit of Sivakasi delivered to your doorstep.
          </p>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-white border-b border-gray-200 py-4 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            {/* Feature 1 */}
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#A80000] bg-[#FFF6E5] shrink-0 border border-[#A80000]/10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xs text-gray-900 leading-tight">Quality Tested</span>
                <span className="text-[10px] text-gray-500 font-medium">Sivakasi Standard</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#A80000] bg-[#FFF6E5] shrink-0 border border-[#A80000]/10">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xs text-gray-900 leading-tight">Secure Packing</span>
                <span className="text-[10px] text-gray-500 font-medium">Damage proof Box</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#A80000] bg-[#FFF6E5] shrink-0 border border-[#A80000]/10">
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xs text-gray-900 leading-tight">Track Order</span>
                <span className="text-[10px] text-gray-500 font-medium">Real time Updates</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#A80000] bg-[#FFF6E5] shrink-0 border border-[#A80000]/10">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xs text-gray-900 leading-tight">Direct Inquiry</span>
                <span className="text-[10px] text-gray-500 font-medium">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
        {/* Floating Current Estimate Floating Bar */}
        <div className="flex justify-end mb-8">
          <div className="inline-flex items-center gap-3 bg-[#A80000] text-white px-4.5 py-2.5 rounded-full shadow-lg border border-[#A80000]/10">
            <div className="relative flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#F4C542] fill-[#F4C542]" />
              <span className="absolute -top-1 -right-1.5 bg-[#25D366] text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-extrabold">
                {totalItems > 0 ? totalItems : 4}
              </span>
            </div>
            <div className="flex flex-col text-left text-xs">
              <span className="text-[9px] text-red-100 tracking-wider font-semibold uppercase">CURRENT ESTIMATE</span>
              <span className="font-extrabold text-sm text-white leading-tight">
                ₹{totalPrice > 0 ? totalPrice.toLocaleString() : "5,498.00"}
              </span>
            </div>
            <Link to="/cart">
              <button className="bg-[#F4C542] hover:bg-white text-[#1A1A1A] hover:text-[#A80000] text-xs font-extrabold px-4 py-2 rounded-full transition-all duration-300 ml-2 shadow-md">
                Checkout Now
              </button>
            </Link>
          </div>
        </div>

        {/* Section Header: Best Value Combo Packs & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              Best Value Combo Packs
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              The most popular collections for Deepavali 2024
            </p>
          </div>

          <div className="flex items-center">
            <button className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 text-xs px-4 py-2 rounded-xl shadow-xs hover:bg-gray-50 font-bold transition-all">
              <span>Filter By Price</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Product Cards Grid (4 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {comboPacks.map((pack) => {
            const cartItem = items.find((i) => (i.product._id || i.product.id) === pack.id);
            const quantity = cartItem?.quantity || 0;

            return (
              <div
                key={pack.id}
                className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 overflow-hidden shadow-lg hover:shadow-2xl hover:border-[#F4C542]/40 hover:scale-[1.03] transition-all duration-300 flex flex-col relative group"
              >
                {/* Top-Left Badge overlay */}
                <div className="absolute top-3 left-3 z-20">
                  <span
                    className={`text-[9px] font-black px-2.5 py-1 rounded-lg ${pack.badgeColor} uppercase tracking-wider shadow-md`}
                  >
                    {pack.badge}
                  </span>
                </div>

                {/* Product Image */}
                <div className="w-full aspect-[4/3] bg-gray-50 flex items-center justify-center p-2 rounded-t-2xl overflow-hidden shrink-0 h-44">
                  <img
                    src={pack.image}
                    alt={pack.title}
                    className="max-w-full max-h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                {/* Product Info */}
                <div className="p-5 flex flex-col flex-1 bg-white/40">
                  <h3 className="font-extrabold text-sm text-gray-900 leading-snug group-hover:text-[#A80000] transition-colors line-clamp-1">
                    {pack.title}
                  </h3>

                  {pack.subtitle && (
                    <h4 className="font-bold text-[10px] text-[#A80000] uppercase mt-0.5 tracking-widest leading-none">
                      {pack.subtitle}
                    </h4>
                  )}

                  <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 mt-2 h-8">
                    {pack.description}
                  </p>

                  {/* Price Section */}
                  <div className="mt-auto pt-4 border-t border-gray-150 flex flex-col gap-3">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-[#A80000] text-base">
                          ₹{pack.discountPrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 line-through font-semibold">
                          ₹{pack.price.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[9px] text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                        Save ₹{(pack.price - pack.discountPrice).toLocaleString()}
                      </span>
                    </div>

                    {/* Add to Cart / Quantity Stepper */}
                    {quantity > 0 ? (
                      <div className="flex items-center justify-between bg-red-50/50 border border-red-200/50 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(pack.id, quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-[#A80000] font-black hover:bg-red-50 transition-colors shadow-sm"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black text-sm text-[#A80000] px-2">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(pack.id, quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#A80000] text-white font-black hover:bg-red-800 transition-colors shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(pack)}
                        className="w-full bg-[#A80000] hover:bg-[#F4C542] hover:text-[#1A1A1A] text-white font-black text-[10px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add To Cart</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Combos Button */}
        <div className="flex justify-center mb-10">
          <button className="bg-[#A80000] text-white hover:bg-[#F4C542] hover:text-[#1A1A1A] font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider">
            Load More Combos
          </button>
        </div>
      </main>

      {/* Large Events & Early Bird Offers Banner */}
      <section className="bg-gradient-to-br from-[#A80000] via-[#5c0a0b] to-[#1A1A1A] text-white py-16 px-4 border-t border-[#F4C542]/20 relative overflow-hidden">
        <div className="absolute top-0 left-10 w-24 h-24 bg-[#F4C542]/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Plan for Large Events */}
            <div className="flex flex-col items-start pr-0 lg:pr-8">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3 uppercase">
                Plan for Large Events?
              </h2>
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed mb-6 max-w-lg">
                We offer special pricing for weddings, corporate events, and large public displays. Our experts can help curate the perfect display for your venue.
              </p>
              <Link to="/contact">
                <button className="bg-[#F4C542] hover:bg-white text-black hover:text-[#A80000] font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider">
                  Inquire for Bulk Orders
                </button>
              </Link>
            </div>

            {/* Right: Get Early Bird Offers */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
              <h3 className="text-lg md:text-xl font-extrabold text-white mb-2">
                Get Early Bird Offers
              </h3>
              <p className="text-xs text-gray-300 mb-5 leading-relaxed">
                Sign up for our newsletter to receive exclusive festival discounts and safety guides.
              </p>

              <form onSubmit={handleSubscribe} className="flex items-center w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-2.5 text-xs text-gray-900 bg-white rounded-l-lg outline-none placeholder-gray-400 font-bold"
                />
                <button
                  type="submit"
                  className="bg-[#F4C542] hover:bg-white text-gray-900 text-xs font-black px-5 py-2.5 rounded-r-lg transition-colors shrink-0 cursor-pointer hover:text-[#A80000]"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Component */}
      <UserFooter />
    </div>
  );
};

export default ComboPacks;

