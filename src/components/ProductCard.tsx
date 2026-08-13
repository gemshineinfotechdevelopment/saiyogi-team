import { ShoppingCart, X, Plus, Minus, CheckCircle2, Star, StarHalf } from "lucide-react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { DiscountTag } from "@/components/ui/DiscountTag";

const ProductCard = ({ product, categoryName, onCardClick, className }: { product: Product; categoryName?: string; onCardClick?: () => void; className?: string }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const { settings } = useSiteSettings();

  const productId = String(product._id || product.id || '');
  const cartItem = useMemo(() => items.find(i => i && i.product && String(i.product._id || i.product.id || '') === productId), [items, productId]);
  const quantity = cartItem?.quantity || 0;

  const discountPrice = getDiscountPrice(product.price, product.hasDiscount, settings.discountPercent, product.netRate, product.displayNetRate);
  const isNetRate = !!product.netRate && product.netRate > 0 && !!product.displayNetRate;
  const discount = (product.hasDiscount && !isNetRate) ? settings.discountPercent : 0;

  const selectedAmount = quantity * discountPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((product.storeStockPieces || 0) <= 0) return;
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((product.storeStockPieces || 0) <= 0) return;
    if (quantity >= (product.storeStockPieces || 0)) {
      toast.error("Not enough stock available");
      return;
    }
    if (quantity === 0) {
      addToCart(product, 1);
      toast.success(`${product.name} added to cart!`);
    } else {
      updateQuantity(productId, quantity + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 1) {
      updateQuantity(productId, quantity - 1);
    } else if (quantity === 1) {
      removeFromCart(productId);
    }
  };

  const QuantitySelector = ({ className }: { className?: string }) => (
    <div className={cn("flex items-center justify-center gap-1.5 w-full", className)} onClick={e => e.stopPropagation()}>
      <button
        onClick={handleDecrement}
        disabled={quantity <= 0}
        className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-xl bg-gradient-to-b from-white to-gray-100 border border-gray-300 border-b-4 border-b-gray-400 text-[#A80000] hover:bg-red-50 active:border-b-0 active:translate-y-0.5 transition-all font-black shadow-xs disabled:opacity-40 cursor-pointer"
      >
        <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
      </button>
      <span className="w-12 sm:w-14 py-1 text-center font-black text-white bg-gradient-to-b from-[#C80000] via-[#A80000] to-[#880000] border-b-2 border-[#660000] rounded-xl text-xs sm:text-sm shadow-md">
        {quantity}
      </span>
      <button
        onClick={handleIncrement}
        className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-xl bg-gradient-to-b from-white to-gray-100 border border-gray-300 border-b-4 border-b-gray-400 text-[#A80000] hover:bg-red-50 active:border-b-0 active:translate-y-0.5 transition-all font-black shadow-xs disabled:opacity-40 cursor-pointer"
        disabled={(product.storeStockPieces || 0) <= 0 || quantity >= ((product.storeStockPieces || 0) || 999)}
      >
        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
      </button>
    </div>
  );

  const starRating = product.rating !== undefined ? product.rating : 5;

  return (
    <>
      <div className="group h-full">
        <div
          className={cn("rounded-2xl overflow-hidden bg-[#FAF2E6] border border-[#FED7AA] hover:border-amber-400 transition-all duration-300 hover:shadow-lg flex flex-col h-full relative cursor-pointer", className)}
          onClick={() => onCardClick ? onCardClick() : setShowDetails(true)}
        >

          {/* Top Right Selected Amount Badge */}
          {quantity > 0 && (
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20">
              <span className="bg-[#A80000] text-white text-xs sm:text-sm font-bold px-2 py-0.5 rounded-md shadow-md">
                ₹ {selectedAmount}
              </span>
            </div>
          )}

          <div className="relative aspect-square overflow-hidden bg-[#FAF2E6] p-2 md:p-2.5 border-b border-amber-100/70">
            <img
              src={(product.storeStockPieces || 0) <= 0 ? '/saiyogi-logo-1.png' : (product.image || 'https://via.placeholder.com/300?text=No+Image')}
              alt={product.name}
              className="w-full h-full object-contain p-0.5 group-hover:scale-105 transition-transform duration-500 ease-out mix-blend-multiply"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
              }}
            />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 uppercase tracking-widest">
                Quick View
              </span>
            </div>

            {discount > 0 && !isNetRate && (
              <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 z-10">
                <DiscountTag discount={discount} className="w-11 sm:w-13 h-auto" />
              </div>
            )}

            {isNetRate && (
              <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-indigo-600 text-white text-xs sm:text-xs font-black px-2 py-0.5 rounded-full shadow-lg z-10 animate-pulse tracking-wide">
                NET RATE
              </span>
            )}

            {(product.storeStockPieces || 0) <= 0 ? (
              <span className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] z-10">
                <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-2xl">Sold Out</span>
              </span>
            ) : (product.storeStockPieces || 0) < 20 && (
              <span className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 bg-amber-400 text-amber-950 text-xs sm:text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                Only {product.storeStockPieces} left
              </span>
            )}
          </div>

          <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1 gap-1 h-5 min-w-0 overflow-hidden">
                <p className="text-xs sm:text-[10px] text-gray-500 font-extrabold uppercase tracking-wider truncate flex-1 min-w-0" title={product.brand || "Standard"}>
                  {product.brand || "Standard"}
                </p>
                {product.isSaiYogiVerified && (
                  <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-2xs shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              {/* Title with flexible height so 1-line and 2-line titles align perfectly with larger bold black font */}
              <div className="min-h-[48px] flex items-center justify-center my-1">
                <h3 className="product-title-font font-black text-lg sm:text-base md:text-lg text-black leading-snug tracking-tight line-clamp-2 text-center">
                  {product.name}
                </h3>
              </div>

              {/* Sai Yogi Verified Ribbon Badge & Dynamic Star Rating with uniform height */}
              <div className="flex flex-col items-center justify-center h-11 my-1">
                {product.isSaiYogiVerified ? (
                  <div className="flex items-center justify-center my-0.5 select-none shrink-0">
                    <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-[10px] sm:text-[10px] px-2 py-0.5 rounded-l-md shadow-md italic border-r border-amber-300 flex items-center justify-center">
                      SY
                    </div>
                    <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-white font-extrabold text-[10px] sm:text-[10px] px-2 py-0.5 rounded-r-md shadow-md italic tracking-wide font-serif border-y border-r border-red-500">
                      Sai Yogi Verified
                    </div>
                  </div>
                ) : (
                  <div className="h-[22px]" />
                )}

                {/* Star Rating based on product.rating */}
                <div className="flex items-center justify-center gap-0.5 my-0.5 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const isFilled = i < Math.floor(starRating);
                    const isHalf = i === Math.floor(starRating) && starRating % 1 >= 0.3;
                    if (isFilled) {
                      return <Star key={i} className="w-4 h-4 sm:w-4 sm:h-4 fill-amber-400 text-amber-400 drop-shadow-2xs" />;
                    }
                    if (isHalf) {
                      return <StarHalf key={i} className="w-4 h-4 sm:w-4 sm:h-4 fill-amber-400 text-amber-400 drop-shadow-2xs" />;
                    }
                    return <Star key={i} className="w-4 h-4 sm:w-4 sm:h-4 fill-gray-200 text-gray-200" />;
                  })}
                </div>
              </div>
            </div>

            <div className="pt-1 flex flex-col items-center gap-1">
              <div className="flex items-baseline justify-center gap-1.5 flex-wrap h-6">
                <span className="font-display font-black text-gray-900 text-base sm:text-lg md:text-xl leading-none">₹{discountPrice}</span>
                {product.hasDiscount && !isNetRate && (
                  <span className="text-xs sm:text-xs text-gray-400 line-through font-bold">₹{product.price}</span>
                )}
                {isNetRate && (
                  <span className="text-[10px] sm:text-[9px] text-indigo-500 font-bold uppercase tracking-tighter">Fixed Price</span>
                )}
              </div>

              <div className="flex justify-center w-full pt-1" onClick={e => e.stopPropagation()}>
                {quantity > 0 ? (
                  <QuantitySelector />
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={(product.storeStockPieces || 0) <= 0}
                    className={cn(
                      "w-full h-9 sm:h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-150 transform active:translate-y-0.5 select-none",
                      (product.storeStockPieces || 0) <= 0
                        ? "bg-gray-200 text-gray-400 border-b-2 border-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-b from-[#C80000] via-[#A80000] to-[#880000] text-white border-b-4 border-[#660000] hover:border-[#550000] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_6px_rgba(168,0,0,0.3)] hover:brightness-110 active:border-b-0 active:shadow-inner cursor-pointer"
                    )}
                  >
                    <ShoppingCart className="w-4 h-4 sm:w-4.5 sm:h-4.5 drop-shadow-xs" />
                    <span>{(product.storeStockPieces || 0) <= 0 ? "Sold Out" : "Add to Cart"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDetails && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md overflow-y-auto p-4 flex items-center justify-center animate-in fade-in duration-300"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="relative bg-[#fefae0] max-w-lg md:max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-500 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-2 hover:bg-white transition-colors shadow-lg"
            >
              <X className="h-5 w-5 text-red-900" />
            </button>

            <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-[#FAF2E6] p-4 md:p-8 flex items-center justify-center">
              <img
                src={(product.storeStockPieces || 0) <= 0 ? '/saiyogi-logo-1.png' : (product.image || 'https://via.placeholder.com/300?text=No+Image')}
                alt={product.name}
                className="w-full h-full object-contain max-h-[350px] md:max-h-[400px] mix-blend-multiply"
              />
            </div>

            <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs text-red-600 font-black uppercase tracking-widest">{product.brand}</span>
                {(categoryName || product.category) && <span className="h-1 w-1 bg-red-200 rounded-full" />}
                <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">{categoryName || (typeof product.category === 'object' && product.category !== null ? (product.category as any).name : product.category)}</span>
                {product.isSaiYogiVerified && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                    <span>Sai Yogi Verified</span>
                  </span>
                )}
              </div>

              <h2 className="product-title-font text-2xl md:text-3xl font-black text-red-950 mb-2 leading-tight">{product.name}</h2>

              {/* Gold Star Rating in Modal */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const isFilled = i < Math.floor(starRating);
                    const isHalf = i === Math.floor(starRating) && starRating % 1 >= 0.3;
                    if (isFilled) return <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow-2xs" />;
                    if (isHalf) return <StarHalf key={i} className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow-2xs" />;
                    return <Star key={i} className="w-4 h-4 fill-gray-200 text-gray-200" />;
                  })}
                  <span className="text-xs font-bold text-amber-800 ml-1">({starRating.toFixed(1)})</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2 md:gap-3 mb-4 md:mb-6">
                <span className="text-2xl md:text-4xl font-black text-red-700">₹{discountPrice}</span>
                {product.hasDiscount && !isNetRate && (
                  <span className="text-base md:text-xl text-gray-300 line-through font-medium">₹{product.price}</span>
                )}
                {isNetRate && (
                  <span className="text-xs md:text-sm text-indigo-500 font-black uppercase tracking-widest px-2.5 py-0.5 bg-indigo-50 rounded-lg border border-indigo-100">Net Rate Only</span>
                )}
              </div>

              {product.description && (
                <p className="text-sm md:text-base text-gray-700 mb-6 leading-relaxed">
                  {product.description}
                </p>
              )}

              <div className="space-y-4">
                {quantity > 0 ? (
                  <div className="flex items-center gap-4">
                    <QuantitySelector className="p-1 gap-4" />
                    <span className="text-sm font-bold text-red-600">Added to Cart</span>
                  </div>
                ) : (
                  <Button
                    className={cn(
                      "w-full h-11 md:h-14 rounded-2xl text-base md:text-lg font-black uppercase tracking-wider transition-all duration-150 transform active:translate-y-1 select-none",
                      (product.storeStockPieces || 0) <= 0
                        ? "bg-gray-200 text-gray-400 border-b-4 border-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-b from-red-600 via-red-700 to-red-900 text-white border-b-4 border-red-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_15px_rgba(185,28,28,0.4)] hover:brightness-110 active:border-b-0 active:shadow-inner cursor-pointer"
                    )}
                    onClick={handleAddToCart}
                    disabled={(product.storeStockPieces || 0) <= 0}
                  >
                    {(product.storeStockPieces || 0) <= 0 ? (
                      <span className="flex items-center gap-1.5"><X className="h-5 w-5" /> Out of Stock</span>
                    ) : (
                      <span className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 drop-shadow-xs" /> Add to Cart</span>
                    )}
                  </Button>
                )}

                <p className="text-[10px] md:text-xs text-gray-400 text-center font-medium italic">
                  Fast delivery within 2-3 business days
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;

