import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronDown, ShieldCheck, Package, Truck, Headphones, ShoppingBag } from "lucide-react";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { getProducts } from "@/lib/api";
import { Product } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";

const ComboPacks = () => {
  const [email, setEmail] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const { items, totalItems, totalPrice } = useCart();

  useEffect(() => {
    getProducts().then((prods) => {
      setProducts(Array.isArray(prods) ? prods : []);
    });
  }, []);

  const comboPacks = products.filter(p => p.name.toLowerCase().includes('combo') || p.name.toLowerCase().includes('pack'));

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert("Thank you for subscribing!");
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] font-sans text-gray-900 antialiased">
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
          <div className="inline-flex items-center px-4 py-1 rounded-full border border-[#E6C655] bg-black/40 text-[#E6C655] text-[11px] font-bold tracking-widest uppercase mb-4 shadow-sm">
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
      <section className="bg-white border-b border-gray-200 py-3.5 shadow-2xs">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            {/* Feature 1 */}
            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-[#6B0B0C] bg-red-50/40 shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xs text-gray-900 leading-tight">Quality Tested</span>
                <span className="text-[10px] text-gray-500">Sivakasi Standard</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-[#6B0B0C] bg-red-50/40 shrink-0">
                <Package className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xs text-gray-900 leading-tight">Secure Packing</span>
                <span className="text-[10px] text-gray-500">Damage proof Box</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-[#6B0B0C] bg-red-50/40 shrink-0">
                <Truck className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xs text-gray-900 leading-tight">Track Order</span>
                <span className="text-[10px] text-gray-500">Real time Updates</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-[#6B0B0C] bg-red-50/40 shrink-0">
                <Headphones className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xs text-gray-900 leading-tight">Direct Inquiry</span>
                <span className="text-[10px] text-gray-500">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Floating Current Estimate Floating Bar */}
        <div className="flex justify-end mb-6">
          <div className="inline-flex items-center gap-3 bg-[#4A0000] text-white px-4 py-2 rounded-full shadow-lg border border-red-900">
            <div className="relative flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <span className="absolute -top-1 -right-1.5 bg-green-600 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-extrabold">
                {totalItems}
              </span>
            </div>
            <div className="flex flex-col text-left text-xs">
              <span className="text-[9px] text-red-200 tracking-wider font-semibold uppercase">CURRENT ESTIMATE</span>
              <span className="font-extrabold text-sm text-white leading-tight">₹{totalPrice.toLocaleString()}</span>
            </div>
            <button className="bg-[#EAB308] hover:bg-yellow-400 text-black text-xs font-extrabold px-3.5 py-1.5 rounded-full transition-colors ml-2 shadow-xs cursor-pointer" onClick={() => document.getElementById('cart-trigger')?.click()}>
              Checkout Now
            </button>
          </div>
        </div>

        {/* Section Header: Best Value Combo Packs & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              Best Value Combo Packs
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              The most popular collections for Deepavali 2024
            </p>
          </div>

          <div className="flex items-center">
            <button className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 text-xs px-3.5 py-1.5 rounded shadow-2xs hover:bg-gray-50 font-medium">
              <span>Filter By Price</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Product Cards Grid (4 columns) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-10">
          {comboPacks.map((pack) => (
            <ProductCard key={pack.id || pack._id} product={pack} />
          ))}
        </div>

        {/* Load More Combos Button */}
        <div className="flex justify-center mb-10">
          <button className="border border-[#6B0B0C] text-[#6B0B0C] hover:bg-red-50 font-bold text-xs px-8 py-2.5 rounded shadow-2xs transition-colors">
            Load More Combos
          </button>
        </div>
      </main>

      {/* Large Events & Early Bird Offers Banner */}
      <section className="bg-[#4A0000] text-white py-12 px-4 border-t border-red-950">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Plan for Large Events */}
            <div className="flex flex-col items-start pr-0 lg:pr-8">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">
                Plan for Large Events?
              </h2>
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed mb-6 max-w-lg">
                We offer special pricing for weddings, corporate events, and large public displays. Our experts can help curate the perfect display for your venue.
              </p>
              <Link to="/contact">
                <button className="bg-[#F5D061] hover:bg-yellow-400 text-black font-extrabold text-xs px-5 py-2.5 rounded shadow-sm transition-colors cursor-pointer">
                  Inquire for Bulk Orders
                </button>
              </Link>
            </div>

            {/* Right: Get Early Bird Offers */}
            <div className="bg-[#380202] border border-red-900/60 rounded-xl p-6 md:p-8 shadow-inner">
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
                  className="flex-1 px-4 py-2.5 text-xs text-gray-900 bg-white rounded-l outline-none placeholder-gray-400 font-medium"
                />
                <button
                  type="submit"
                  className="bg-[#F0E1BD] hover:bg-white text-gray-900 text-xs font-black px-5 py-2.5 rounded-r transition-colors shrink-0 cursor-pointer"
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
