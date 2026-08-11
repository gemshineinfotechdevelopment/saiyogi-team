import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { getProducts, getCategories } from "@/lib/api";
import { Product, Category } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { toast } from "sonner";
import { Plus, Minus, ShoppingCart, Sparkles, ShoppingBag, Search, LogIn } from "lucide-react";
import QuickEnquiryFilters from "@/components/QuickEnquiryFilters";

const QuickEnquiry = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All Brands");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const { addToCart, updateQuantity, items, setIsCartOpen } = useCart();
  const { settings } = useSiteSettings();

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => {
    const dp = getDiscountPrice(
      item.product.price,
      item.product.hasDiscount,
      settings.discountPercent,
      item.product.netRate,
      item.product.displayNetRate
    );
    return acc + dp * item.quantity;
  }, 0);

  useEffect(() => {
    const loadAll = () => {
      Promise.all([getProducts(), getCategories()])
        .then(([prods, cats]) => {
          setProducts(Array.isArray(prods) ? prods : []);
          setCategories(Array.isArray(cats) ? cats : []);
        })
        .catch((err) => {
          console.error("Failed to load products/categories:", err);
        })
        .finally(() => setLoading(false));
    };

    loadAll();

    const interval = setInterval(loadAll, 15000);
    const onFocus = () => loadAll();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const uniqueBrands = useMemo(() => {
    const brands = new Set(products.map(p => p.brand).filter(Boolean));
    return ["All Brands", ...Array.from(brands)];
  }, [products]);

  const uniqueCategoryNames = useMemo(() => {
    return ["All Categories", ...categories.map(c => c.name)];
  }, [categories]);

  // Group and filter products
  const groupedProducts = useMemo(() => {
    let filtered = products;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    if (selectedBrand !== "All Brands") {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }

    const catMap: Record<string, { categoryName: string; items: Product[] }> = {};
    categories.forEach((cat) => {
      catMap[cat._id || cat.id] = { categoryName: cat.name.toUpperCase(), items: [] };
    });
    catMap["uncategorized"] = { categoryName: "OTHER PRODUCTS", items: [] };

    filtered.forEach((p) => {
      const cat = p.category as any;
      const catId = typeof cat === 'object' && cat !== null ? (cat._id || cat.id) : cat;
      const catName = categories.find(c => (c._id || c.id) === catId)?.name || "OTHER PRODUCTS";

      if (selectedCategory !== "All Categories" && catName !== selectedCategory) {
        return; // skip this product
      }

      if (catId && catMap[catId]) {
        catMap[catId].items.push(p);
      } else {
        catMap["uncategorized"].items.push(p);
      }
    });

    return Object.values(catMap).filter((g) => g.items.length > 0);
  }, [products, categories, searchQuery, selectedBrand, selectedCategory]);

  const handleQtyChange = (product: Product, delta: number) => {
    const pId = String(product._id || product.id || '');
    const existing = items.find((i) => String(i.product._id || i.product.id || '') === pId);
    const currentQty = existing ? existing.quantity : 0;
    const newQty = Math.max(0, currentQty + delta);

    if (newQty === 0) {
      updateQuantity(pId, 0);
    } else if (existing) {
      updateQuantity(pId, newQty);
    } else {
      addToCart(product, newQty);
    }
  };

  const [isNavbarHidden, setIsNavbarHidden] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 50 && currentScrollY > lastScrollY) {
        setIsNavbarHidden(true);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 20) {
        setIsNavbarHidden(false);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getProductQty = (productId: string) => {
    const existing = items.find((i) => String(i.product._id || i.product.id || '') === productId);
    return existing ? existing.quantity : 0;
  };
  return (
    <div className="min-h-screen flex flex-col bg-white relative font-sans">
      <UserHeader isHidden={isNavbarHidden} />

      <main className={`flex-1 w-full pb-12 px-0 transition-all duration-300 ${isNavbarHidden
        ? 'pt-[144px] md:pt-[64px]'
        : 'pt-[204px] md:pt-[172px]'
        }`}>
        {/* Sticky Filters & Cart Total Component */}
        <QuickEnquiryFilters
          selectedBrand={selectedBrand}
          setSelectedBrand={setSelectedBrand}
          uniqueBrands={uniqueBrands}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          uniqueCategoryNames={uniqueCategoryNames}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          totalPrice={totalPrice}
          totalItems={totalItems}
          isNavbarHidden={isNavbarHidden}
        />

        <div className="w-full bg-white shadow-xl border-y border-gray-150 rounded-none mb-8 mt-0">
          <div className="flex-1 container mx-auto px-0 md:px-4 pt-3 md:pt-4 pb-8">
            {/* Table Header Row */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 bg-[#f8f9fa] border border-gray-200 rounded-xl py-2.5 px-6 text-[10px] font-extrabold font-sans text-gray-700 uppercase tracking-wider items-center shadow-xs mb-3 md:mb-4">
              <div className="col-span-4 pl-2 text-left">PRODUCT NAME</div>
              <div className="col-span-2 text-center">ITEM CODE</div>
              <div className="col-span-2 text-center">CONTENT</div>
              <div className="col-span-1 text-center">UNIT PRICE</div>
              <div className="col-span-2 text-center">QUANTITY</div>
              <div className="col-span-1 text-right pr-4">TOTAL</div>
            </div>

            <div className="space-y-6 md:space-y-4">
              {loading ? (
                <div className="text-center py-10 text-gray-400 font-medium">Loading products...</div>
              ) : groupedProducts.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-medium">No products found.</div>
              ) : (
                groupedProducts.map((group, catIdx) => (
                  <div key={catIdx} className="md:bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-100 overflow-hidden">
                    <div className="bg-[#A80000] text-white px-4 py-2 text-sm font-extrabold uppercase tracking-wider font-sans flex items-center rounded-lg md:rounded-none md:rounded-t-lg mx-2 md:mx-0">
                      <span className="mr-2 opacity-80 text-lg leading-none mt-[-2px]">•</span>
                      {group.categoryName}
                    </div>

                    <div className="flex flex-col bg-white font-sans">
                      {group.items.map((item, index) => {
                        const pId = String(item._id || item.id || '');
                        const dp = getDiscountPrice(item.price, item.hasDiscount, settings.discountPercent, item.netRate, item.displayNetRate);
                        const qty = getProductQty(pId);
                        const lineTotal = dp * qty;
                        const isEven = index % 2 === 0;
                        const bgColor = isEven ? 'bg-white' : 'bg-[rgb(254 242 242 / 0.3)]';
                        const stockVal = item.storeStockPieces !== undefined ? item.storeStockPieces : (item.stock || 0);
                        const isOutOfStock = stockVal <= 0;
                        const displayImg = isOutOfStock ? '/saiyogi-logo-1.png' : (item.image || '/saiyogi-logo-1.png');

                        const mobileView = (
                          <div className={`md:hidden p-4 flex gap-3 ${bgColor} border-b border-gray-100 last:border-0 mx-2 md:mx-0 rounded-lg md:rounded-none mb-2 md:mb-0 shadow-sm md:shadow-none font-sans`}>
                            <div className="w-[72px] shrink-0 flex flex-col items-center gap-2">
                              <div className="w-[72px] h-[72px] bg-white border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer relative" onClick={() => setActiveImage(displayImg)}>
                                <img src={displayImg} alt={item.name} className="max-w-full max-h-full object-contain p-1" />
                              </div>
                              <div className="bg-[#fef2f2] text-[#A80000] text-[9px] font-extrabold text-center px-2 py-1 rounded-md w-full whitespace-nowrap font-sans">
                                {item.quantity || "1 Item"}
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-between py-0.5">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <div className="font-extrabold text-gray-900 text-[13px] leading-snug uppercase font-sans tracking-wide">{item.name}</div>
                                  <p className="text-gray-500 text-[10px] font-bold mt-0.5 font-sans tracking-wider">#{pId.substring(0, 8).toUpperCase()}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="font-extrabold text-[#D35400] text-[13px] font-sans">₹{dp.toLocaleString('en-IN')}</div>
                                  {(item.hasDiscount || settings.discountPercent > 0) && item.price > dp && (
                                    <div className="text-[10px] text-gray-400 line-through font-semibold font-sans">₹{item.price.toLocaleString('en-IN')}</div>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-between items-center mt-3">
                                <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-2xs h-8 font-sans">
                                  <button onClick={() => handleQtyChange(item, -1)} className="w-8 h-full flex items-center justify-center text-[#A80000] hover:bg-[#A80000] hover:text-white transition-colors rounded-l-lg font-bold text-base leading-none pb-0.5">
                                    -
                                  </button>
                                  <div className="w-8 text-center font-extrabold text-sm text-gray-800 border-x border-gray-100 flex items-center justify-center h-full font-sans">{qty}</div>
                                  <button onClick={() => handleQtyChange(item, 1)} className="w-8 h-full flex items-center justify-center text-[#A80000] hover:bg-[#A80000] hover:text-white transition-colors rounded-r-lg font-bold text-base leading-none pb-0.5">
                                    +
                                  </button>
                                </div>

                                <div className="font-extrabold text-[#A80000] text-[15px] font-sans">
                                  {lineTotal > 0 ? `₹ ${lineTotal.toLocaleString('en-IN')}` : '₹ 0'}
                                </div>
                              </div>
                            </div>
                          </div>
                        );

                        const desktopView = (
                          <div className={`hidden md:grid md:grid-cols-12 gap-4 ${bgColor} border-b border-gray-100 last:border-0 p-4 items-center hover:bg-gray-50 transition-colors font-sans`}>
                            <div className="col-span-4 flex items-center gap-4">
                              <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center shrink-0 cursor-pointer relative" onClick={() => setActiveImage(displayImg)}>
                                <img src={displayImg} alt={item.name} className="max-w-full max-h-full object-contain p-1" />
                              </div>
                              <div className="font-extrabold text-gray-900 text-xs sm:text-sm uppercase tracking-wide leading-snug font-sans">{item.name}</div>
                            </div>

                            <div className="col-span-2 text-center text-xs font-bold text-gray-600 font-sans tracking-wider">
                              #{pId.substring(0, 8).toUpperCase()}
                            </div>

                            <div className="col-span-2 flex justify-center">
                              <span className="bg-[#fef2f2] text-[#A80000] text-[11px] font-extrabold px-3 py-1 rounded-md whitespace-nowrap font-sans">
                                {item.quantity || "1 Item"}
                              </span>
                            </div>

                            <div className="col-span-1 flex flex-col items-center justify-center font-sans">
                              <span className="font-extrabold text-[#D35400] text-sm">₹{dp.toLocaleString('en-IN')}</span>
                              {(item.hasDiscount || settings.discountPercent > 0) && item.price > dp && (
                                <span className="text-[10px] text-gray-400 line-through font-semibold mt-0.5">₹{item.price.toLocaleString('en-IN')}</span>
                              )}
                            </div>

                            <div className="col-span-2 flex justify-center font-sans">
                              <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-2xs h-8 w-24">
                                <button onClick={() => handleQtyChange(item, -1)} className="flex-1 h-full flex items-center justify-center text-[#A80000] hover:bg-[#A80000] hover:text-white transition-colors rounded-l-lg font-bold text-base leading-none pb-0.5">
                                  -
                                </button>
                                <div className="flex-1 text-center font-extrabold text-sm text-gray-800 border-x border-gray-100 flex items-center justify-center h-full font-sans">{qty}</div>
                                <button onClick={() => handleQtyChange(item, 1)} className="flex-1 h-full flex items-center justify-center text-[#A80000] hover:bg-[#A80000] hover:text-white transition-colors rounded-r-lg font-bold text-base leading-none pb-0.5">
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="col-span-1 text-right font-extrabold text-[#A80000] text-sm pr-2 font-sans">
                              {lineTotal > 0 ? `₹ ${lineTotal.toLocaleString('en-IN')}` : '₹ 0'}
                            </div>
                          </div>
                        );

                        return (
                          <React.Fragment key={pId}>
                            {mobileView}
                            {desktopView}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Cart Summary Section */}
        <div className="flex justify-center md:justify-end mt-8 px-4 md:px-6 container mx-auto mb-12">
          <div className="w-full max-w-md bg-white border border-gray-100/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
              <ShoppingBag className="w-6 h-6 text-slate-800" />
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Cart Summary</h2>
            </div>

            {/* Subtotal & Total */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-bold text-base">Subtotal</span>
                <span className="text-[#A80000] font-extrabold text-base">₹ {totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                <span className="text-slate-900 font-extrabold text-base">Total</span>
                <span className="text-[#A80000] font-black text-lg">₹ {totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Proceed to Checkout Button */}
            <div className="w-full mb-5">
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-[#A80000] hover:bg-[#F4C542] hover:text-[#1A1A1A] text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2 text-base uppercase tracking-wider cursor-pointer active:scale-[0.99]"
              >
                <ShoppingCart className="w-5 h-5 fill-current" />
                <span>Proceed to Checkout</span>
              </button>
            </div>

            {/* Minimum Order Warning Box */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[#78350F] font-extrabold text-sm mb-1">
                <span>⚠️</span>
                <span>Minimum Order:</span>
              </div>
              <div className="text-[#78350F] font-bold text-xs sm:text-sm">
                <span>Tamil Nadu </span>
                <span className="font-black">₹ 3,000.00</span>
                <span className="mx-1 font-normal text-amber-700">|</span>
                <span>Other States </span>
                <span className="font-black">₹ 5,000.00</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {activeImage && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActiveImage(null)}>
          <div className="relative bg-white p-3 rounded-2xl max-w-md w-full shadow-2xl flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveImage(null)} className="absolute top-3 right-3 bg-gray-100 hover:bg-red-500 hover:text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-gray-700 transition-colors">✕</button>
            <img src={activeImage} alt="Product Preview" className="max-w-full max-h-[70vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      <UserFooter />
    </div>
  );
};

export default QuickEnquiry;
