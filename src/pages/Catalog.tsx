import { useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import { getProducts, getCategories } from "@/lib/api";
import { Product, Category } from "@/data/products";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import QuickEnquiryFilters from "@/components/QuickEnquiryFilters";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, X, Filter } from "lucide-react";

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filter States
  const [selectedBrand, setSelectedBrand] = useState<string>("All Brands");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("default");

  const { settings } = useSiteSettings();
  const { items } = useCart();
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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

  // Cart totals calculation
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
      getProducts()
        .then((data) => {
          setProducts(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error('Failed to fetch products (Catalog):', err);
        });

      getCategories()
        .then((data) => {
          setCategories(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error('Failed to fetch categories (Catalog):', err);
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

  // Sync state from searchParams on mount or param change
  useEffect(() => {
    const catParam = searchParams.get("category");
    const searchParam = searchParams.get("search");
    const brandParam = searchParams.get("brand");

    if (searchParam !== null) {
      setSearchQuery(searchParam);
    }
    if (brandParam !== null) {
      setSelectedBrand(brandParam);
    }
    if (catParam !== null && catParam !== "all") {
      // Find category name by id or slug
      const found = categories.find(c => {
        const cId = c._id || c.id;
        const slug = c.name.toLowerCase().replace(/\s+/g, '-');
        return cId === catParam || slug === catParam.toLowerCase() || c.name.toLowerCase() === catParam.toLowerCase();
      });
      if (found) {
        setSelectedCategory(found.name);
      } else {
        setSelectedCategory(catParam);
      }
    } else if (catParam === "all") {
      setSelectedCategory("All Categories");
    }
  }, [searchParams, categories]);

  // Derived filter options
  const uniqueBrands = useMemo(() => {
    const brands = new Set(products.map(p => p.brand).filter(Boolean));
    return ["All Brands", ...Array.from(brands)];
  }, [products]);

  const uniqueCategoryNames = useMemo(() => {
    return ["All Categories", ...categories.map(c => c.name)];
  }, [categories]);

  // Filtered and Sorted products
  const filtered = useMemo(() => {
    let result = products;

    if (selectedBrand !== "All Brands") {
      result = result.filter(p => p.brand === selectedBrand);
    }

    if (selectedCategory !== "All Categories") {
      result = result.filter((p) => {
        const cat = p.category as any;
        const catId = typeof cat === 'object' && cat !== null ? (cat._id || cat.id || cat) : cat;
        const catName = typeof cat === 'object' && cat !== null ? cat.name : (categories.find(c => (c._id || c.id) === catId)?.name || String(catId || ''));
        return catName.toLowerCase() === selectedCategory.toLowerCase() || String(catId).toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const cat = p.category as any;
        const catName = typeof cat === 'object' && cat !== null ? (cat.name || '') : (cat || '');
        return p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (catName && catName.toLowerCase().includes(q));
      }).sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aStarts = aName.startsWith(q);
        const bStarts = bName.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      });
    }

    if (sortBy === "price-low") {
      result = [...result].sort((a, b) => getDiscountPrice(a.price, a.hasDiscount, settings.discountPercent, a.netRate, a.displayNetRate) - getDiscountPrice(b.price, b.hasDiscount, settings.discountPercent, b.netRate, b.displayNetRate));
    } else if (sortBy === "price-high") {
      result = [...result].sort((a, b) => getDiscountPrice(b.price, b.hasDiscount, settings.discountPercent, b.netRate, b.displayNetRate) - getDiscountPrice(a.price, a.hasDiscount, settings.discountPercent, a.netRate, a.displayNetRate));
    }

    return result;
  }, [products, categories, selectedBrand, selectedCategory, searchQuery, sortBy, settings.discountPercent]);

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    const params = new URLSearchParams(searchParams);
    if (catName === "All Categories") {
      params.delete("category");
    } else {
      const foundCat = categories.find(c => c.name === catName);
      if (foundCat) {
        params.set("category", foundCat._id || foundCat.id || catName);
      } else {
        params.set("category", catName);
      }
    }
    setSearchParams(params);
  };

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    const params = new URLSearchParams(searchParams);
    if (brand === "All Brands") {
      params.delete("brand");
    } else {
      params.set("brand", brand);
    }
    setSearchParams(params);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    setSearchParams(params, { replace: true });
  };

  const toggleQuickSearch = () => {
    setIsQuickSearchOpen(!isQuickSearchOpen);
    if (!isQuickSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-white" style={{ backgroundColor: '#ffffff' }}>
      <UserHeader isHidden={isNavbarHidden} />

      {/* Shared Fixed Filter Component */}
      <QuickEnquiryFilters
        selectedBrand={selectedBrand}
        setSelectedBrand={handleBrandSelect}
        uniqueBrands={uniqueBrands}
        selectedCategory={selectedCategory}
        setSelectedCategory={handleCategorySelect}
        uniqueCategoryNames={uniqueCategoryNames}
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        totalPrice={totalPrice}
        totalItems={totalItems}
        showTableHeader={false}
        isNavbarHidden={isNavbarHidden}
      />

      {/* Search Overlay for "Search without scrolling" */}
      <div className={cn(
        "fixed inset-0 z-[60] flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm transition-all duration-300",
        isQuickSearchOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "w-full max-w-2xl mx-4 transition-all duration-300 transform",
          isQuickSearchOpen ? "translate-y-0 scale-100" : "-translate-y-8 scale-95"
        )}>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setIsQuickSearchOpen(false)}
              className="bg-red-600 text-white p-2 rounded-full shadow-xl hover:bg-red-700 active:scale-90 transition-all flex items-center gap-2 px-5"
            >
              <X className="h-5 w-5" />
              <span className="font-bold text-sm">Close Search</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-200 overflow-hidden">
            <div className="p-4 flex items-center gap-3">
              <Search className="h-6 w-6 text-red-600" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-xl text-red-900 placeholder:text-red-300 font-display font-medium"
              />
              <Button variant="ghost" size="icon" onClick={() => setIsQuickSearchOpen(false)} className="rounded-full hover:bg-red-100 text-red-600">
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="px-4 pb-4 border-t border-red-100">
              <div className="pt-2 text-xs font-semibold text-red-400 uppercase tracking-wider">Quick Results ({filtered.length})</div>
              <div className="mt-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
                {filtered.slice(0, 5).map(p => {
                  const cat = p.category as any;
                  const catId = typeof cat === 'object' && cat !== null ? (cat._id || cat.id) : cat;
                  const catFallbackName = typeof cat === 'object' && cat !== null ? cat.name : cat;
                  const categoryName = categories.find(c => (c._id || c.id) === catId)?.name || catFallbackName;
                  const stockVal = p.storeStockPieces !== undefined ? p.storeStockPieces : (p.stock !== undefined ? p.stock : 0);
                  const displayImg = stockVal <= 0 ? '/saiyogi-logo-1.png' : (p.image || '/saiyogi-logo-1.png');
                  return (
                    <div key={p._id || p.id} className="flex items-center gap-3 p-2 hover:bg-red-50 rounded-lg cursor-pointer transition-colors" onClick={() => setIsQuickSearchOpen(false)}>
                      <img src={displayImg} alt={p.name} className="h-10 w-10 object-cover rounded" />
                      <div>
                        <div className="font-semibold text-red-900">{p.name}</div>
                        <div className="text-xs text-red-600">{categoryName}</div>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && <div className="p-4 text-center text-red-400">No products match your search</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={toggleQuickSearch}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-red-600 text-white shadow-2xl hover:bg-red-700 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
        aria-label="Search"
      >
        <Search className="h-6 w-6 group-hover:rotate-12 transition-transform" />
      </button>

      <main className={`container pb-12 flex-1 transition-all duration-300 ${
        isNavbarHidden
          ? 'pt-[120px] md:pt-[80px]'
          : 'pt-[195px] md:pt-[190px]'
      }`}>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-0 animate-in fade-in duration-700">
            {filtered.map((p) => {
              const cat = p.category as any;
              const catId = typeof cat === 'object' && cat !== null ? (cat._id || cat.id) : cat;
              const catFallbackName = typeof cat === 'object' && cat !== null ? cat.name : cat;
              return (
                <ProductCard
                  key={p._id || p.id}
                  product={p}
                  categoryName={categories.find(c => (c._id || c.id) === catId)?.name || catFallbackName}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-32 bg-white/40 backdrop-blur-md rounded-3xl border-2 border-dashed border-red-200">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-100 text-red-600 mb-6">
              <Search className="h-10 w-10 opacity-40" />
            </div>
            <p className="text-2xl font-display font-bold text-red-900">No products found</p>
            <p className="text-red-600 mt-2 mb-8">Try adjusting your search or filters</p>
            <Button className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 rounded-xl shadow-lg transition-all hover:-translate-y-1" onClick={() => { handleCategorySelect("All Categories"); handleBrandSelect("All Brands"); handleSearchChange(""); }}>Clear All Filters</Button>
          </div>
        )}
      </main>
      <UserFooter />

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(220, 38, 38, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(220, 38, 38, 0.2);
        }
      `}} />
    </div>
  );
};

export default Catalog;
