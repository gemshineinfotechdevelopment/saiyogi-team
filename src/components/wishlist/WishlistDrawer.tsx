import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetDescription } from "@/components/ui/sheet";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { Heart, ShoppingCart, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";

export const WishlistDrawer: React.FC = () => {
  const { wishlist, isWishlistOpen, setIsWishlistOpen, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <Sheet open={isWishlistOpen} onOpenChange={setIsWishlistOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-white">
        <SheetHeader className="p-4 border-b border-gray-100 bg-[#A80000] text-white flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-white text-white" />
            <SheetTitle className="text-lg font-black text-white">
              My Wishlist ({wishlist.length})
            </SheetTitle>
          </div>
          <SheetClose className="text-white hover:opacity-80 rounded-full p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </SheetClose>
        </SheetHeader>
        <SheetDescription className="sr-only">
          Your saved favorite products wishlist
        </SheetDescription>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {wishlist.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-[#A80000]">
                <Heart className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Your Wishlist is Empty</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Explore our crackers catalog and click the heart icon on any product to save it here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {wishlist.map((product) => {
                const pId = String(product._id || product.id || "");
                return (
                  <div key={pId} className="relative group border border-amber-100 rounded-2xl p-2 bg-[#FDFBF7] shadow-xs hover:shadow-md transition-shadow">
                    <ProductCard product={product} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {wishlist.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2">
            <Button
              className="w-full bg-[#A80000] hover:bg-red-800 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2"
              onClick={() => {
                wishlist.forEach((product) => addToCart(product, 1));
                setIsWishlistOpen(false);
              }}
            >
              <ShoppingCart className="w-4 h-4" />
              Add All Wishlist Items to Cart
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default WishlistDrawer;
