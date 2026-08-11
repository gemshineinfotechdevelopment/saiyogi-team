import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from "@/context/AuthContext";

export interface Settings {
  shopName: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  licenseNo: string;
  explosiveLicense: string;
  invoicePrefix: string;
  estimatePrefix: string;
  transportPrefix: string;
  gstRate: number;
  autoPrint: boolean;
  showGstBreakdown: boolean;
  tamilLanguage: boolean;
  requireTransportBill: boolean;
  trackGodown: boolean;
  logo?: string;
  website?: string;
  billing?: {
    companyName?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    gstNumber?: string;
    applyGst?: boolean;
  };
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const { token: authContextToken } = useAuth();

  const fetchSettings = async () => {
    const token = localStorage.getItem('admin_token') || authContextToken;
    if (!token) {
        setLoading(false);
        setSettings(null);
        return;
    }
    
    try {
      setLoading(true);
      const data = await apiRequest('/settings');
      setSettings(data);
    } catch (err) {
      console.error("Error fetching settings:", err);
      if (err instanceof Error && err.message.includes('401')) {
          setSettings(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    
    // Listen for storage changes (like login in other tabs)
    const handleStorage = (e: StorageEvent) => {
        if (e.key === 'admin_token' || e.key === 'admin_role') {
            fetchSettings();
        }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [authContextToken]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
