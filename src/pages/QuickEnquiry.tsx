import React, { useState, useEffect, useMemo } from 'react';
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { getProducts, getCategories } from "@/lib/api";
import { Product, Category } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { toast } from "sonner";
import { Plus, Minus, ShoppingCart, Sparkles, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

const QuickEnquiry = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const { addToCart, updateQuantity, items } = useCart();
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

  const groupedProducts = useMemo(() => {
    const catMap: Record<string, { categoryName: string; items: Product[] }> = {};

    categories.forEach((cat) => {
      catMap[cat._id || cat.id] = { categoryName: cat.name.toUpperCase(), items: [] };
    });

    catMap["uncategorized"] = { categoryName: "OTHER PRODUCTS", items: [] };

    products.forEach((p) => {
      const cat = p.category as any;
      const catId = typeof cat === 'object' && cat !== null ? (cat._id || cat.id) : cat;
      if (catId && catMap[catId]) {
        catMap[catId].items.push(p);
      } else {
        catMap["uncategorized"].items.push(p);
      }
    });

    return Object.values(catMap).filter((g) => g.items.length > 0);
  }, [products, categories]);

  const handleQuantityChange = (productId: string, value: string) => {
    const val = parseInt(value);
    if (!isNaN(val) && val >= 1) {
      setQuantities((prev) => ({ ...prev, [productId]: val }));
    } else if (value === "" || value === "0") {
      setQuantities((prev) => ({ ...prev, [productId]: 0 }));
    }
  };

  const incrementQuantity = (productId: string) => {
    setQuantities((prev) => ({ ...prev, [productId]: (prev[productId] || 1) + 1 }));
  };

  const decrementQuantity = (productId: string) => {
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      if (current <= 1) return prev;
      return { ...prev, [productId]: current - 1 };
    });
  };

  const handleAdd = (product: Product) => {
    const pId = product._id || product.id;
    const qty = quantities[pId] || 1;
    const existing = items.find((i) => (i.product._id || i.product.id) === pId);
    
    if (existing) {
      updateQuantity(pId, existing.quantity + qty);
    } else {
      for (let i = 0; i < qty; i++) {
        addToCart(product);
      }
    }
    toast.success(`${qty}x ${product.name} added to cart!`);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const dp = getDiscountPrice(item.product.price, item.product.hasDiscount, settings.discountPercent, item.product.netRate, item.product.displayNetRate);
    return sum + (dp * item.quantity);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col bg-white relative font-sans">
      <UserHeader />
      
      <main className="flex-1 w-full py-12 px-0">
        {/* Beautiful Top Banner */}
        <div className="bg-gradient-to-br from-[#A80000] via-[#5c0a0b] to-[#1A1A1A] text-center py-12 px-6 rounded-none mb-10 relative overflow-hidden border-y border-[#F4C542]/20 shadow-xl">
          <div className="absolute top-0 left-10 w-24 h-24 bg-[#F4C542]/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <span className="text-[#F4C542] text-xs font-black tracking-widest uppercase mb-2 inline-block">✨ Direct Wholesale Orders ✨</span>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-wider mb-4 font-display">Quick Enquiry List</h1>
          <p className="text-gray-200 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
            Browse our premium crackers range, click the images to view previews, adjust quantities, and instantly add them to your inquiry sheet.
          </p>
        </div>

        {/* Product Table Card wrapper */}
        <div className="w-full bg-white/85 backdrop-blur-md shadow-2xl border-y border-gray-150 rounded-none overflow-hidden mb-8">
          <div className="flex-1 container mx-auto px-0 md:px-4 py-8">
        
        {/* Floating Estimate Bar (similar to combo packs) */}
        <div className="flex justify-end mb-6 px-4 md:px-0">
          <div className="inline-flex items-center gap-3 bg-[#4A0000] text-white px-4 py-2 rounded-full shadow-lg border border-red-900">
            <div className="relative flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <span className="absolute -top-1 -right-1.5 bg-green-600 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-extrabold">
                {totalItems}
              </span>
            </div>
            <div className="flex flex-col text-left text-xs">
              <span className="text-[9px] text-red-200 tracking-wider font-semibold uppercase">CURRENT ESTIMATE</span>
              <span className="font-extrabold text-sm text-white leading-tight">₹{totalPrice.toFixed(2)}</span>
            </div>
            <Link to="/cart">
              <button className="bg-[#EAB308] hover:bg-yellow-400 text-black text-xs font-extrabold px-3.5 py-1.5 rounded-full transition-colors ml-2 shadow-xs cursor-pointer">
                Checkout Now
              </button>
            </Link>
          </div>
        </div>

        <div className="w-full bg-white shadow-sm border border-gray-200">
          
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 pb-2 pt-4 px-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">
            <div className="col-span-5">PRODUCT DETAILS</div>
            <div className="col-span-2 text-center">UNIT/SIZE</div>
            <div className="col-span-1 text-center">IN STOCK</div>
            <div className="col-span-1 text-center">PRICE</div>
            <div className="col-span-1 text-center">QUANTITY</div>
            <div className="col-span-2 text-right">ACTION</div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400 font-medium">Loading products...</div>
          ) : groupedProducts.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-medium">No products available.</div>
          ) : (
            groupedProducts.map((group, catIdx) => (
              <div key={catIdx} className="border-b border-gray-100 last:border-0">
                {/* Category Header */}
                <div className="bg-[#FFF6E5] text-[#A80000] px-6 py-3.5 text-sm font-black tracking-widest uppercase flex items-center justify-between border-b border-[#A80000]/10">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#F4C542] fill-[#F4C542]" />
                    {group.categoryName}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold bg-white px-2.5 py-1 rounded-full border border-gray-200">
                    {group.items.length} Products
                  </span>
                </div>

                {/* Product Rows */}
                <div className="flex flex-col divide-y divide-gray-100">
                  {group.items.map((item) => {
                    const pId = item._id || item.id;
                    const dp = getDiscountPrice(item.price, item.hasDiscount, settings.discountPercent, item.netRate, item.displayNetRate);
                    const stock = item.storeStockPieces || 0;
                    const inStockText = stock > 0 ? (stock < 20 ? "Low" : "In Stock") : "Out of Stock";

                    return (
                      <div key={pId} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-6 hover:bg-gray-50/50 transition-colors">
                        {/* Product Details */}
                        <div className="col-span-1 md:col-span-5 flex items-center gap-4">
                          <div 
                            onClick={() => setActiveImage(stock <= 0 ? '/1.png' : (item.image || '/1.png'))} 
                            className="w-16 h-16 bg-white flex items-center justify-center shrink-0 border border-gray-200 rounded-xl cursor-zoom-in hover:border-[#A80000] hover:scale-105 transition-all shadow-sm relative overflow-hidden group"
                            title="Click to view image"
                          >
                            <img src={stock <= 0 ? '/1.png' : (item.image || '/1.png')} alt={item.name} className="max-w-full max-h-full object-contain p-1 group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[9px] text-white font-extrabold tracking-wider uppercase bg-[#A80000]/80 px-2 py-0.5 rounded-full scale-90">View</span>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-extrabold text-gray-900 text-sm tracking-wide">{item.name}</h3>
                            <p className="text-gray-400 text-xs mt-0.5 font-medium">{item.description || item.brand || "Standard"}</p>
                          </div>
                        </div>

                        {/* Unit/Size */}
                        <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center text-sm text-gray-600 font-bold">
                          <span className="md:hidden font-bold text-xs text-gray-400 uppercase">UNIT/SIZE:</span>
                          {item.quantity || "1 Box"}
                        </div>

                        {/* In Stock */}
                        <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center text-sm">
                          <span className="md:hidden font-bold text-xs text-gray-400 uppercase">STOCK:</span>
                          <span className={`font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider ${stock > 0 ? (stock < 20 ? 'text-amber-700 bg-amber-50 border border-amber-200/50' : 'text-green-700 bg-green-50 border border-green-200/50') : 'text-red-700 bg-red-50 border border-red-200/50'}`}>
                            {inStockText}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center font-black text-[#A80000] text-sm">
                          <span className="md:hidden font-bold text-xs text-gray-400 uppercase">PRICE:</span>
                          ₹{dp.toLocaleString('en-IN')}
                        </div>

                        {/* Quantity Selector with Plus/Minus buttons */}
                        <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center">
                          <span className="md:hidden font-bold text-xs text-gray-400 uppercase">QUANTITY:</span>
                          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5 shadow-sm">
                            <button 
                              onClick={() => decrementQuantity(pId)}
                              disabled={stock <= 0}
                              className="w-8 h-8 rounded-md bg-white hover:bg-[#A80000] hover:text-white text-gray-800 flex items-center justify-center font-bold border border-gray-150 transition-all duration-200 disabled:opacity-40"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input 
                              type="text" 
                              value={quantities[pId] !== undefined ? quantities[pId] : "1"} 
                              onChange={(e) => handleQuantityChange(pId, e.target.value)}
                              disabled={stock <= 0}
                              className="w-10 h-8 bg-transparent text-center text-sm font-black text-gray-900 outline-none disabled:opacity-40" 
                            />
                            <button 
                              onClick={() => incrementQuantity(pId)}
                              disabled={stock <= 0}
                              className="w-8 h-8 rounded-md bg-white hover:bg-[#A80000] hover:text-white text-gray-800 flex items-center justify-center font-bold border border-gray-150 transition-all duration-200 disabled:opacity-40"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="col-span-1 md:col-span-1 flex justify-end md:justify-end items-center">
                          <button 
                            onClick={() => handleAdd(item)}
                            disabled={stock <= 0}
                            className="w-full bg-[#A80000] text-white hover:bg-[#F4C542] hover:text-[#1A1A1A] font-extrabold text-[11px] py-2.5 rounded-xl transition-all duration-300 shadow-md uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <ShoppingCart className="h-3 w-3" /> Add
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        </div>
        </div>
      </main>
      <UserFooter />
    </div>
  </main>

  <UserFooter />
</div>
  );
};

export default QuickEnquiry;
