import React from "react";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { useLocation } from "react-router-dom";

export const FloatingCartTotal: React.FC = () => {
  const { items, isCartOpen, setIsCartOpen } = useCart();
  const { settings } = useSiteSettings();
  const location = useLocation();

  // Hide when cart drawer is open or on admin/quick-enquiry routes
  if (
    isCartOpen ||
    location.pathname.startsWith("/admin") ||
    location.pathname.includes("quick-enquir") ||
    location.pathname.includes("quick-enquer")
  ) {
    return null;
  }

  const validItems = Array.isArray(items) ? items.filter((i) => i && i.product) : [];
  if (validItems.length === 0) return null;

  const totalPrice = validItems.reduce((acc, item) => {
    const price = item.product?.price || 0;
    const hasDiscount = !!item.product?.hasDiscount;
    const discountPercent = settings?.discountPercent || 0;
    const netRate = item.product?.netRate;
    const displayNetRate = !!item.product?.displayNetRate;

    const dp = getDiscountPrice(
      price,
      hasDiscount,
      discountPercent,
      netRate,
      displayNetRate
    );
    return acc + dp * (item.quantity || 0);
  }, 0);

  if (totalPrice <= 0) return null;

  return (
    <div
      onClick={() => setIsCartOpen(true)}
      className="fixed bottom-20 left-3 sm:bottom-20 sm:left-6 z-50 bg-[#A80000] hover:bg-[#8B0000] text-white px-2.5 py-1 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl shadow-2xl border border-amber-400/30 cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 group"
      title="Click to view cart"
    >
      <span className="font-bold text-[9px] sm:text-sm tracking-wide">
        Total : ₹ {totalPrice.toFixed(2)}
      </span>
    </div>
  );
};

export default FloatingCartTotal;
