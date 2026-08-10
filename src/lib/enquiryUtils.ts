import { getCookie, setCookie } from "@/lib/cookieUtils";

export interface EnquiryItem {
  id: string;
  enquiryNumber: string;
  date: string;
  total: number;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
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
  const cleanPhone = userPhone.replace(/\D/g, "");
  if (!cleanPhone) return [];

  const cookieKey = `saiyogi_enquiries_${cleanPhone}`;
  const localKey = `user_saved_enquiries_${cleanPhone}`;

  let items: EnquiryItem[] = [];

  // 1. Try cookie
  const cookieVal = getCookie(cookieKey);
  if (cookieVal) {
    try {
      const parsed = JSON.parse(cookieVal);
      if (Array.isArray(parsed) && parsed.length > 0) {
        items = parsed;
      }
    } catch (_) {}
  }

  // 2. Fallback to localStorage
  if (items.length === 0) {
    const localVal = localStorage.getItem(localKey);
    if (localVal) {
      try {
        const parsed = JSON.parse(localVal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          items = parsed;
        }
      } catch (_) {}
    }
  }

  // Keep cookie & localStorage synced
  if (items.length > 0) {
    try {
      localStorage.setItem(localKey, JSON.stringify(items));
      setCookie(cookieKey, JSON.stringify(items), 30);
    } catch (_) {}
  }

  return items;
}
