import React, { useState, useEffect, useMemo } from 'react';
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { getProducts, getCategories } from "@/lib/api";
import { Product, Category } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { toast } from "sonner";

const QuickEnquiry = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
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
    } else if (value === "") {
      const newQuantities = { ...quantities };
      delete newQuantities[productId];
      setQuantities(newQuantities);
    }
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

  return (
    <div className="min-h-screen flex flex-col bg-white relative font-sans">
      <UserHeader />
      
      <main className="flex-1 container mx-auto px-0 md:px-4 py-8">
        <div className="w-full bg-white shadow-sm border border-gray-200">
          
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 pb-2 pt-4 px-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest border-b border-gray-100">
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
              <div key={catIdx}>
                {/* Category Header */}
                <div className="bg-[#b91c1c] text-white px-4 py-2.5 text-[13px] font-bold tracking-wider uppercase">
                  {group.categoryName}
                </div>

                {/* Product Rows */}
                <div className="flex flex-col divide-y divide-gray-100">
                  {group.items.map((item) => {
                    const pId = item._id || item.id;
                    const dp = getDiscountPrice(item.price, item.hasDiscount, settings.discountPercent, item.netRate, item.displayNetRate);
                    const stock = item.storeStockPieces || 0;
                    const inStockText = stock > 0 ? (stock < 20 ? `Low (${stock})` : "Yes") : "No";

                    return (
                      <div key={pId} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4">
                        
                        {/* Product Details */}
                        <div className="col-span-1 md:col-span-5 flex items-center gap-4">
                          <div className="w-14 h-14 bg-gray-50 flex items-center justify-center shrink-0 rounded-md overflow-hidden border border-gray-100 p-0.5">
                            <img src={stock <= 0 ? '/1.png' : (item.image || '/1.png')} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-gray-800 text-[13px]">{item.name}</h3>
                            <p className="text-gray-500 text-[11px] mt-0.5">{item.description || item.brand || "Standard"}</p>
                          </div>
                        </div>

                        {/* Unit/Size */}
                        <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center text-[13px] text-gray-500 font-medium">
                          <span className="md:hidden font-bold text-xs">UNIT/SIZE:</span>
                          {item.quantity || "1 Box"}
                        </div>

                        {/* In Stock */}
                        <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center">
                          <span className="md:hidden font-bold text-xs text-gray-600">IN STOCK:</span>
                          <span className={`font-bold text-[12px] ${stock > 0 ? 'text-[#2eab5b]' : 'text-red-500'}`}>
                            {inStockText}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center font-extrabold text-[#b91c1c] text-[13px]">
                          <span className="md:hidden font-bold text-xs text-gray-600">PRICE:</span>
                          ₹{dp.toLocaleString('en-IN')}
                        </div>

                        {/* Quantity */}
                        <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center">
                          <span className="md:hidden font-bold text-xs text-gray-600">QUANTITY:</span>
                          <input 
                            type="number" 
                            min="1"
                            max={stock || 99}
                            value={quantities[pId] || "1"} 
                            onChange={(e) => handleQuantityChange(pId, e.target.value)}
                            disabled={stock <= 0}
                            className="w-[50px] h-[30px] border border-gray-200 rounded text-center text-[13px] text-gray-600 outline-none focus:border-[#b91c1c] disabled:opacity-50" 
                          />
                        </div>

                        {/* Action */}
                        <div className="col-span-1 md:col-span-2 flex justify-end md:justify-end items-center">
                          <button 
                            onClick={() => handleAdd(item)}
                            disabled={stock <= 0}
                            className="border border-[#b91c1c] text-[#b91c1c] hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-[11px] tracking-wide px-5 py-1.5 rounded transition-colors uppercase"
                          >
                            ADD
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
      </main>

      <UserFooter />
    </div>
  );
};

export default QuickEnquiry;
