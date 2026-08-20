import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { getProducts, getCategories } from "@/lib/api";
import { Product, Category } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { toast } from "sonner";
import { Plus, Minus, ShoppingCart, Sparkles, ShoppingBag, Search, LogIn, CheckCircle2, Star, StarHalf } from "lucide-react";
import QuickEnquiryFilters from "@/components/QuickEnquiryFilters";
import ProductCard from "@/components/ProductCard";
import ProductLoadingSkeleton from "@/components/ui/ProductLoadingSkeleton";

const QuickEnquiry = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

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

    const interval = setInterval(loadAll, 5000);
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
    const names = new Set(categories.map(c => c.name).filter(Boolean));
    return ["All Categories", "Day Crackers", "Night Crackers", "Kids Crackers", "Gift Box", ...Array.from(names)];
  }, [categories]);

  // Group and filter products cleanly without duplicates
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

    // Map each category uniquely by category ID or normalized name
    const catGroupMap = new Map<string, { categoryName: string; items: Product[] }>();

    categories.forEach((cat) => {
      const key = String(cat._id || cat.id || cat.name).toLowerCase();
      if (!catGroupMap.has(key)) {
        catGroupMap.set(key, {
          categoryName: cat.name.toUpperCase(),
          items: [],
        });
      }
    });

    const fallbackKey = "uncategorized";
    catGroupMap.set(fallbackKey, { categoryName: "OTHER PRODUCTS", items: [] });

    filtered.forEach((p) => {
      const cat = p.category as any;
      const catId = typeof cat === 'object' && cat !== null ? String(cat._id || cat.id || '').toLowerCase() : (cat ? String(cat).toLowerCase() : '');
      const catName = typeof cat === 'object' && cat !== null ? cat.name : (categories.find(c => String(c._id || c.id || '').toLowerCase() === catId)?.name || String(cat || ""));

      if (selectedCategory !== "All Categories") {
        if (selectedCategory.toLowerCase() === "day crackers") {
          if (p.crackerType && p.crackerType !== "Day Crackers") return;
        } else if (selectedCategory.toLowerCase() === "night crackers") {
          if (p.crackerType !== "Night Crackers") return;
        } else if (selectedCategory.toLowerCase() === "kids crackers" || selectedCategory.toLowerCase() === "kids") {
          if (p.crackerType !== "Kids Crackers") return;
        } else if (selectedCategory.toLowerCase() === "gift box" || selectedCategory.toLowerCase() === "giftbox") {
          if (p.crackerType !== "Gift Box") return;
        } else if (catName && catName.toLowerCase() !== selectedCategory.toLowerCase()) {
          return;
        }
      }

      // Find matching group
      let groupKey = catId && catGroupMap.has(catId) ? catId : (catName && catGroupMap.has(catName.toLowerCase()) ? catName.toLowerCase() : fallbackKey);

      const group = catGroupMap.get(groupKey) || catGroupMap.get(fallbackKey)!;

      // Prevent pushing duplicate product instances into the group
      const pId = String(p._id || p.id);
      if (!group.items.some(item => String(item._id || item.id) === pId)) {
        group.items.push(p);
      }
    });

    // Return unique category groups that contain items
    return Array.from(catGroupMap.values()).filter((g) => g.items.length > 0);
  }, [products, categories, searchQuery, selectedBrand, selectedCategory]);

  const handleQtyChange = (product: Product, delta: number) => {
    const stockVal = product.storeStockPieces !== undefined ? Number(product.storeStockPieces) : (product.stock !== undefined ? Number(product.stock) : 0);
    if (stockVal <= 0 && delta > 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    const pId = String(product._id || product.id || '');
    const existing = items.find((i) => String(i.product._id || i.product.id || '') === pId);
    const currentQty = existing ? existing.quantity : 0;
    const newQty = currentQty + delta;

    if (delta > 0 && newQty > stockVal) {
      toast.error(`Only ${stockVal} left in stock for ${product.name}`);
      return;
    }

    if (newQty <= 0) {
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
        ? 'pt-[120px] md:pt-[125px]'
        : 'pt-[188px] md:pt-[160px]'
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

        <div className="w-full bg-white border-b border-gray-100 rounded-none mb-8 mt-0">
          <div className="flex-1 container mx-auto px-0 md:px-4 py-0 md:py-3">

            {/* Sticky Table Header Bar for Desktop View */}
            {!loading && groupedProducts.length > 0 && (
              <div className="hidden md:grid md:grid-cols-12 gap-4 bg-slate-100/90 text-slate-700 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider mb-4 border border-slate-200/80 shadow-2xs">
                <div className="col-span-4 flex items-center">PRODUCT NAME</div>
                <div className="col-span-2 text-center">ITEM CODE</div>
                <div className="col-span-2 text-center">CONTENT</div>
                <div className="col-span-1 text-center">UNIT PRICE</div>
                <div className="col-span-2 text-center">QUANTITY</div>
                <div className="col-span-1 text-right pr-2">TOTAL</div>
              </div>
            )}

            <div className="space-y-6 md:space-y-4">
              {loading ? (
                <ProductLoadingSkeleton mode="table" count={6} />
              ) : groupedProducts.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-medium">No products found.</div>
              ) : (
                groupedProducts.map((group, catIdx) => (
                  <div key={catIdx} className="mb-4 md:mb-6">
                    {/* Sticky Category Pill Banner Header */}
                    <div className={`sticky z-30 transition-all duration-300 py-1 bg-white ${
                      isNavbarHidden
                        ? 'top-[118px] sm:top-[122px] md:top-[52px]'
                        : 'top-[184px] sm:top-[198px] md:top-[160px]'
                    }`}>
                      <div className="bg-[#A80000] text-white px-3.5 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-black uppercase tracking-wider font-sans flex items-center rounded-xl md:rounded-2xl shadow-md mx-1 md:mx-0 border border-[#8a0000]">
                        <span className="mr-2 opacity-90 text-lg leading-none mt-[-2px]">•</span>
                        {group.categoryName}
                      </div>
                    </div>

                    <div className="flex flex-col bg-white font-sans">
                      {group.items.map((item, index) => {
                        const pId = String(item._id || item.id || '');
                        const dp = getDiscountPrice(item.price, item.hasDiscount, settings.discountPercent, item.netRate, item.displayNetRate);
                        const qty = getProductQty(pId);
                        const lineTotal = dp * qty;
                        const isEven = index % 2 === 0;
                        const bgColor = isEven ? 'bg-[#FDFBF7]' : 'bg-[#FEFCF9]';
                        const stockVal = item.storeStockPieces !== undefined ? Number(item.storeStockPieces) : (item.stock !== undefined ? Number(item.stock) : 0);
                        const isOutOfStock = stockVal <= 0;
                        const displayImg = isOutOfStock ? '/saiyogi-logo-1.png' : (item.image || '/saiyogi-logo-1.png');

                        const mobileView = (
                          <div className="md:hidden py-2 px-2 flex items-center justify-between gap-1.5 sm:gap-2 bg-white border-b border-gray-100 font-sans">
                            {/* 1. Thumbnail Image */}
                            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gray-50 border border-gray-200/80 rounded-lg overflow-hidden flex items-center justify-center shrink-0 cursor-pointer relative" onClick={() => setActiveProduct(item)}>
                              <img src={displayImg} alt={item.name} className="max-w-full max-h-full object-contain p-0.5 mix-blend-multiply" />
                            </div>

                            {/* 2. Middle Info: Title + (Code & Content Pill) */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center pl-0.5">
                              <h3 className="font-black text-black text-xs sm:text-sm leading-tight uppercase truncate" title={item.name}>{item.name}</h3>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-gray-500 text-[10px] font-bold font-mono tracking-tight shrink-0">
                                  {item.code ? (item.code.startsWith('#') ? item.code : `#${item.code}`) : (item.sku ? (item.sku.startsWith('#') ? item.sku : `#${item.sku}`) : (pId ? `#${pId.substring(0, 8).toUpperCase()}` : '#N/A'))}
                                </span>
                                <span className="bg-red-50 text-[#A80000] border border-red-200/80 text-[10px] font-black px-1.5 py-0.5 rounded-md whitespace-nowrap leading-none shrink-0 shadow-2xs">
                                  {item.quantity || "1 Item"}
                                </span>
                              </div>
                            </div>

                            {/* 3. Price Column: Discount & Strikethrough */}
                            <div className="flex flex-col items-end shrink-0 px-0.5">
                              <span className="font-black text-[#D35400] text-xs sm:text-sm">₹{dp.toLocaleString('en-IN')}</span>
                              {(item.hasDiscount || settings.discountPercent > 0) && item.price > dp && (
                                <span className="text-[9px] text-gray-400 line-through font-semibold">₹{item.price.toLocaleString('en-IN')}</span>
                              )}
                            </div>

                            {/* 4. Stepper Control */}
                            <div className="shrink-0">
                              {isOutOfStock && qty === 0 ? (
                                <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded shadow-2xs">
                                  Sold Out
                                </span>
                              ) : (
                                <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-2xs h-7.5 w-18 overflow-hidden">
                                  <button
                                    onClick={() => handleQtyChange(item, -1)}
                                    disabled={qty <= 0}
                                    className="w-6 h-full flex items-center justify-center text-[#A80000] hover:bg-[#A80000] hover:text-white transition-colors rounded-l-md font-black text-sm leading-none disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#A80000] active:scale-90 cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <div className="flex-1 text-center font-black text-xs text-gray-900 border-x border-gray-100 flex items-center justify-center h-full font-sans">{qty}</div>
                                  <button
                                    onClick={() => handleQtyChange(item, 1)}
                                    disabled={isOutOfStock || qty >= stockVal}
                                    className="w-6 h-full flex items-center justify-center text-[#A80000] hover:bg-[#A80000] hover:text-white transition-colors rounded-r-md font-black text-sm leading-none disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#A80000] active:scale-90 cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* 5. Line Total */}
                            <div className="w-11 sm:w-14 text-right shrink-0 font-black text-[#A80000] text-xs sm:text-sm">
                              ₹{lineTotal.toLocaleString('en-IN')}
                            </div>
                          </div>
                        );

                        const desktopView = (
                          <div className={`hidden md:grid md:grid-cols-12 gap-4 ${bgColor} border-b border-amber-100/80 last:border-0 p-4 items-center hover:bg-[#F7F5F0] transition-colors`}>
                            <div className="col-span-4 flex items-center gap-4">
                              <div className="w-12 h-12 bg-[#FDFBF7] border border-amber-200/60 rounded-lg overflow-hidden flex items-center justify-center shrink-0 cursor-pointer relative" onClick={() => setActiveProduct(item)}>
                                <img src={displayImg} alt={item.name} className="max-w-full max-h-full object-contain p-1 mix-blend-multiply" />
                              </div>
                              <h3 className="font-black text-black text-base uppercase leading-tight">{item.name}</h3>
                            </div>

                            <div className="col-span-2 text-center text-xs font-bold text-gray-600 font-sans tracking-wider">
                              {item.sku || item.code || (pId ? `#${pId.substring(0, 8).toUpperCase()}` : 'N/A')}
                            </div>

                            <div className="col-span-2 flex justify-center">
                              <span className="bg-red-50 text-[#A80000] border border-red-200/80 text-xs font-black px-3.5 py-1 rounded-lg whitespace-nowrap font-sans shadow-2xs">
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
                              {isOutOfStock && qty === 0 ? (
                                <span className="text-xs font-black text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-md shadow-2xs">
                                  Sold Out
                                </span>
                              ) : (
                                <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-2xs h-8 w-24">
                                  <button
                                    onClick={() => handleQtyChange(item, -1)}
                                    disabled={qty <= 0}
                                    className="flex-1 h-full flex items-center justify-center text-[#A80000] hover:bg-[#A80000] hover:text-white transition-colors rounded-l-lg font-bold text-base leading-none pb-0.5 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#A80000]"
                                  >
                                    -
                                  </button>
                                  <div className="flex-1 text-center font-extrabold text-sm text-gray-800 border-x border-gray-100 flex items-center justify-center h-full font-sans">{qty}</div>
                                  <button
                                    onClick={() => handleQtyChange(item, 1)}
                                    disabled={isOutOfStock || qty >= stockVal}
                                    className="flex-1 h-full flex items-center justify-center text-[#A80000] hover:bg-[#A80000] hover:text-white transition-colors rounded-r-lg font-bold text-base leading-none pb-0.5 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#A80000]"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
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
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-2 text-xs font-bold text-center mt-2 flex items-center justify-center gap-1.5 shadow-2xs">
                <span>⚠️</span>
                <span>Please don't refresh the page during checkout!</span>
              </div>
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

      {activeProduct && (
        <ProductCard
          product={activeProduct}
          showDetailOnly
          onDetailClose={() => setActiveProduct(null)}
        />
      )}

      <UserFooter />
    </div>
  );
};

export default QuickEnquiry;
