import React, { useState } from 'react';
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { Plus, Minus, ShoppingCart, Sparkles } from "lucide-react";

const crackersData = [
  {
    category: "SPARKLERS",
    items: [
      { id: 1, name: "10cm Electric Sparklers", desc: "Safe for kids", size: "1 Box", inStock: "Yes", price: 50.00, image: "/flower_pots.png" },
      { id: 2, name: "15cm Green Sparklers", desc: "Color changing", size: "1 Box", inStock: "Yes", price: 80.00, image: "/sky_rocket_box.png" },
    ]
  },
  {
    category: "FLOWER POTS",
    items: [
      { id: 3, name: "Flower Pots Small", desc: "Classic fountain", size: "10 Pieces", inStock: "Yes", price: 120.00, image: "/flower_pots.png" },
      { id: 4, name: "Flower Pots Big", desc: "High reaching fountain", size: "10 Pieces", inStock: "Yes", price: 200.00, image: "/sky_rocket_box.png" },
    ]
  },
  {
    category: "GROUND CHAKKARS",
    items: [
      { id: 5, name: "Ground Chakkar Normal", desc: "Spinning wheel", size: "10 Pieces", inStock: "Low", price: 90.00, image: "/flower_pots.png" },
      { id: 6, name: "Ground Chakkar Special", desc: "Long lasting spin", size: "10 Pieces", inStock: "Yes", price: 150.00, image: "/sky_rocket_box.png" },
    ]
  },
  {
    category: "SKY SHOTS",
    items: [
      { id: 7, name: "7 Shots", desc: "Multi-color aerial", size: "1 Piece", inStock: "Yes", price: 350.00, image: "/flower_pots.png" },
      { id: 8, name: "12 Shots", desc: "Premium sky show", size: "1 Piece", inStock: "Yes", price: 550.00, image: "/sky_rocket_box.png" },
    ]
  }
];

