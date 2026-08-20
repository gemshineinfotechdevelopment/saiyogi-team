import { ShoppingCart, X, Plus, Minus, CheckCircle2, Star, StarHalf, Heart } from "lucide-react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { useWishlist } from "@/context/WishlistContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { DiscountTag } from "@/components/ui/DiscountTag";

const ProductCard = ({ product, categoryName, onCardClick, className, showDetailOnly, onDetailClose }: { product: Product; categoryName?: string; onCardClick?: () => void; className?: string; showDetailOnly?: boolean; onDetailClose?: () => void }) => {
  const [showDetails, setShowDetails] = useState(!!showDetailOnly);

  const handleCloseDetails = () => {
    setShowDetails(false);
    if (onDetailClose) onDetailClose();
  };
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const { settings } = useSiteSettings();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const productId = String(product._id || product.id || '');
  const cartItem = useMemo(() => items.find(i => i && i.product && String(i.product._id || i.product.id || '') === productId), [items, productId]);
  const quantity = cartItem?.quantity || 0;
  const isWishlisted = isInWishlist(productId);

  const discountPrice = getDiscountPrice(product.price, product.hasDiscount, settings.discountPercent, product.netRate, product.displayNetRate);
  const isNetRate = !!product.netRate && product.netRate > 0 && !!product.displayNetRate;
  const discount = (product.hasDiscount && !isNetRate) ? settings.discountPercent : 0;

  const stockVal = product.storeStockPieces !== undefined ? Number(product.storeStockPieces) : (product.stock !== undefined ? Number(product.stock) : 0);
  const isOutOfStock = stockVal <= 0;

  const selectedAmount = quantity * discountPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    if (quantity >= stockVal) {
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
    <div className={cn("flex items-center justify-between gap-1.5 w-full", className)} onClick={e => e.stopPropagation()}>
      <button
        onClick={handleDecrement}
        disabled={quantity <= 0}
        className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl bg-gradient-to-b from-white to-gray-100 border border-gray-300 border-b-4 border-b-gray-400 text-[#A80000] hover:bg-red-50 active:border-b-0 active:translate-y-0.5 transition-all font-black shadow-xs disabled:opacity-40 cursor-pointer"
      >
        <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
      </button>
      <span className="flex-1 py-1 text-center font-black text-white bg-gradient-to-b from-[#C80000] via-[#A80000] to-[#880000] border-b-2 border-[#660000] rounded-xl text-xs sm:text-sm shadow-md">
        {quantity}
      </span>
      <button
        onClick={handleIncrement}
        className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl bg-gradient-to-b from-white to-gray-100 border border-gray-300 border-b-4 border-b-gray-400 text-[#A80000] hover:bg-red-50 active:border-b-0 active:translate-y-0.5 transition-all font-black shadow-xs disabled:opacity-40 cursor-pointer"
        disabled={isOutOfStock || quantity >= stockVal}
      >
        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
      </button>
    </div>
  );

  const starRating = product.rating !== undefined ? product.rating : 5;
  const reviewCount = product.reviews;

  return (
    <>
      {!showDetailOnly && (
        <div className="group h-full">
          <div
            className={cn("rounded-2xl overflow-hidden bg-white border border-amber-200/80 hover:border-amber-400 transition-all duration-300 hover:shadow-lg flex flex-col h-full relative cursor-pointer text-left items-start", className)}
            onClick={() => onCardClick ? onCardClick() : setShowDetails(true)}
          >
            {/* Top Right Wishlist Heart Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleWishlist(product);
              }}
              className="absolute top-2 right-2 z-20 w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-white/90 backdrop-blur-xs border border-gray-200/80 shadow-md flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-colors duration-200",
                  isWishlisted
                    ? "fill-[#A80000] text-[#A80000]"
                    : "text-gray-400 stroke-[1.8] hover:text-[#A80000]"
                )}
              />
            </button>

            {/* Selected Amount Badge if quantity > 0 */}
            {quantity > 0 && (
              <div className="absolute top-2 right-12 z-20">
                <span className="bg-[#A80000] text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-md">
                  ₹ {selectedAmount}
                </span>
              </div>
            )}

            {/* Image Area */}
            <div className="relative w-full aspect-square overflow-hidden bg-[#FDFBF7] p-3 border-b border-amber-100/70">
              <img
                src={isOutOfStock ? '/saiyogi-logo-1.png' : (product.image || 'https://via.placeholder.com/300?text=No+Image')}
                alt={product.name}
                className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-500 ease-out mix-blend-multiply"
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

              {/* Maintained Original DiscountTag component as requested */}
              {discount > 0 && !isNetRate && (
                <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 z-10 pointer-events-none">
                  <DiscountTag discount={discount} className="w-11 sm:w-13 h-auto" />
                </div>
              )}

              {isNetRate && (
                <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 animate-pulse tracking-wide">
                  NET RATE
                </span>
              )}

              {isOutOfStock ? (
                <span className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] z-10">
                  <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-2xl">Sold Out</span>
                </span>
              ) : stockVal < 20 && (
                <span className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 bg-amber-400 text-amber-950 text-xs sm:text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                  Only {stockVal} left
                </span>
              )}
            </div>

            {/* Left Aligned Content Details Section */}
            <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between w-full text-left items-start">
              <div className="w-full text-left">
                {/* Brand + Verified Pill Row */}
                <div className="flex items-center justify-between w-full mb-1 flex-wrap gap-1 text-left">
                  <span className="text-[10px] sm:text-xs font-black text-slate-500 tracking-wider uppercase truncate max-w-[140px]" title={product.brand || "BLUE STAR FIREWORKS"}>
                    {product.brand || "BLUE STAR FIREWORKS"}
                  </span>
                  <span className="inline-flex items-center gap-0.5 bg-[#E8F8F0] text-[#00B050] border border-[#00B050]/20 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-[#00B050] fill-[#00B050]/10" />
                    <span>Verified</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="product-title-font font-black text-sm sm:text-base text-gray-900 leading-snug line-clamp-2 text-left mb-1">
                  {product.name}
                  {product.quantity && (
                    <span className="ml-1 text-[10px] font-bold text-gray-500 font-sans">
                      ({product.quantity})
                    </span>
                  )}
                </h3>

                {/* Sai Yogi Verified Ribbon Pill (Matching Reference Image) */}
                <div className="my-1.5 text-left">
                  {product.isSaiYogiVerified !== false ? (
                    <div className="inline-flex items-center select-none shrink-0 shadow-xs rounded-md overflow-hidden border border-red-500/20">
                      <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-white font-black text-[10px] sm:text-[11px] px-2 py-0.5 italic flex items-center justify-center leading-none">
                        SY
                      </div>
                      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-white font-black text-[10px] sm:text-[11px] px-2.5 py-0.5 italic tracking-wide font-serif leading-none whitespace-nowrap flex items-center gap-1 justify-center">
                        <span>Sai Yogi Verified</span>
                        <CheckCircle2 className="w-3 h-3 text-white fill-white/20" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-[20px]" />
                  )}
                </div>

                {/* Rating Stars & Reviews Count */}
                <div className="flex items-center text-left my-1 gap-1">
                  <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const isFilled = i < Math.floor(starRating);
                      const isHalf = i === Math.floor(starRating) && starRating % 1 >= 0.3;
                      if (isFilled) {
                        return <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400 drop-shadow-2xs" />;
                      }
                      if (isHalf) {
                        return <StarHalf key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400 drop-shadow-2xs" />;
                      }
                      return <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-gray-200 text-gray-200" />;
                    })}
                  </div>
                  {reviewCount !== undefined && reviewCount !== null && (
                    <span className="text-xs text-gray-400 font-bold ml-1">({reviewCount})</span>
                  )}
                </div>

                {/* Price Display */}
                <div className="flex items-baseline text-left gap-2 mt-1 mb-1 flex-wrap">
                  <span className="font-display font-black text-[#A80000] text-xl sm:text-2xl leading-none">₹{discountPrice}</span>
                  {product.hasDiscount && !isNetRate && (
                    <span className="text-xs sm:text-sm text-gray-400 line-through font-semibold">₹{product.price}</span>
                  )}
                  {isNetRate && (
                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter">Fixed Price</span>
                  )}
                </div>

                {/* Discount Badge Pill (Matching Reference Image while maintaining current discount logic) */}
                {discount > 0 && !isNetRate && (
                  <div className="my-1.5 text-left">
                    <span className="bg-[#E6F4EA] text-[#137333] font-black text-xs px-2.5 py-1 rounded-md inline-block">
                      {discount}% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Add to Cart Button Row */}
              <div className="w-full pt-2 mt-auto" onClick={e => e.stopPropagation()}>
                {quantity > 0 ? (
                  <QuantitySelector />
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={cn(
                      "w-full h-10 sm:h-10.5 rounded-full flex items-center justify-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-150 transform select-none",
                      isOutOfStock
                        ? "bg-gray-200 text-gray-400 border-b-4 border-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-b from-[#E60000] via-[#C80000] to-[#990000] text-white border-b-4 border-[#660000] hover:border-[#550000] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_10px_rgba(168,0,0,0.35)] hover:brightness-110 active:border-b-0 active:translate-y-1 active:shadow-inner cursor-pointer"
                    )}
                  >
                    <ShoppingCart className="w-4 h-4 text-white drop-shadow-xs" />
                    <span>{isOutOfStock ? "Sold Out" : "ADD TO CART"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick View / Detail Modal */}
      {showDetails && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md overflow-y-auto p-4 flex items-center justify-center animate-in fade-in duration-300"
          onClick={handleCloseDetails}
        >
          <div
            className="relative bg-[#FDFBF7] max-w-lg md:max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-500 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseDetails}
              className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-2 hover:bg-white transition-colors shadow-lg"
            >
              <X className="h-5 w-5 text-red-900" />
            </button>

            <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-[#FDFBF7] p-4 md:p-8 flex items-center justify-center relative">
              <img
                src={isOutOfStock ? '/saiyogi-logo-1.png' : (product.image || 'https://via.placeholder.com/300?text=No+Image')}
                alt={product.name}
                className="w-full h-full object-contain max-h-[350px] md:max-h-[400px] mix-blend-multiply"
              />
            </div>

            <div className="p-6 md:p-8 flex-1 flex flex-col justify-center text-left">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs text-red-600 font-black uppercase tracking-widest">{product.brand || "BLUE STAR FIREWORKS"}</span>
                {(categoryName || product.category) && <span className="h-1 w-1 bg-red-200 rounded-full" />}
                <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">{categoryName || (typeof product.category === 'object' && product.category !== null ? (product.category as any).name : product.category)}</span>
                {product.isSaiYogiVerified && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                    <span>Sai Yogi Verified</span>
                  </span>
                )}
              </div>

              <h2 className="product-title-font text-2xl md:text-3xl font-black text-red-950 mb-1 leading-tight">{product.name}</h2>
              {product.quantity && (
                <div className="mb-3">
                  <span className="inline-block bg-red-50 text-[#A80000] border border-red-200/80 text-xs font-black px-2.5 py-0.5 rounded-md shadow-2xs">
                    {product.quantity}
                  </span>
                </div>
              )}

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
                <span className="text-2xl md:text-4xl font-black text-[#A80000]">₹{discountPrice}</span>
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
                <div className="flex items-center gap-3">
                  {quantity > 0 ? (
                    <div className="flex items-center gap-4 flex-1">
                      <QuantitySelector className="p-1 gap-4" />
                      <span className="text-sm font-bold text-red-600 whitespace-nowrap">Added to Cart</span>
                    </div>
                  ) : (
                    <Button
                      className={cn(
                        "flex-1 h-11 md:h-14 rounded-2xl text-base md:text-lg font-black uppercase tracking-wider transition-all duration-150 transform active:translate-y-1 select-none",
                        isOutOfStock
                          ? "bg-gray-200 text-gray-400 border-b-4 border-gray-300 cursor-not-allowed"
                          : "bg-gradient-to-b from-red-600 via-red-700 to-red-900 text-white border-b-4 border-red-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_15px_rgba(185,28,28,0.4)] hover:brightness-110 active:border-b-0 active:shadow-inner cursor-pointer"
                      )}
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                    >
                      {isOutOfStock ? (
                        <span className="flex items-center gap-1.5"><X className="h-5 w-5" /> Out of Stock</span>
                      ) : (
                        <span className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 drop-shadow-xs" /> Add to Cart</span>
                      )}
                    </Button>
                  )}

                  {/* Wishlist Button inside Modal */}
                  <Button
                    variant="outline"
                    className={cn(
                      "h-11 md:h-14 w-11 md:w-14 rounded-2xl p-0 flex items-center justify-center transition-colors",
                      isWishlisted ? "bg-red-50 border-red-300 text-red-600" : "border-gray-200 text-gray-500 hover:text-red-600"
                    )}
                    onClick={() => toggleWishlist(product)}
                    title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <Heart className={cn("h-6 w-6", isWishlisted && "fill-red-600 text-red-600")} />
                  </Button>
                </div>

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
