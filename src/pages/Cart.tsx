import React from "react";
import { Link, useNavigate } from "react-router-dom";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { 
  ShoppingCart, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  Home, 
  ArrowLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice, openCart } = useCart();
  const { settings } = useSiteSettings();
  const { isUserLoggedIn, openLoginModal } = useAuth();
  const navigate = useNavigate();

  const packingCharge = settings.enablePackingCharge !== false 
    ? (totalPrice <= 3999 ? 120 : Math.round(totalPrice * 0.03)) 
    : 0;
  const estimatedTotal = totalPrice + packingCharge;

  const tnMinPurchase = settings.minimumPurchaseAmount || 3000;
  const otherMinPurchase = settings.minPurchaseOutsideTN || 5000;

  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (isUserLoggedIn) {
      openCart("checkout");
    } else {
      toast.info("Please log in with your mobile number to proceed to checkout.");
      openLoginModal();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <UserHeader />

      {/* Breadcrumb Navigation Bar */}
      <div className="bg-white border-b border-gray-200 py-3.5 px-4 shadow-xs">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500">
            <Link to="/" className="flex items-center gap-1 hover:text-[#900000] transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[#900000] font-extrabold">Cart</span>
          </div>

          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-[#900000] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-md p-8 sm:p-12 text-center max-w-lg mx-auto my-8">
            <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-5 text-[#900000] shadow-inner">
              <ShoppingCart className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-wide">
              Your Cart is Empty
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              Looks like you haven't added any crackers or combo packs yet. Explore our wholesale catalog to get started!
            </p>
            <Button
              onClick={() => navigate("/catalog")}
              className="bg-[#900000] hover:bg-[#700000] text-white font-extrabold px-8 py-6 rounded-xl uppercase text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          /* Active Cart Grid (Layout matching reference pics) */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
            
            {/* Left Column (2 Cols): CART ITEMS */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              
              {/* Card Header */}
              <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-red-50 rounded-lg text-[#900000]">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <h2 className="font-black text-gray-900 text-base sm:text-lg uppercase tracking-wide">
                    CART ITEMS ({totalItems})
                  </h2>
                </div>

                <button
                  onClick={clearCart}
                  className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline transition-colors flex items-center gap-1"
                  title="Clear all items in cart"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear Cart</span>
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-gray-100">
                {items.map(({ product, quantity }) => {
                  const productId = String(product._id || product.id);
                  const dp = getDiscountPrice(
                    product.price, 
                    product.hasDiscount, 
                    settings.discountPercent, 
                    product.netRate, 
                    product.displayNetRate
                  );
                  const stockVal = product.storeStockPieces !== undefined 
                    ? Number(product.storeStockPieces) 
                    : (product.stock !== undefined ? Number(product.stock) : 999);

                  return (
                    <div 
                      key={productId}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Product Info & Thumbnail */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                          <img 
                            src={stockVal <= 0 ? '/saiyogi-logo-1.png' : product.image} 
                            alt={product.name} 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 
                            onClick={() => navigate(`/product/${productId}`)}
                            className="font-extrabold text-gray-900 text-sm sm:text-base truncate hover:text-[#900000] transition-colors cursor-pointer"
                          >
                            {product.name}
                          </h3>
                          <div className="text-xs sm:text-sm font-semibold text-[#900000] mt-0.5">
                            ₹{dp.toLocaleString('en-IN')}.00 <span className="text-gray-400 font-normal text-xs">/ pc</span>
                          </div>
                        </div>
                      </div>

                      {/* Stepper Controls, Subtotal & Delete Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t border-gray-100 sm:border-t-0">
                        
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                          <button
                            onClick={() => updateQuantity(productId, quantity - 1)}
                            className="px-2.5 py-1.5 hover:bg-gray-100 disabled:opacity-30 text-gray-700 transition-colors"
                            disabled={quantity <= 1}
                            title="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-3 py-1 text-xs sm:text-sm font-black text-gray-900 text-center min-w-[32px]">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(productId, Math.min(stockVal, quantity + 1))}
                            className="px-2.5 py-1.5 hover:bg-gray-100 disabled:opacity-30 text-gray-700 transition-colors"
                            disabled={quantity >= stockVal}
                            title="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Item Total Price */}
                        <div className="text-right min-w-[90px]">
                          <span className="font-black text-gray-900 text-sm sm:text-base">
                            ₹{(dp * quantity).toLocaleString('en-IN')}.00
                          </span>
                        </div>

                        {/* Remove Item Button */}
                        <button
                          onClick={() => removeFromCart(productId)}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all shrink-0"
                          title="Remove product"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Card Footer: Back to Shop */}
              <div className="p-4 sm:p-5 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => navigate("/catalog")}
                  className="border-gray-300 text-gray-700 hover:text-[#900000] font-bold text-xs uppercase rounded-lg"
                >
                  ← Continue Shopping
                </Button>

                <span className="text-xs text-gray-500 font-medium">
                  {totalItems} items in cart
                </span>
              </div>
            </div>

            {/* Right Column (1 Col): CART TOTALS */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6 space-y-5 sticky top-28">
              
              <h2 className="font-black text-gray-900 text-lg uppercase tracking-wide border-b border-gray-100 pb-3.5">
                Cart Totals
              </h2>

              <div className="space-y-3 divide-y divide-gray-100 text-xs sm:text-sm">
                <div className="flex justify-between items-center py-1 font-semibold text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-extrabold text-gray-900 text-base">
                    ₹{totalPrice.toLocaleString('en-IN')}.00
                  </span>
                </div>

                {packingCharge > 0 && (
                  <div className="flex justify-between items-center pt-3 font-semibold text-gray-700">
                    <span>Packing Charge</span>
                    <span className="font-extrabold text-gray-900">
                      ₹{packingCharge.toLocaleString('en-IN')}.00
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 font-black text-gray-900 text-base">
                  <span className="text-gray-900 uppercase">Total</span>
                  <span className="text-[#900000] text-xl font-black">
                    ₹{Math.round(estimatedTotal).toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>

              {/* Proceed to Checkout Button */}
              <Button
                onClick={handleProceedToCheckout}
                className="w-full bg-[#900000] hover:bg-[#700000] text-white font-extrabold py-6 rounded-xl uppercase text-xs sm:text-sm tracking-wider shadow-md transition-all cursor-pointer"
              >
                PROCEED TO CHECKOUT
              </Button>

              {/* Minimum Subtotal Limit Banner (Compact Size) */}
              <div className="bg-red-50/90 border border-red-200/90 rounded-xl p-2.5 text-[11px]">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase text-[#900000] tracking-wider mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#900000] shrink-0" />
                  <span>MINIMUM SUBTOTAL LIMIT</span>
                </div>
                <div className="flex justify-between items-center text-gray-700 font-semibold gap-2 pt-0.5">
                  <span>TN: <strong className="text-gray-900 font-extrabold">₹{tnMinPurchase.toLocaleString('en-IN')}</strong></span>
                  <span className="text-red-300">|</span>
                  <span>Other States: <strong className="text-gray-900 font-extrabold">₹{otherMinPurchase.toLocaleString('en-IN')}</strong></span>
                </div>
              </div>

              <p className="text-center text-[11px] text-gray-500 font-normal">
                * Prices are estimates for wholesale fireworks enquiry.
              </p>
            </div>

          </div>
        )}
      </main>

      <UserFooter />
    </div>
  );
};

export default Cart;
