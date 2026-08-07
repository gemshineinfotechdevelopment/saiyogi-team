import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Product } from "@/data/products";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { setCookie, getCookie, deleteCookie } from "@/lib/cookieUtils";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "saiyogi_cart_items";
const CART_COOKIE_NAME = "saiyogi_cart";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userPhone } = useAuth();

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      // 1. Try reading from cookie
      const cookieCart = getCookie(CART_COOKIE_NAME);
      if (cookieCart) {
        const parsed = JSON.parse(cookieCart);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // 2. Try user-specific localStorage if user phone exists
      const phone = localStorage.getItem("user_phone");
      if (phone) {
        const savedUserCart = localStorage.getItem(`saiyogi_cart_${phone}`);
        if (savedUserCart) {
          const parsed = JSON.parse(savedUserCart);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
      // 3. Fallback to general localStorage
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const { settings } = useSiteSettings();
  const prevUserPhoneRef = useRef<string | null>(null);

  // Synchronize cart with cookie and localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      setCookie(CART_COOKIE_NAME, JSON.stringify(items), 7);
      if (userPhone) {
        localStorage.setItem(`saiyogi_cart_${userPhone}`, JSON.stringify(items));
      }
    } catch (err) {
      console.error("Failed to save cart items", err);
    }
  }, [items, userPhone]);

  // Restore & Merge User Cart on Mobile Login
  useEffect(() => {
    if (userPhone && userPhone !== prevUserPhoneRef.current) {
      prevUserPhoneRef.current = userPhone;
      try {
        const userSavedCartKey = `saiyogi_cart_${userPhone}`;
        const userSavedStr = localStorage.getItem(userSavedCartKey);
        if (userSavedStr) {
          const userSavedItems: CartItem[] = JSON.parse(userSavedStr);
          if (Array.isArray(userSavedItems) && userSavedItems.length > 0) {
            setItems((prevCurrent) => {
              if (prevCurrent.length === 0) return userSavedItems;
              const mergedMap = new Map<string, CartItem>();
              userSavedItems.forEach((item) => {
                const pId = String(item.product._id || item.product.id || '');
                mergedMap.set(pId, item);
              });
              prevCurrent.forEach((item) => {
                const pId = String(item.product._id || item.product.id || '');
                if (mergedMap.has(pId)) {
                  const existing = mergedMap.get(pId)!;
                  mergedMap.set(pId, { ...existing, quantity: Math.max(existing.quantity, item.quantity) });
                } else {
                  mergedMap.set(pId, item);
                }
              });
              return Array.from(mergedMap.values());
            });
          }
        }
      } catch (e) {
        console.error("Failed to restore user cart on login", e);
      }
    }
  }, [userPhone]);

  const getProductId = (product: Product) => String(product._id || product.id || '');

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    const productId = getProductId(product);
    setItems((prev) => {
      const existing = prev.find((i) => getProductId(i.product) === productId);
      if (existing) {
        return prev.map((i) =>
          getProductId(i.product) === productId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => getProductId(i.product) !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => getProductId(i.product) !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (getProductId(i.product) === productId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      deleteCookie(CART_COOKIE_NAME);
      if (userPhone) {
        localStorage.removeItem(`saiyogi_cart_${userPhone}`);
      }
    } catch (_) {}
  }, [userPhone]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => {
    const dp = getDiscountPrice(i.product.price, i.product.hasDiscount, settings.discountPercent, i.product.netRate, i.product.displayNetRate);
    return sum + dp * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