const QuickEnquiry = () => {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const handleQuantityChange = (id: number, value: string) => {
    const val = parseInt(value);
    if (!isNaN(val) && val >= 0) {
      setQuantities(prev => ({ ...prev, [id]: val }));
    } else if (value === "") {
      setQuantities(prev => ({ ...prev, [id]: 0 }));
    }
  };

  const incrementQuantity = (id: number) => {
    setQuantities(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const decrementQuantity = (id: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      if (current <= 0) return prev;
      return { ...prev, [id]: current - 1 };
    });
  };

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
          
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 bg-gradient-to-r from-[#A80000] to-[#750000] p-5 text-xs font-black text-white uppercase tracking-widest border-b border-[#F4C542]/20">
            <div className="col-span-5">PRODUCT DETAILS</div>
            <div className="col-span-2 text-center">UNIT/SIZE</div>
            <div className="col-span-1 text-center">STOCK</div>
            <div className="col-span-1 text-center">WHOLESALE PRICE</div>
            <div className="col-span-2 text-center">QUANTITY</div>
            <div className="col-span-1 text-right">ACTION</div>
          </div>

          {/* Categories and Products */}
          {crackersData.map((category, catIdx) => (
            <div key={catIdx} className="border-b border-gray-100 last:border-0">
              {/* Category Header */}
              <div className="bg-[#FFF6E5] text-[#A80000] px-6 py-3.5 text-sm font-black tracking-widest uppercase flex items-center justify-between border-b border-[#A80000]/10">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#F4C542] fill-[#F4C542]" />
                  {category.category}
                </span>
                <span className="text-[10px] text-gray-500 font-bold bg-white px-2.5 py-1 rounded-full border border-gray-200">
                  {category.items.length} Products
                </span>
              </div>

              {/* Product Rows */}
              <div className="flex flex-col divide-y divide-gray-100">
                {category.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-6 hover:bg-gray-50/50 transition-colors">
                    
                    {/* Product Details (Image clickable for preview) */}
                    <div className="col-span-1 md:col-span-5 flex items-center gap-4">
                      <div 
                        onClick={() => setActiveImage(item.image)} 
                        className="w-16 h-16 bg-white flex items-center justify-center shrink-0 border border-gray-200 rounded-xl cursor-zoom-in hover:border-[#A80000] hover:scale-105 transition-all shadow-sm relative overflow-hidden group"
                        title="Click to view image"
                      >
                        <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain p-1 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] text-white font-extrabold tracking-wider uppercase bg-[#A80000]/80 px-2 py-0.5 rounded-full scale-90">View</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-sm tracking-wide">{item.name}</h3>
                        <p className="text-gray-400 text-xs mt-0.5 font-medium">{item.desc}</p>
                      </div>
                    </div>

                    {/* Unit/Size */}
                    <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center text-sm text-gray-600 font-bold">
                      <span className="md:hidden font-bold text-xs text-gray-400 uppercase">UNIT/SIZE:</span>
                      {item.size}
                    </div>

                    {/* In Stock */}
                    <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center text-sm">
                      <span className="md:hidden font-bold text-xs text-gray-400 uppercase">STOCK:</span>
                      <span className={`font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider ${item.inStock === 'Yes' ? 'text-green-700 bg-green-50 border border-green-200/50' : 'text-amber-700 bg-amber-50 border border-amber-200/50'}`}>
                        {item.inStock === 'Yes' ? 'In Stock' : 'Low'}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center font-black text-[#A80000] text-sm">
                      <span className="md:hidden font-bold text-xs text-gray-400 uppercase">PRICE:</span>
                      ₹{item.price.toFixed(2)}
                    </div>

                    {/* Quantity Selector with Plus/Minus buttons */}
                    <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center">
                      <span className="md:hidden font-bold text-xs text-gray-400 uppercase">QUANTITY:</span>
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5 shadow-sm">
                        <button 
                          onClick={() => decrementQuantity(item.id)}
                          className="w-8 h-8 rounded-md bg-white hover:bg-[#A80000] hover:text-white text-gray-800 flex items-center justify-center font-bold border border-gray-150 transition-all duration-200"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input 
                          type="text" 
                          value={quantities[item.id] !== undefined ? quantities[item.id] : "0"} 
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          className="w-10 h-8 bg-transparent text-center text-sm font-black text-gray-900 outline-none" 
                        />
                        <button 
                          onClick={() => incrementQuantity(item.id)}
                          className="w-8 h-8 rounded-md bg-white hover:bg-[#A80000] hover:text-white text-gray-800 flex items-center justify-center font-bold border border-gray-150 transition-all duration-200"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="col-span-1 md:col-span-1 flex justify-end md:justify-end items-center">
                      <button className="w-full bg-[#A80000] text-white hover:bg-[#F4C542] hover:text-[#1A1A1A] font-extrabold text-[11px] py-2.5 rounded-xl transition-all duration-300 shadow-md uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]">
                        <ShoppingCart className="h-3 w-3" /> Add
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
          
        </div>

        {/* Pagination & Summary */}
        <div className="px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 text-sm text-gray-500 bg-white/70 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-gray-100">
            <div className="font-bold text-gray-600">Showing 1 - 8 of 124 products</div>
            <div className="flex items-center mt-4 md:mt-0 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button className="px-4 py-2 border-r border-gray-100 hover:bg-gray-50 font-bold text-xs text-gray-600 transition-colors">Prev</button>
              <button className="px-4 py-2 bg-[#A80000] text-white font-black border-r border-[#A80000] text-xs">1</button>
              <button className="px-4 py-2 border-r border-gray-100 hover:bg-gray-50 font-bold text-xs text-gray-600 transition-colors">2</button>
              <button className="px-4 py-2 border-r border-gray-100 hover:bg-gray-50 font-bold text-xs text-gray-600 transition-colors">3</button>
              <button className="px-4 py-2 hover:bg-gray-50 font-bold text-xs text-gray-600 transition-colors">Next</button>
            </div>
          </div>
        </div>

      </main>

      {/* Image Preview Modal */}
      {activeImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={() => setActiveImage(null)}>
          <div className="relative max-w-2xl max-h-[85vh] bg-white p-3 rounded-3xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setActiveImage(null)} 
              className="absolute top-4 right-4 bg-[#A80000] hover:bg-[#F4C542] hover:text-[#1A1A1A] text-white rounded-full p-2.5 transition-colors z-10 w-10 h-10 flex items-center justify-center font-bold shadow-md hover:scale-105"
            >
              ✕
            </button>
            <img src={activeImage} alt="Product Preview" className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-inner bg-gray-50 p-2" />
          </div>
        </div>
      )}

      <UserFooter />
    </div>
  );
};

export default QuickEnquiry;
