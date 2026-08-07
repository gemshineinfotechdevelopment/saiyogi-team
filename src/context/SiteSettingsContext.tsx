import React, { createContext, useContext, useState, useEffect } from "react";
import { getSiteInfo } from "@/lib/api";

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  discountPercent: number;
  minimumPurchaseAmount: number;
  minPurchaseOutsideTN: number;
  freeDeliveryThreshold: number;
  deliveryCharge: number;
  currency: string;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  features?: {
    enableReviews?: boolean;
    enableWishlist?: boolean;
    enableGuestCheckout?: boolean;
    enableNotifications?: boolean;
  };
  news?: string;
  billing?: {
    companyName?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    gstNumber?: string;
    applyGst?: boolean;
  };
  enablePackingCharge?: boolean;
  youtubeVideos?: { title: string; url: string }[];
}

interface SiteSettingsContextType {
  settings: SiteSettings;
  updateSettings: (settings: SiteSettings) => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: SiteSettings = {
  siteName: "Narendiraa Enterprises",
  siteDescription: "Premium crackers and fireworks store",
  discountPercent: 10,
  minimumPurchaseAmount: 500,
  minPurchaseOutsideTN: 1000,
  freeDeliveryThreshold: 999,
  deliveryCharge: 99,
  currency: "₹",
  contact: {
    email: "contact@narendiraa-enterprises.com",
    phone: "+91 95859 75756",
    address: "Sattur, Virudhunagar District, Tamil Nadu",
  },
  socialLinks: {
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: "",
  },
  features: {
    enableReviews: true,
    enableWishlist: true,
    enableGuestCheckout: true,
    enableNotifications: true,
  },
  news: "Welcome to Narendiraa Enterprises! Get the best deals on festival crackers here.",
  billing: {
    companyName: "",
    phone: "",
    email: "",
    whatsapp: "",
    gstNumber: "",
    applyGst: false
  },
  enablePackingCharge: true,
  youtubeVideos: [],
};

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings on mount and set up polling
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const siteInfo = await getSiteInfo() as SiteSettings;
        if (siteInfo && Object.keys(siteInfo).length > 0) {
          setSettings((prev) => ({
            ...prev,
            siteName: siteInfo.siteName || prev.siteName,
            contact: siteInfo.contact || prev.contact,
            currency: siteInfo.currency || prev.currency,
            discountPercent: siteInfo.discountPercent !== undefined ? siteInfo.discountPercent : prev.discountPercent,
            minimumPurchaseAmount: siteInfo.minimumPurchaseAmount !== undefined ? siteInfo.minimumPurchaseAmount : prev.minimumPurchaseAmount,
            minPurchaseOutsideTN: siteInfo.minPurchaseOutsideTN !== undefined ? siteInfo.minPurchaseOutsideTN : prev.minPurchaseOutsideTN,
            freeDeliveryThreshold: siteInfo.freeDeliveryThreshold !== undefined ? siteInfo.freeDeliveryThreshold : prev.freeDeliveryThreshold,
            deliveryCharge: siteInfo.deliveryCharge !== undefined ? siteInfo.deliveryCharge : prev.deliveryCharge,
            maintenanceMode: siteInfo.maintenanceMode !== undefined ? siteInfo.maintenanceMode : prev.maintenanceMode,
            maintenanceMessage: siteInfo.maintenanceMessage !== undefined ? siteInfo.maintenanceMessage : prev.maintenanceMessage,
            news: siteInfo.news !== undefined ? siteInfo.news : prev.news,
            billing: siteInfo.billing !== undefined ? siteInfo.billing : prev.billing,
            enablePackingCharge: siteInfo.enablePackingCharge !== undefined ? siteInfo.enablePackingCharge : prev.enablePackingCharge,
            youtubeVideos: siteInfo.youtubeVideos !== undefined ? siteInfo.youtubeVideos : prev.youtubeVideos,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();

    // Poll for settings changes every 30 seconds
    const pollInterval = setInterval(fetchSettings, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  const updateSettings = async (newSettings: SiteSettings) => {
    try {
      setSettings(newSettings);
      // The actual API call will be made from AdminContent
    } catch (error) {
      console.error("Failed to update settings:", error);
      setSettings(settings);
      throw error;
    }
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  return context;
};

export const getDiscountPrice = (price: number, hasDiscount: boolean, discountPercent: number, netRate?: number, displayNetRate?: boolean): number => {
  if (displayNetRate && netRate && netRate > 0) return netRate;
  if (!hasDiscount) return price;
  return Math.round(price * (1 - discountPercent / 100));
};
