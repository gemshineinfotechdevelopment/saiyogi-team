import { ShoppingCart, X, Plus, Minus } from "lucide-react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const ProductCard = ({ product, categoryName }: { product: Product; categoryName?: string }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { items, addToCart, updateQuantity } = useCart();
  const { settings } = useSiteSettings();

  const productId = String(product._id || product.id || '');
  const cartItem = useMemo(() => items.find(i => String(i.product._id || i.product.id) === productId), [items, productId]);
  const quantity = cartItem?.quantity || 0;

  const discountPrice = getDiscountPrice(product.price, product.hasDiscount, settings.discountPercent, product.netRate, product.displayNetRate);
  const isNetRate = !!product.netRate && product.netRate > 0 && !!product.displayNetRate;
  const discount = (product.hasDiscount && !isNetRate) ? settings.discountPercent : 0;

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
    if (quantity >= (product.storeStockPieces || 0)) {
      toast.error("Not enough stock available");
      return;
    }
    updateQuantity(productId!, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(productId!, quantity - 1);
  };

  const QuantitySelector = ({ className }: { className?: string }) => (
    <div className={cn("flex items-center gap-0.5 sm:gap-1 bg-red-50 rounded-full border border-red-200 p-0.5", className)} onClick={e => e.stopPropagation()}>
      <button
        onClick={handleDecrement}
        className="h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-white text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
      >
        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
      </button>
      <span className="w-6 sm:w-8 text-center font-bold text-red-900 text-xs sm:text-sm">{quantity}</span>
      <button
        onClick={handleIncrement}
        className="h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-all shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
        disabled={quantity >= ((product.storeStockPieces || 0) || 999)}
      >
        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
      </button>
    </div>
  );

  return (
    <>
      <div className="group h-full">
        <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-gray-300 transition-all duration-500 hover:shadow-lg flex flex-col h-full relative">
          <div
            className="relative aspect-square overflow-hidden bg-white cursor-pointer p-2 sm:p-4 border-b border-gray-50"
            onClick={() => setShowDetails(true)}
          >
            <img
              src={(product.storeStockPieces || 0) <= 0 ? '/1.png' : (product.image || 'https://via.placeholder.com/300?text=No+Image')}
              alt={product.name}
              className="w-full h-full object-contain p-1 sm:p-2 group-hover:scale-110 transition-transform duration-700 ease-out"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
              }}
            />
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <span className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-primary text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-sm z-10 uppercase tracking-wider">
              HOT
            </span>

            {discount > 0 && !isNetRate && (
              <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-yellow-400 text-yellow-950 text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-sm z-10">
                {discount}% OFF
              </span>
            )}

            {isNetRate && (
              <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-indigo-600 text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-lg z-10 animate-pulse">
                NET RATE
              </span>
            )}

            {(product.storeStockPieces || 0) <= 0 ? (
              <span className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] z-10">
                <span className="bg-gray-900 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-2xl">Sold Out</span>
              </span>
            ) : (product.storeStockPieces || 0) < 20 && (
              <span className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-amber-400 text-amber-950 text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                Only {product.storeStockPieces} left
              </span>
            )}
          </div>

          <div className="p-3 sm:p-4 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-0.5 sm:mb-1">
              <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider">{product.brand || "Standard"}</p>
            </div>

            <h3 className="font-display font-bold text-xs sm:text-base text-secondary leading-tight mb-1 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] group-hover:text-primary transition-colors">{product.name}</h3>
            <p className="text-[9px] sm:text-[10px] text-gray-400 mb-2 sm:mb-3">1 Piece / Box</p>

            <div className="mt-auto pt-2 sm:pt-4 flex flex-col justify-between gap-2 sm:gap-3 border-t border-gray-100">
              <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                <span className="font-display font-black text-secondary text-sm sm:text-lg leading-none">₹{discountPrice}</span>
                {product.hasDiscount && !isNetRate && (
                  <span className="text-[8px] sm:text-[10px] text-gray-400 line-through">₹{product.price}</span>
                )}
                {isNetRate && (
                  <span className="text-[8px] sm:text-[10px] text-indigo-500 font-bold uppercase tracking-tighter ml-auto">Fixed Price</span>
                )}
              </div>

              <div className="flex justify-center w-full">
                {quantity > 0 ? (
                  <QuantitySelector className="w-full justify-between px-1.5 py-0.5" />
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={(product.storeStockPieces || 0) <= 0}
                    className={cn(
                      "h-8 sm:h-10 w-full flex items-center justify-center rounded-lg transition-all shadow-sm active:scale-95 group/btn",
                      (product.storeStockPieces || 0) <= 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-secondary text-white hover:bg-secondary/90 hover:shadow-md"
                    )}
                  >
                    <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="ml-1 sm:ml-2 font-bold text-xs sm:text-sm">Add to Cart</span>
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

            <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-white p-4 md:p-8 flex items-center justify-center">
              <img
                src={(product.storeStockPieces || 0) <= 0 ? '/1.png' : (product.image || 'https://via.placeholder.com/300?text=No+Image')}
                alt={product.name}
                className="w-full h-full object-contain max-h-[350px] md:max-h-[400px]"
              />
            </div>

            <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-red-600 font-black uppercase tracking-widest">{product.brand}</span>
                {(categoryName || product.category) && <span className="h-1 w-1 bg-red-200 rounded-full" />}
                <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">{categoryName || (typeof product.category === 'object' && product.category !== null ? (product.category as any).name : product.category)}</span>
              </div>

              <h2 className="font-display text-xl md:text-3xl font-black text-red-950 mb-4 md:mb-6 leading-tight">{product.name}</h2>

              <div className="flex items-baseline gap-2 md:gap-3 mb-4 md:mb-8">
                <span className="text-2xl md:text-4xl font-black text-red-700">₹{discountPrice}</span>
                {product.hasDiscount && !isNetRate && (
                  <span className="text-base md:text-xl text-gray-300 line-through font-medium">₹{product.price}</span>
                )}
                {isNetRate && (
                  <span className="text-xs md:text-sm text-indigo-500 font-black uppercase tracking-widest px-2.5 py-0.5 bg-indigo-50 rounded-lg border border-indigo-100">Net Rate Only</span>
                )}
              </div>

              <div className="space-y-4">
                {quantity > 0 ? (
                  <div className="flex items-center gap-4">
                    <QuantitySelector className="p-1 gap-4" />
                    <span className="text-sm font-bold text-red-600">Added to Cart</span>
                  </div>
                ) : (
                  <Button
                    className={cn(
                      "w-full h-11 md:h-14 rounded-xl md:rounded-2xl text-base md:text-lg font-black shadow-2xl transition-all",
                      (product.storeStockPieces || 0) <= 0
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02] active:scale-95 shadow-red-200"
                    )}
                    onClick={handleAddToCart}
                    disabled={(product.storeStockPieces || 0) <= 0}
                  >
                    {(product.storeStockPieces || 0) <= 0 ? (
                      <span className="flex items-center gap-1.5"><X className="h-4 w-4" /> Out of Stock</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><Plus className="h-5 w-5" /> Add to Cart</span>
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

