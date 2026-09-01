import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Product } from "@/data/products";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { setCookie, getCookie, deleteCookie } from "@/lib/cookieUtils";
import { toast } from "sonner";

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
  cartViewMode: "cart" | "whatsapp-verify" | "checkout";
  setCartViewMode: (mode: "cart" | "whatsapp-verify" | "checkout") => void;
  openCart: (mode?: "cart" | "whatsapp-verify" | "checkout") => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "saiyogi_cart_items";
const CART_COOKIE_NAME = "saiyogi_cart";

const getProductId = (product: any): string => {
  if (!product) return "";
  return String(product._id || product.id || "");
};

const sanitizeProductForStorage = (product: Product): Product => {
  const pId = getProductId(product);
  return {
    _id: pId,
    id: pId,
    name: product.name || "",
    price: Number(product.price || 0),
    originalPrice: product.originalPrice !== undefined ? Number(product.originalPrice) : Number(product.price || 0),
    hasDiscount: product.hasDiscount !== undefined ? Boolean(product.hasDiscount) : true,
    netRate: product.netRate !== undefined ? Number(product.netRate) : undefined,
    displayNetRate: product.displayNetRate !== undefined ? Boolean(product.displayNetRate) : undefined,
    image: product.image || "/saiyogi-logo-1.png",
    storeStockPieces: product.storeStockPieces !== undefined ? Number(product.storeStockPieces) : (product.stock !== undefined ? Number(product.stock) : 999),
    stock: product.stock !== undefined ? Number(product.stock) : 999,
    code: product.code || "",
    sku: product.sku || "",
    brand: product.brand || "Standard",
  } as Product;
};

