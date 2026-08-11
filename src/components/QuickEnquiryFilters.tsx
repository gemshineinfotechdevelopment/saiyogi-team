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
  isNavbarHidden?: boolean;
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
  isNavbarHidden = false,
}) => {
  const navigate = useNavigate();
  const { setIsCartOpen } = useCart();

  return (
    <div className={`fixed left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-md py-2 sm:py-3 px-2.5 sm:px-4 font-sans transition-all duration-300 ${isNavbarHidden ? 'top-0' : 'top-[60px] md:top-[108px]'
      }`}>
      <div className="container mx-auto">
        {/* Filters & Cart Summary Row */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full md:w-auto gap-2 sm:gap-3">
            <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="flex-1 sm:flex-none sm:w-36 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-gray-200 text-[10px] sm:text-xs font-extrabold outline-none focus:border-[#A80000] text-gray-700 bg-white shadow-xs appearance-none cursor-pointer truncate pr-5 sm:pr-7 font-sans"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238b2ce0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.4rem center', backgroundSize: '0.75rem' }}
              >
                {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="flex-1 sm:flex-none sm:w-44 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-gray-200 text-[10px] sm:text-xs font-extrabold outline-none focus:border-[#A80000] text-gray-700 bg-white shadow-xs appearance-none cursor-pointer truncate pr-5 sm:pr-7 font-sans"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238b2ce0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.4rem center', backgroundSize: '0.75rem' }}
              >
                {uniqueCategoryNames.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="relative w-full sm:w-56">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-2.5 sm:px-3 sm:pr-4 p-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-[10px] sm:text-xs font-semibold outline-none focus:border-[#A80000] bg-white shadow-xs text-gray-800 font-sans placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Cart Total & Checkout Box */}
          <div
            onClick={() => setIsCartOpen(true)}
            className="w-full md:w-auto bg-[#A80000] hover:bg-red-800 text-white rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1 sm:py-2 flex items-center justify-between md:justify-start md:gap-4 shadow-md sm:shadow-lg border border-[#8a0000] cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0 font-sans"
            title="Click to view Cart & Checkout"
          >
            <div className="flex flex-col text-left">
              <span className="text-[8px] sm:text-[9px] font-extrabold text-white/90 uppercase tracking-wider">Cart Total</span>
              <span className="text-sm sm:text-lg font-black leading-tight">₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>

            <div className="relative flex items-center justify-center pl-1.5">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span className="absolute -top-1.5 -right-2 bg-[#F4C542] text-[#1A1A1A] text-[8px] sm:text-[9px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-black shadow-sm border border-white">
                {totalItems}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickEnquiryFilters;
