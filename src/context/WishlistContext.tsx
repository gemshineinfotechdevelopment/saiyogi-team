import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/data/products";
import { toast } from "sonner";

interface WishlistContextType {
  wishlist: Product[];
  wishlistIds: string[];
  isInWishlist: (productId: string | number) => boolean;
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string | number) => void;
  wishlistCount: number;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = "saiyogi_wishlist_items";

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load wishlist from localStorage", e);
      return [];
    }
  });

  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.error("Failed to save wishlist to localStorage", e);
    }
  }, [wishlist]);

  const wishlistIds = wishlist.map((item) => String(item._id || item.id || ""));

  const isInWishlist = (productId: string | number) => {
    const pId = String(productId);
    return wishlistIds.includes(pId);
  };

  const toggleWishlist = (product: Product) => {
    const pId = String(product._id || product.id || "");
    if (!pId) return;

    if (isInWishlist(pId)) {
      setWishlist((prev) => prev.filter((item) => String(item._id || item.id || "") !== pId));
      toast.info(`${product.name} removed from Wishlist`);
    } else {
      setWishlist((prev) => [...prev, product]);
      toast.success(`${product.name} added to Wishlist! ❤️`);
    }
  };

  const removeFromWishlist = (productId: string | number) => {
    const pId = String(productId);
    setWishlist((prev) => prev.filter((item) => String(item._id || item.id || "") !== pId));
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistIds,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        wishlistCount: wishlist.length,
        isWishlistOpen,
        setIsWishlistOpen,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