const sanitizeCartItems = (rawItems: any[]): CartItem[] => {
  if (!Array.isArray(rawItems)) return [];
  const valid: CartItem[] = [];
  rawItems.forEach((item) => {
    if (item && item.product && typeof item.product === "object") {
      const pId = getProductId(item.product);
      if (pId && item.quantity > 0) {
        valid.push({
          product: sanitizeProductForStorage(item.product),
          quantity: Number(item.quantity || 1)
        });
      }
    }
  });
  return valid;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userPhone } = useAuth();
  const { settings } = useSiteSettings();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartViewMode, setCartViewMode] = useState<"cart" | "whatsapp-verify" | "checkout">("cart");
  const prevUserPhoneRef = useRef<string | null>(null);

  const openCart = useCallback((mode: "cart" | "whatsapp-verify" | "checkout" = "cart") => {
    setCartViewMode(mode);
    setIsCartOpen(true);
  }, []);

  // Initialize cart state by merging all available persistent sources
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const candidateCarts: CartItem[][] = [];

      // 1. User-specific localStorage
      const phone = localStorage.getItem("user_phone") || getCookie("saiyogi_user_phone");
      if (phone) {
        const cleanP = phone.replace(/\D/g, "").slice(-10);
        if (cleanP) {
          const userSavedStr = localStorage.getItem(`saiyogi_cart_${cleanP}`);
          if (userSavedStr) {
            const parsed = sanitizeCartItems(JSON.parse(userSavedStr));
            if (parsed.length > 0) candidateCarts.push(parsed);
          }
        }
      }

      // 2. General localStorage
      const generalStr = localStorage.getItem(CART_STORAGE_KEY);
      if (generalStr) {
        const parsed = sanitizeCartItems(JSON.parse(generalStr));
        if (parsed.length > 0) candidateCarts.push(parsed);
      }

      // 3. Cookie (supports minimal { id, qty } format and legacy full format)
      const cookieCart = getCookie(CART_COOKIE_NAME);
      if (cookieCart) {
        try {
          const parsedCookie = JSON.parse(cookieCart);
          if (Array.isArray(parsedCookie)) {
            // Check if it's already full format or minimal format
            const isFullFormat = parsedCookie.some((i: any) => i && i.product);
            if (isFullFormat) {
              const parsed = sanitizeCartItems(parsedCookie);
              if (parsed.length > 0) candidateCarts.push(parsed);
            }
          }
        } catch (_) {}
      }

      if (candidateCarts.length === 0) return [];

      // Reconcile and merge items across all candidate carts
      const mergedMap = new Map<string, CartItem>();
      candidateCarts.forEach((cart) => {
        cart.forEach((item) => {
          const pId = getProductId(item.product);
          if (!mergedMap.has(pId)) {
            mergedMap.set(pId, item);
          } else {
            const existing = mergedMap.get(pId)!;
            mergedMap.set(pId, { ...existing, quantity: Math.max(existing.quantity, item.quantity) });
          }
        });
      });

      return Array.from(mergedMap.values());
    } catch {
      return [];
    }
  });

  // Synchronize cart with cookie and localStorage whenever items change
  useEffect(() => {
    try {
      const sanitized = items.map((item) => ({
        product: sanitizeProductForStorage(item.product),
        quantity: item.quantity
      }));
      const jsonStr = JSON.stringify(sanitized);

      // Save full objects in localStorage for rich offline/instant restoration
      localStorage.setItem(CART_STORAGE_KEY, jsonStr);

      // Save compact minimal payload in cookie to prevent exceeding 4KB cookie limits
      const minimalCookieData = items.map((item) => ({
        id: getProductId(item.product),
        qty: item.quantity
      }));
      setCookie(CART_COOKIE_NAME, JSON.stringify(minimalCookieData), 30);

      const effectivePhone = userPhone || localStorage.getItem("user_phone") || getCookie("saiyogi_user_phone");
      if (effectivePhone) {
        const cleanP = effectivePhone.replace(/\D/g, "").slice(-10);
        if (cleanP) {
          localStorage.setItem(`saiyogi_cart_${cleanP}`, jsonStr);
        }
      }
    } catch (err) {
      console.error("Failed to save cart items", err);
    }
  }, [items, userPhone]);

  // Listen for storage changes across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          const remoteItems = sanitizeCartItems(JSON.parse(e.newValue));
          setItems(remoteItems);
        } catch (_) {}
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Restore & Merge User Cart on Mobile Login
  useEffect(() => {
    if (userPhone && userPhone !== prevUserPhoneRef.current) {
      prevUserPhoneRef.current = userPhone;
      try {
        const cleanP = userPhone.replace(/\D/g, "").slice(-10);
        const userSavedCartKey = `saiyogi_cart_${cleanP}`;
        const userSavedStr = localStorage.getItem(userSavedCartKey);
        if (userSavedStr) {
          const userSavedItems = sanitizeCartItems(JSON.parse(userSavedStr));
          if (userSavedItems.length > 0) {
            setItems((prevCurrent) => {
              if (prevCurrent.length === 0) return userSavedItems;
              const mergedMap = new Map<string, CartItem>();
              userSavedItems.forEach((item) => {
                const pId = getProductId(item.product);
                mergedMap.set(pId, item);
              });
              prevCurrent.forEach((item) => {
                const pId = getProductId(item.product);
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

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    const productId = getProductId(product);
    const stockAvailable = product.storeStockPieces !== undefined
      ? Number(product.storeStockPieces)
      : (product.stock !== undefined ? Number(product.stock) : 999);

    if (stockAvailable <= 0) {
      toast.error(`${product.name || "Product"} is out of stock!`);
      return;
    }

    const sanitizedProduct = sanitizeProductForStorage(product);
    setItems((prev) => {
      const existing = prev.find((i) => getProductId(i.product) === productId);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > stockAvailable) {
          return prev.map((i) =>
            getProductId(i.product) === productId ? { ...i, quantity: stockAvailable } : i
          );
        }
        return prev.map((i) =>
          getProductId(i.product) === productId ? { ...i, quantity: newQty } : i
        );
      }
      const initialQty = Math.min(quantity, stockAvailable);
      return [...prev, { product: sanitizedProduct, quantity: initialQty }];
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
      prev.map((i) => {
        if (getProductId(i.product) === productId) {
          const stockAvailable = i.product.storeStockPieces !== undefined
            ? Number(i.product.storeStockPieces)
            : (i.product.stock !== undefined ? Number(i.product.stock) : 999);
          if (quantity > stockAvailable) {
            return { ...i, quantity: stockAvailable };
          }
          return { ...i, quantity };
        }
        return i;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      deleteCookie(CART_COOKIE_NAME);
      const effectivePhone = userPhone || localStorage.getItem("user_phone") || getCookie("saiyogi_user_phone");
      if (effectivePhone) {
        const cleanP = effectivePhone.replace(/\D/g, "").slice(-10);
        if (cleanP) {
          localStorage.removeItem(`saiyogi_cart_${cleanP}`);
        }
      }
    } catch (_) {}
  }, [userPhone]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => {
    const dp = getDiscountPrice(i.product.price, i.product.hasDiscount, settings.discountPercent, i.product.netRate, i.product.displayNetRate);
    return sum + dp * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isCartOpen, setIsCartOpen, cartViewMode, setCartViewMode, openCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
