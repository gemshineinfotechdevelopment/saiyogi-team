import { getCookie, setCookie } from "@/lib/cookieUtils";

export interface EnquiryItem {
  id: string;
  enquiryNumber: string;
  date: string;
  total: number;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled" | "Shipped" | "Approved" | (string & {});
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

export const formatAddress = (addr: any): string => {
  if (!addr) return "Sivakasi, Tamil Nadu";
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    if (addr.fullAddress && typeof addr.fullAddress === "string") return addr.fullAddress;
    const parts = [addr.street, addr.district, addr.state, addr.pincode].filter(p => p && typeof p === "string");
    if (parts.length > 0) return parts.join(", ");
  }
  return String(addr);
};

export const formatString = (val: any, fallback: string = ""): string => {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "object") return val.name || val.fullAddress || val.phone || fallback;
  return String(val);
};

export function loadUserEnquiries(userPhone: string | null): EnquiryItem[] {
  if (!userPhone) return [];
  const cleanPhone = String(userPhone).replace(/\D/g, "").slice(-10);
  if (!cleanPhone || cleanPhone.length !== 10) return [];

  let items: EnquiryItem[] = [];

  const cookieKey = `saiyogi_enquiries_${cleanPhone}`;
  const localKey = `user_saved_enquiries_${cleanPhone}`;

  // 1. Try phone-specific cookie
  const cookieVal = getCookie(cookieKey);
  if (cookieVal) {
    try {
      const parsed = JSON.parse(cookieVal);
      if (Array.isArray(parsed) && parsed.length > 0) {
        items = parsed;
      }
    } catch (_) {}
  }

  // 2. Fallback to phone-specific localStorage (10-digit and 91+10-digit)
  if (items.length === 0) {
    const keysToTry = [
      localKey,
      `user_saved_enquiries_91${cleanPhone}`,
      `saiyogi_enquiries_91${cleanPhone}`
    ];

    for (const key of keysToTry) {
      const val = localStorage.getItem(key) || getCookie(key);
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) {
            items = parsed;
            break;
          }
        } catch (_) {}
      }
    }
  }

  // 3. Scan localStorage for any key ending with cleanPhone if still empty
  if (items.length === 0 && typeof window !== "undefined" && window.localStorage) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("user_saved_enquiries_") || k.startsWith("saiyogi_enquiries_"))) {
          if (k.endsWith(cleanPhone)) {
            const val = localStorage.getItem(k);
            if (val) {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed) && parsed.length > 0) {
                items = parsed;
                break;
              }
            }
          }
        }
      }
    } catch (_) {}
  }

  // Double check that loaded items belong strictly to cleanPhone
  items = items.filter(item => {
    const itemPhone = String(item.customerPhone || "").replace(/\D/g, "").slice(-10);
    return !itemPhone || itemPhone === cleanPhone;
  });

  // Save phone-specific items back to 10-digit key to sync
  if (items.length > 0) {
    try {
      localStorage.setItem(`user_saved_enquiries_${cleanPhone}`, JSON.stringify(items));
      setCookie(`saiyogi_enquiries_${cleanPhone}`, JSON.stringify(items), 365);
    } catch (_) {}
  }

  return items;
}
