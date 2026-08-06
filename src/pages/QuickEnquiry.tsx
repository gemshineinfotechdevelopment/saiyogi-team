import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { getProducts, getCategories } from "@/lib/api";
import { Product, Category } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { Plus, Minus, Search, ShoppingBag, LogIn } from "lucide-react";

const QuickEnquiry = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All Brands");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const { addToCart, updateQuantity, items, totalItems, totalPrice } = useCart();
  const { settings } = useSiteSettings();

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([prods, cats]) => {
        setProducts(Array.isArray(prods) ? prods : []);
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch((err) => {
        console.error("Failed to load products/categories:", err);
      })
      .finally(() => setLoading(false));
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
    const pId = product._id || product.id;
    const existing = items.find((i) => (i.product._id || i.product.id) === pId);
    const currentQty = existing ? existing.quantity : 0;
    const newQty = Math.max(0, currentQty + delta);
    
    if (newQty === 0) {
       updateQuantity(pId, 0); // CartContext handles removal if qty <= 0
    } else if (existing) {
       updateQuantity(pId, newQty);
    } else {
       addToCart(product, newQty);
    }
  };

  const getProductQty = (productId: string) => {
    const existing = items.find((i) => (i.product._id || i.product.id) === productId);
    return existing ? existing.quantity : 0;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white relative font-sans">
      <UserHeader />
      
      <main className="flex-1 w-full max-w-7xl mx-auto pb-24 px-2 md:px-6 mt-4">
        
        {/* Filters & Cart Row (Desktop matches image exactly) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 sticky top-[60px] md:top-[80px] z-40 bg-white py-4 border-b border-gray-100 shadow-sm md:shadow-none md:border-none">
          {/* Left: Filters */}
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <select 
              value={selectedBrand} 
              onChange={e => setSelectedBrand(e.target.value)}
              className="w-full sm:w-40 p-2.5 rounded-lg border border-gray-200 text-sm font-semibold outline-none focus:border-[#A80000] text-gray-700 bg-white appearance-none cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238b2ce0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
            >
              {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full sm:w-48 p-2.5 rounded-lg border border-gray-200 text-sm font-semibold outline-none focus:border-[#A80000] text-gray-700 bg-white appearance-none cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238b2ce0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
            >
              {uniqueCategoryNames.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="relative w-full sm:w-64">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#A80000] bg-white"
              />
            </div>
          </div>
          
          {/* Right: Cart Total Block */}
          <div className="w-full md:w-auto bg-[#A80000] text-white rounded-xl p-3 flex items-center justify-between md:justify-start md:gap-6 shadow-md border border-[#8a0000]">
            <div className="flex flex-col">
              <div className="text-[10px] font-bold text-white/80 uppercase">Cart Total</div>
              <div className="text-xl font-black leading-tight">₹{totalPrice.toLocaleString('en-IN')}</div>
            </div>
            
            <button 
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 px-4 py-1.5 rounded-lg font-bold text-sm transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4 rotate-180" /> Checkout
            </button>
            
            <div className="relative mr-2 md:mr-0 hidden md:block">
              <ShoppingBag className="w-6 h-6 opacity-90" />
              <span className="absolute -top-1.5 -right-2 bg-[#D35400] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-sm">
                {totalItems}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Table Header */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 bg-[#f8f9fa] rounded-t-xl py-3 px-6 text-[11px] font-black text-gray-500 uppercase tracking-wider items-center mb-2">
          <div className="col-span-4 pl-2">PRODUCT NAME</div>
          <div className="col-span-2 text-center">ITEM CODE</div>
          <div className="col-span-2 text-center">CONTENT</div>
          <div className="col-span-1 text-center">UNIT PRICE</div>
          <div className="col-span-2 text-center">QUANTITY</div>
          <div className="col-span-1 text-right pr-4">TOTAL</div>
        </div>

        {/* Product List */}
        <div className="space-y-6 md:space-y-4">
          {loading ? (
             <div className="text-center py-10 text-gray-400 font-medium">Loading products...</div>
          ) : groupedProducts.length === 0 ? (
             <div className="text-center py-10 text-gray-400 font-medium">No products found.</div>
          ) : (
            groupedProducts.map((group, catIdx) => (
              <div key={catIdx} className="md:bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-100 overflow-hidden">
                {/* Group Header */}
                <div className="bg-[#A80000] text-white px-4 py-2 text-sm font-bold uppercase tracking-wide flex items-center rounded-lg md:rounded-none md:rounded-t-lg mx-2 md:mx-0">
                  <span className="mr-2 opacity-80 text-lg leading-none mt-[-2px]">•</span>
                  {group.categoryName}
                </div>
                
                {/* Group Items */}
                <div className="flex flex-col bg-white">
                  {group.items.map((item, index) => {
                    const pId = item._id || item.id;
                    const dp = getDiscountPrice(item.price, item.hasDiscount, settings.discountPercent, item.netRate, item.displayNetRate);
                    const qty = getProductQty(pId);
                    const lineTotal = dp * qty;
                    const isEven = index % 2 === 0;
                    const bgColor = isEven ? 'bg-white' : 'bg-[rgb(254 242 242 / 0.3)]';

                    // --- MOBILE VIEW (Card Layout) ---
                    const mobileView = (
                      <div className={`md:hidden p-4 flex gap-3 ${bgColor} border-b border-gray-100 last:border-0 mx-2 md:mx-0 rounded-lg md:rounded-none mb-2 md:mb-0 shadow-sm md:shadow-none`}>
                        {/* Image & Basic Info */}
                        <div className="w-[72px] shrink-0 flex flex-col items-center gap-2">
                           <div className="w-[72px] h-[72px] bg-white border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
                             <img src={item.image || '/1.png'} alt={item.name} className="max-w-full max-h-full object-contain p-1" />
                           </div>
                           <div className="bg-[#fef2f2] text-[#A80000] text-[9px] font-bold text-center px-2 py-1 rounded-md w-full whitespace-nowrap">
                             {item.quantity || "1 Item"}
                           </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-0.5">
                          {/* Top Row: Name & Price */}
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h3 className="font-black text-gray-800 text-[13px] leading-snug uppercase">{item.name}</h3>
                              <p className="text-gray-400 text-[10px] font-bold mt-0.5">#{pId.substring(0, 8).toUpperCase()}</p>
                            </div>
                            <div className="text-right shrink-0">
                               <div className="font-black text-[#D35400] text-[13px]">₹{dp.toLocaleString('en-IN')}</div>
                               {(item.hasDiscount || settings.discountPercent > 0) && item.price > dp && (
                                 <div className="text-[10px] text-gray-400 line-through font-bold">₹{item.price.toLocaleString('en-IN')}</div>
                               )}
                            </div>
                          </div>

                          {/* Bottom Row: Controls & Total */}
                          <div className="flex justify-between items-center mt-3">
                            <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm h-8">
                              <button onClick={() => handleQtyChange(item, -1)} className="w-8 h-full flex items-center justify-center text-[#A80000] hover:bg-[#A80000] hover:text-white transition-colors rounded-l-lg font-bold text-lg leading-none pb-0.5">
                                -
                              </button>
                              <div className="w-8 text-center font-black text-sm text-gray-800 border-x border-gray-100 flex items-center justify-center h-full">{qty}</div>
                              <button onClick={() => handleQtyChange(item, 1)} className="w-8 h-full flex items-center justify-center text-[#A80000] hover:bg-[#A80000] hover:text-white transition-colors rounded-r-lg font-bold text-lg leading-none pb-0.5">
                                +
                              </button>
                            </div>
                            
                            <div className="font-black text-[#A80000] text-[15px]">
                              {lineTotal > 0 ? `₹ ${lineTotal.toLocaleString('en-IN')}` : '₹ 0'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );

                    // --- DESKTOP VIEW (Table Layout) ---
                    const desktopView = (
                      <div className={`hidden md:grid md:grid-cols-12 gap-4 ${bgColor} border-b border-gray-100 last:border-0 p-4 items-center hover:bg-gray-50 transition-colors`}>
                        
                        {/* 1. Product Name & Image (4 cols) */}
                        <div className="col-span-4 flex items-center gap-4">
                           <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                             <img src={item.image || '/1.png'} alt={item.name} className="max-w-full max-h-full object-contain p-1" />
                           </div>
                           <h3 className="font-black text-gray-800 text-sm uppercase leading-tight">{item.name}</h3>
                        </div>

                        {/* 2. Item Code (2 cols) */}
                        <div className="col-span-2 text-center text-xs font-bold text-gray-500">
                          #{pId.substring(0, 8).toUpperCase()}
                        </div>

                        {/* 3. Content (2 cols) */}
                        <div className="col-span-2 flex justify-center">
                          <span className="bg-[#fef2f2] text-[#A80000] text-[11px] font-bold px-3 py-1 rounded-md whitespace-nowrap">
                            {item.quantity || "1 Item"}
                          </span>
                        </div>

                        {/* 4. Unit Price (1 col) */}
                        <div className="col-span-1 flex flex-col items-center justify-center">
                           <span className="font-black text-[#D35400] text-sm">₹{dp.toLocaleString('en-IN')}</span>
                           {(item.hasDiscount || settings.discountPercent > 0) && item.price > dp && (
                             <span className="text-[10px] text-gray-400 line-through font-bold">₹{item.price.toLocaleString('en-IN')}</span>
                           )}
                        </div>

                        {/* 5. Quantity (2 cols) */}
                        <div className="col-span-2 flex justify-center">
                          <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm h-8 w-24">
                            <button onClick={() => handleQtyChange(item, -1)} className="flex-1 h-full flex items-center justify-center text-[#A80000] hover:bg-[#A80000] hover:text-white transition-colors rounded-l-lg font-bold text-lg leading-none pb-0.5">
                              -
                            </button>
                            <div className="flex-1 text-center font-black text-sm text-gray-800 border-x border-gray-100 flex items-center justify-center h-full">{qty}</div>
                            <button onClick={() => handleQtyChange(item, 1)} className="flex-1 h-full flex items-center justify-center text-[#A80000] hover:bg-[#A80000] hover:text-white transition-colors rounded-r-lg font-bold text-lg leading-none pb-0.5">
                              +
                            </button>
                          </div>
                        </div>

                        {/* 6. Total (1 col) */}
                        <div className="col-span-1 text-right font-black text-[#A80000] text-sm pr-2">
                          {lineTotal > 0 ? `₹${lineTotal.toLocaleString('en-IN')}` : '₹0'}
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
      </main>
      <UserFooter />
    </div>
  );
};

export default QuickEnquiry;
