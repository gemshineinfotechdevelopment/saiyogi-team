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
  const effectivePhone = userPhone || getCookie("saiyogi_user_phone") || getCookie("saiyogi_last_phone") || localStorage.getItem("user_phone") || localStorage.getItem("saiyogi_last_phone");
  const cleanPhone = effectivePhone ? effectivePhone.replace(/\D/g, "") : "";

  let items: EnquiryItem[] = [];

  if (cleanPhone) {
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

    // 2. Fallback to phone-specific localStorage
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
  }

  // 3. Master fallback cookie for browser (preserves enquiries even if logged out)
  if (items.length === 0) {
    const masterVal = getCookie("saiyogi_all_enquiries") || localStorage.getItem("saiyogi_all_enquiries");
    if (masterVal) {
      try {
        const parsedMaster = JSON.parse(masterVal);
        if (Array.isArray(parsedMaster) && parsedMaster.length > 0) {
          items = parsedMaster;
        }
      } catch (_) {}
    }
  }

  // Keep cookies & localStorage permanently synced (365 days)
  if (items.length > 0 && cleanPhone) {
    try {
      localStorage.setItem(`user_saved_enquiries_${cleanPhone}`, JSON.stringify(items));
      localStorage.setItem("saiyogi_all_enquiries", JSON.stringify(items));
      setCookie(`saiyogi_enquiries_${cleanPhone}`, JSON.stringify(items), 365);
      setCookie("saiyogi_all_enquiries", JSON.stringify(items), 365);
    } catch (_) {}
  }

  return items;
}
