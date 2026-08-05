import React, { useState, useEffect, useMemo } from 'react';
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { getProducts, getCategories } from "@/lib/api";
import { Product, Category } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

const QuickEnquiry = () => {
  const { addToCart, totalItems, totalPrice } = useCart();
  const { settings } = useSiteSettings();
  
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
        setProducts(Array.isArray(prods) ? prods : []);
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleQuantityChange = (id: string, value: string) => {
    const val = parseInt(value);
    if (!isNaN(val) && val >= 1) {
      setQuantities(prev => ({ ...prev, [id]: val }));
    } else if (value === "") {
      const newQuantities = { ...quantities };
      delete newQuantities[id];
      setQuantities(newQuantities);
    }
  };

  const handleAdd = (product: Product) => {
    const productId = product._id || product.id || '';
    const qty = quantities[productId] || 1;
    addToCart(product, qty);
    toast.success(`${qty} x ${product.name} added to cart`);
    
    // Reset quantity input
    const newQuantities = { ...quantities };
    delete newQuantities[productId];
    setQuantities(newQuantities);
  };

  const groupedProducts = useMemo(() => {
    const groups: { category: string; items: Product[] }[] = [];
    const processedProductIds = new Set<string>();

    categories.forEach(cat => {
      const catId = cat._id || cat.id;
      const catName = cat.name;

      const matchingItems = products.filter(p => {
        const pId = p._id || p.id || '';
        const pCat = p.category as any;
        const pCatId = pCat && typeof pCat === 'object' ? (pCat._id || pCat.id) : pCat;
        const pCatName = pCat && typeof pCat === 'object' ? pCat.name : (typeof pCat === 'string' ? pCat : '');

        const matches = (catId && pCatId === catId) || (catName && pCatName && pCatName.toLowerCase() === catName.toLowerCase());
        if (matches) {
          processedProductIds.add(pId);
        }
        return matches;
      });

      if (matchingItems.length > 0) {
        groups.push({
          category: catName,
          items: matchingItems
        });
      }
    });

    // Collect any products that were not matched by categories array
    const remainingProducts = products.filter(p => !processedProductIds.has(p._id || p.id || ''));
    if (remainingProducts.length > 0) {
      const remainingGroupMap = new Map<string, Product[]>();
      remainingProducts.forEach(p => {
        const pCat = p.category as any;
        const catName = (pCat && typeof pCat === 'object' ? pCat.name : pCat) || "Other Crackers";
        if (!remainingGroupMap.has(catName)) {
          remainingGroupMap.set(catName, []);
        }
        remainingGroupMap.get(catName)!.push(p);
      });

      remainingGroupMap.forEach((items, catName) => {
        groups.push({ category: catName, items });
      });
    }

    return groups;
  }, [categories, products]);

  return (
    <div className="min-h-screen flex flex-col bg-white relative font-sans">
      <UserHeader />
      
      <main className="flex-1 container mx-auto px-0 md:px-4 py-8">
        
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
            <div className="py-20 text-center text-gray-500 font-bold">Loading products...</div>
          ) : groupedProducts.length === 0 ? (
            <div className="py-20 text-center text-gray-500 font-bold">No products found.</div>
          ) : (
            groupedProducts.map((category, catIdx) => (
              <div key={catIdx}>
                {/* Category Header */}
                <div className="bg-[#b91c1c] text-white px-4 py-2.5 text-[13px] font-bold tracking-wider uppercase">
                  {category.category}
                </div>

                {/* Product Rows */}
                <div className="flex flex-col">
                  {category.items.map((item, itemIdx) => {
                    const productId = item._id || item.id || '';
                    const dp = getDiscountPrice(item.price, item.hasDiscount, settings.discountPercent, item.netRate, item.displayNetRate);
                    const inStock = (item.storeStockPieces ?? item.stock ?? 1) > 0;
                    
                    return (
                      <div key={productId} className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 ${itemIdx !== category.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        
                        {/* Product Details */}
                        <div className="col-span-1 md:col-span-5 flex items-center gap-4">
                          <div className="w-14 h-14 bg-gray-100 flex items-center justify-center shrink-0 rounded-md overflow-hidden">
                            <img src={item.image || "/sky_rocket_box.png"} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-gray-800 text-[13px]">{item.name}</h3>
                            <p className="text-gray-500 text-[11px] mt-0.5">{item.description || "Premium cracker"}</p>
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
                          <span className={`font-bold text-[12px] ${inStock ? 'text-[#2eab5b]' : 'text-[#f58220]'}`}>
                            {inStock ? "Yes" : "Out of Stock"}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center font-extrabold text-[#b91c1c] text-[13px]">
                          <span className="md:hidden font-bold text-xs text-gray-600">PRICE:</span>
                          <div className="flex flex-col md:items-center text-right md:text-center">
                            {item.hasDiscount && (item.netRate || item.wholesalePrice) && (
                              <span className="text-gray-400 line-through text-[10px]">₹{item.price}</span>
                            )}
                            <span>₹{dp.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center">
                          <span className="md:hidden font-bold text-xs text-gray-600">QUANTITY:</span>
                          <input 
                            type="text" 
                            value={quantities[productId] || ""} 
                            placeholder="1"
                            onChange={(e) => handleQuantityChange(productId, e.target.value)}
                            disabled={!inStock}
                            className="w-[50px] h-[30px] border border-gray-200 rounded text-center text-[13px] text-gray-600 outline-none focus:border-[#b91c1c] disabled:bg-gray-100" 
                          />
                        </div>

                        {/* Action */}
                        <div className="col-span-1 md:col-span-2 flex justify-end md:justify-end items-center">
                          <button 
                            onClick={() => handleAdd(item)}
                            disabled={!inStock}
                            className="border border-[#b91c1c] text-[#b91c1c] hover:bg-red-50 font-extrabold text-[11px] tracking-wide px-5 py-1.5 rounded transition-colors uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
