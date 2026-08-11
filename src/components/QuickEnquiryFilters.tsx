import React from "react";
import { ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";

interface QuickEnquiryFiltersProps {
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  uniqueBrands: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  uniqueCategoryNames: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalPrice: number;
  totalItems: number;
  showTableHeader?: boolean;
}

export const QuickEnquiryFilters: React.FC<QuickEnquiryFiltersProps> = ({
  selectedBrand,
  setSelectedBrand,
  uniqueBrands,
  selectedCategory,
  setSelectedCategory,
  uniqueCategoryNames,
  searchQuery,
  setSearchQuery,
  totalPrice,
  totalItems,
  showTableHeader = true,
}) => {
  const navigate = useNavigate();
  const { setIsCartOpen } = useCart();

  return (
    <div className="fixed top-[76px] md:top-[108px] left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-md py-1.5 sm:py-3 px-2 sm:px-4">
      <div className="container mx-auto">
        {/* Filters & Cart Summary Row */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full md:w-auto gap-2 sm:gap-3">
            <select 
              value={selectedBrand} 
              onChange={e => setSelectedBrand(e.target.value)}
              className="w-full sm:w-40 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 text-[11px] sm:text-sm font-bold outline-none focus:border-[#A80000] text-gray-700 bg-white shadow-xs appearance-none cursor-pointer truncate pr-6 sm:pr-8"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238b2ce0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.4rem center', backgroundSize: '0.8rem' }}
            >
              {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full sm:w-48 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 text-[11px] sm:text-sm font-bold outline-none focus:border-[#A80000] text-gray-700 bg-white shadow-xs appearance-none cursor-pointer truncate pr-6 sm:pr-8"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238b2ce0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.4rem center', backgroundSize: '0.8rem' }}
            >
              {uniqueCategoryNames.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="relative w-full sm:w-64">
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 px-2.5 py-1.5 sm:py-2.5 rounded-md sm:rounded-xl border border-gray-200 text-xs sm:text-sm font-medium outline-none focus:border-[#A80000] bg-white shadow-2xs text-gray-800"
              />
              <div 
                onClick={() => setIsCartOpen(true)}
                className="md:hidden bg-[#A80000] hover:bg-red-800 text-white rounded-md px-2.5 py-1.5 flex items-center gap-1.5 shadow-md border border-[#8a0000] cursor-pointer shrink-0"
                title="Click to view Cart & Checkout"
              >
                <div className="relative flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white" />
                  <span className="absolute -top-1.5 -right-2 bg-[#F4C542] text-[#1A1A1A] text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-black border border-white">
                    {totalItems}
                  </span>
                </div>
                <span className="text-xs font-black">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
          
          {/* Desktop Cart Total & Checkout Box */}
          <div 
            onClick={() => setIsCartOpen(true)}
            className="hidden md:flex bg-[#A80000] hover:bg-red-800 text-white rounded-2xl px-5 py-2.5 items-center justify-start gap-5 shadow-lg border border-[#8a0000] cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0"
            title="Click to view Cart & Checkout"
          >
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-extrabold text-white/90 uppercase tracking-wider">Cart Total</span>
              <span className="text-xl font-black leading-tight">₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="relative flex items-center justify-center pl-2">
              <ShoppingBag className="w-6 h-6 text-white" />
              <span className="absolute -top-1.5 -right-2 bg-[#F4C542] text-[#1A1A1A] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-sm border border-white">
                {totalItems}
              </span>
            </div>
          </div>
        </div>

        {/* Table Header Row */}
        {showTableHeader && (
          <div className="hidden md:grid md:grid-cols-12 gap-4 bg-[#f8f9fa] border border-gray-200 rounded-xl py-3 px-6 text-[11px] font-black text-gray-600 uppercase tracking-wider items-center shadow-xs mt-3">
            <div className="col-span-4 pl-2">PRODUCT NAME</div>
            <div className="col-span-2 text-center">ITEM CODE</div>
            <div className="col-span-2 text-center">CONTENT</div>
            <div className="col-span-1 text-center">UNIT PRICE</div>
            <div className="col-span-2 text-center">QUANTITY</div>
            <div className="col-span-1 text-right pr-4">TOTAL</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickEnquiryFilters;
