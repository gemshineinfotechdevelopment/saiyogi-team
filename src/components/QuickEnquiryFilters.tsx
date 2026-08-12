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
    <div className={`fixed left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-md py-2 sm:py-3 px-2.5 sm:px-4 transition-all duration-300 ${
      isNavbarHidden ? "top-0" : "top-[100px] md:top-[108px]"

    }`}>
      <div className="container mx-auto">
        {/* Filters & Cart Summary Row */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-1 sm:gap-4">
          <div className="flex flex-row items-center w-full md:w-auto gap-1 sm:gap-3">
            <select 
              value={selectedBrand} 
              onChange={e => setSelectedBrand(e.target.value)}
              className="flex-1 sm:flex-none sm:w-40 p-1 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 text-[11px] sm:text-sm font-bold outline-none focus:border-[#A80000] text-gray-700 bg-white shadow-xs appearance-none cursor-pointer truncate pr-5 sm:pr-8"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238b2ce0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.3rem center', backgroundSize: '0.75rem' }}
            >
              {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="flex-1 sm:flex-none sm:w-48 p-1 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 text-[11px] sm:text-sm font-bold outline-none focus:border-[#A80000] text-gray-700 bg-white shadow-xs appearance-none cursor-pointer truncate pr-5 sm:pr-8"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238b2ce0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.3rem center', backgroundSize: '0.75rem' }}
            >
              {uniqueCategoryNames.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="relative flex-1 sm:flex-none sm:w-64">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-2 sm:px-3 sm:pr-4 p-1 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-200 text-[11px] sm:text-sm font-medium outline-none focus:border-[#A80000] bg-white shadow-xs text-gray-800 font-sans placeholder:text-gray-400"
              />
            </div>
          </div>
          
          {/* Cart Total & Checkout Box */}
          <div 
            onClick={() => setIsCartOpen(true)}
            className="w-full md:w-auto bg-[#A80000] hover:bg-red-800 text-white rounded-lg sm:rounded-2xl px-3 sm:px-5 py-1 sm:py-2.5 flex items-center justify-between md:justify-start md:gap-5 shadow-md sm:shadow-lg border border-[#8a0000] cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0"
            title="Click to view Cart & Checkout"
          >
            <div className="flex flex-col text-left justify-center">
              <span className="text-[8px] sm:text-[10px] font-extrabold text-white/90 uppercase tracking-wider leading-none">Cart Total</span>
              <span className="text-xs sm:text-xl font-black leading-tight mt-0.5">₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="relative flex items-center justify-center pl-2">
              <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              <span className="absolute -top-1 -right-1.5 bg-[#F4C542] text-[#1A1A1A] text-[8px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-black shadow-sm border border-white">
                {totalItems}
              </span>
            </div>
          </div>
        </div>

        {/* Fixed Table Column Headers for Desktop View (Product Name, Item Code, Content, Unit Price, Qty, Subtotal) */}
        {showTableHeader && (
          <div className="hidden md:block mt-1.5 pt-1.5 border-t border-gray-100 font-sans">
            <div className="grid grid-cols-12 gap-4 bg-gray-900 text-white py-2 px-4 rounded-xl font-black text-xs uppercase tracking-wider items-center shadow-xs">
              <div className="col-span-4 flex items-center gap-2">
                <span>Product Name</span>
              </div>
              <div className="col-span-2 text-center">
                <span>Item Code</span>
              </div>
              <div className="col-span-2 text-center">
                <span>Content</span>
              </div>
              <div className="col-span-1 text-center">
                <span>Unit Price</span>
              </div>
              <div className="col-span-2 text-center">
                <span>Qty</span>
              </div>
              <div className="col-span-1 text-right pr-2">
                <span>Subtotal</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickEnquiryFilters;
