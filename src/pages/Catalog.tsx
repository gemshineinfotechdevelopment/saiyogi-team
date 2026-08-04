import { useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import { getProducts, getCategories } from "@/lib/api";
import { Product, Category } from "@/data/products";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import ProductCard from "@/components/ProductCard";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X, Filter } from "lucide-react";

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("search") || "";
  const [sortBy, setSortBy] = useState<string>("default");
  const { settings } = useSiteSettings();
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getProducts()
      .then((data) => {
        console.log('Products loaded (Catalog):', data, Array.isArray(data));
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to fetch products (Catalog):', err);
        setProducts([]);
      });

    getCategories()
      .then((data) => {
        console.log('Categories loaded (Catalog):', data, Array.isArray(data));
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to fetch categories (Catalog):', err);
        setCategories([]);
      });
  }, []);

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory !== "all") {
      result = result.filter((p) => {
        const cat = p.category as any;
        const catId = typeof cat === 'object' && cat !== null ? (cat._id || cat.id || cat) : cat;
        return catId === activeCategory;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      // Prioritize products that start with the query, then those that include it
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

    if (sortBy === "price-low") result = [...result].sort((a, b) => getDiscountPrice(a.price, a.hasDiscount, settings.discountPercent, a.netRate, a.displayNetRate) - getDiscountPrice(b.price, b.hasDiscount, settings.discountPercent, b.netRate, b.displayNetRate));
    if (sortBy === "price-high") result = [...result].sort((a, b) => getDiscountPrice(b.price, b.hasDiscount, settings.discountPercent, b.netRate, b.displayNetRate) - getDiscountPrice(a.price, a.hasDiscount, settings.discountPercent, a.netRate, a.displayNetRate));
    return result;
  }, [products, activeCategory, searchQuery, sortBy, settings.discountPercent]);

  const setCategory = (cat: string) => {
    const params = new URLSearchParams(searchParams);
    if (cat === "all") params.delete("category");
    else params.set("category", cat);
    setSearchParams(params);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (val) params.set("search", val);
    else params.delete("search");
    setSearchParams(params, { replace: true });
  };

  const toggleQuickSearch = () => {
    setIsQuickSearchOpen(!isQuickSearchOpen);
    if (!isQuickSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: '#EFF6FF' }}>
      <UserHeader />

      {/* Search Overlay for "Search without scrolling" */}
      <div className={cn(
        "fixed inset-0 z-[60] flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm transition-all duration-300",
        isQuickSearchOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "w-full max-w-2xl mx-4 transition-all duration-300 transform",
          isQuickSearchOpen ? "translate-y-0 scale-100" : "-translate-y-8 scale-95"
        )}>
          {/* External Close Button for Mobile Accessibility */}
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setIsQuickSearchOpen(false)}
              className="bg-red-600 text-white p-2 rounded-full shadow-xl hover:bg-red-700 active:scale-90 transition-all flex items-center gap-2 px-5"
            >
              <X className="h-5 w-5" />
              <span className="font-bold text-sm">Close Search</span>
            </button>
          </div>

          <div className="bg-[#fefae0] rounded-2xl shadow-2xl border-2 border-red-200 overflow-hidden">
            <div className="p-4 flex items-center gap-3">
              <Search className="h-6 w-6 text-red-600" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
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
                  return (
                    <div key={p._id || p.id} className="flex items-center gap-3 p-2 hover:bg-red-50 rounded-lg cursor-pointer transition-colors" onClick={() => setIsQuickSearchOpen(false)}>
                      <img src={p.image} alt={p.name} className="h-10 w-10 object-cover rounded" />
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

      <main className="container py-8 flex-1">
        <h1 className="font-display text-4xl font-bold mb-8 text-secondary animate-in fade-in slide-in-from-left duration-500">
          {searchQuery ? `Search: "${searchQuery}"` : activeCategory !== "all" ? categories.find(c => (c._id || c.id) === activeCategory)?.name || "Shop" : "Our Collection"}
        </h1>

        <div className="space-y-6 mb-10">
          <div className="flex flex-wrap gap-2">
            <Button variant={activeCategory === "all" ? "default" : "outline"} size="sm" onClick={() => setCategory("all")} className={cn("rounded-full h-9 px-6 transition-all", activeCategory === "all" ? "bg-red-600 hover:bg-red-700 text-white shadow-md" : "bg-white border-2 border-red-200 text-red-700 hover:bg-red-50")}>All Products</Button>
            {categories.map((cat) => {
              const catId = cat._id || cat.id;
              return (
                <Button key={catId} variant={activeCategory === catId ? "default" : "outline"} size="sm" onClick={() => setCategory(catId!)} className={cn("rounded-full h-9 px-6 transition-all", activeCategory === catId ? "bg-red-600 hover:bg-red-700 text-white shadow-md" : "bg-white border-2 border-red-200 text-red-700 hover:bg-red-50")}>
                  {cat.name}
                </Button>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4 border-t border-red-200 pt-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-secondary font-bold flex items-center gap-1"><Filter className="h-4 w-4" /> Sort By:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "default", label: "Recommended" },
                  { value: "price-low", label: "Price: Low to High" },
                  { value: "price-high", label: "Price: High to Low" },
                ].map((s) => (
                  <button key={`sort-${s.value}`} onClick={() => setSortBy(s.value)} className={cn("px-4 py-1.5 rounded-full transition-all text-xs font-bold border-2", sortBy === s.value ? "bg-red-600 border-red-600 text-white shadow-sm" : "bg-white text-red-700 border-red-100 hover:border-red-300 hover:bg-red-50")}>{s.label}</button>
                ))}
              </div>
            </div>

            {/* Premium Search Bar below sort */}
            <div className="relative flex-1 md:max-w-md ml-auto">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-red-400 group-focus-within:text-red-600 transition-colors" />
                <Input
                  placeholder="Search products by name or brand..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-12 pr-10 py-6 bg-white/80 backdrop-blur-sm border-2 border-red-100 rounded-2xl focus:brand-red-600 focus:bg-white text-red-950 placeholder:text-red-200 shadow-sm transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange({ target: { value: "" } } as any)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-red-300 hover:text-red-500 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-[10px] text-red-400 font-medium px-4">Showing {filtered.length} products</p>
            </div>
          </div>
        </div>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-700">
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
            <Button className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 rounded-xl shadow-lg transition-all hover:-translate-y-1" onClick={() => { setCategory("all"); setSearchParams({}); }}>Clear All Filters</Button>
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
