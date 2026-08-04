import React, { useState } from 'react';
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";

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

  const handleQuantityChange = (id: number, value: string) => {
    const val = parseInt(value);
    if (!isNaN(val) && val >= 1) {
      setQuantities(prev => ({ ...prev, [id]: val }));
    } else if (value === "") {
      const newQuantities = { ...quantities };
      delete newQuantities[id];
      setQuantities(newQuantities);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white relative font-sans">
      <UserHeader />
      
      <main className="flex-1 container mx-auto px-0 md:px-4 py-8">
        <div className="w-full bg-white shadow-sm border border-gray-200">
          
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-100 p-4 text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">
            <div className="col-span-5">PRODUCT DETAILS</div>
            <div className="col-span-2 text-center">UNIT/SIZE</div>
            <div className="col-span-1 text-center">IN STOCK</div>
            <div className="col-span-1 text-center">PRICE</div>
            <div className="col-span-1 text-center">QUANTITY</div>
            <div className="col-span-2 text-right">ACTION</div>
          </div>

          {/* Categories and Products */}
          {crackersData.map((category, catIdx) => (
            <div key={catIdx}>
              {/* Category Header */}
              <div className="bg-[#b91c1c] text-white px-4 py-2 text-sm font-bold tracking-wider uppercase">
                {category.category}
              </div>

              {/* Product Rows */}
              <div className="flex flex-col">
                {category.items.map((item, itemIdx) => (
                  <div key={item.id} className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 ${itemIdx !== category.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    
                    {/* Product Details */}
                    <div className="col-span-1 md:col-span-5 flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 flex items-center justify-center shrink-0 border border-gray-200 rounded">
                        <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain p-1" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                        <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </div>

                    {/* Unit/Size */}
                    <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center text-sm text-gray-600">
                      <span className="md:hidden font-bold text-xs">UNIT/SIZE:</span>
                      {item.size}
                    </div>

                    {/* In Stock */}
                    <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center text-sm">
                      <span className="md:hidden font-bold text-xs text-gray-600">IN STOCK:</span>
                      <span className={`font-bold text-xs ${item.inStock === 'Yes' ? 'text-green-600' : 'text-orange-500'}`}>
                        {item.inStock}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center font-bold text-red-700 text-sm">
                      <span className="md:hidden font-bold text-xs text-gray-600">PRICE:</span>
                      ₹{item.price.toFixed(2)}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center">
                      <span className="md:hidden font-bold text-xs text-gray-600">QUANTITY:</span>
                      <input 
                        type="text" 
                        value={quantities[item.id] || "1"} 
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="w-12 h-8 border border-gray-300 rounded text-center text-sm outline-none focus:border-red-500" 
                      />
                    </div>

                    {/* Action */}
                    <div className="col-span-1 md:col-span-2 flex justify-end md:justify-end items-center">
                      <button className="border border-red-600 text-red-600 hover:bg-red-50 font-bold text-xs px-6 py-1.5 rounded transition-colors uppercase">
                        ADD
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
          
        </div>

        {/* Pagination & Summary */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 text-sm text-gray-500">
          <div>Showing 1 - 8 of 124 products</div>
          <div className="flex items-center mt-4 md:mt-0 bg-white border border-gray-200 rounded overflow-hidden">
            <button className="px-3 py-1.5 border-r border-gray-200 hover:bg-gray-50">Prev</button>
            <button className="px-3 py-1.5 bg-[#b91c1c] text-white font-bold border-r border-[#b91c1c]">1</button>
            <button className="px-3 py-1.5 border-r border-gray-200 hover:bg-gray-50">2</button>
            <button className="px-3 py-1.5 border-r border-gray-200 hover:bg-gray-50">3</button>
            <button className="px-3 py-1.5 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </main>

      <UserFooter />
    </div>
  );
};

export default QuickEnquiry;
