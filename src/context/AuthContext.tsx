import React, { createContext, useContext, useState, useEffect } from "react";
import { setCookie, getCookie, deleteCookie } from "@/lib/cookieUtils";
import { toast } from "sonner";
import { trackCustomerAction, customerPhoneLoginAPI } from "@/lib/api";

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE_NAME = "saiyogi_user_session";

interface SessionInfo {
  phone: string;
  loginTime: number;
  lastActiveTime: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  loading: boolean;
  userPhone: string | null;
  userName: string | null;
  isUserLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string, name?: string) => Promise<void>;
  logout: () => void;
  logoutUser: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Customer User Phone & Name Login
  const [userPhone, setUserPhone] = useState<string | null>(() => getCookie("saiyogi_user_phone") || localStorage.getItem("user_phone"));
  const [userName, setUserName] = useState<string | null>(() => getCookie("saiyogi_user_name") || localStorage.getItem("user_name"));
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("admin_token");
      const storedRole = localStorage.getItem("admin_role");
      const storedPhone = getCookie("saiyogi_user_phone") || localStorage.getItem("user_phone");
      const storedName = getCookie("saiyogi_user_name") || localStorage.getItem("user_name");

      if (storedPhone) {
        setUserPhone(storedPhone);
        setUserName(storedName || null);
        setCookie("saiyogi_user_phone", storedPhone, 30);
        localStorage.setItem("user_phone", storedPhone);
        if (storedName) {
          setCookie("saiyogi_user_name", storedName, 30);
          localStorage.setItem("user_name", storedName);
        }
      }

      if (storedToken) {
        const rawBase = isLocalhost ? "http://localhost:5005" : ((import.meta.env.VITE_API_URL as string) || "");
        const primaryBase = rawBase.trim().replace(/\/+$/, "");
        const verifyUrl = `${primaryBase}/api/auth/verify`;

        try {
          const res = await fetch(verifyUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${storedToken}`
            }
          });

          if (res.ok) {
            const data = await res.json();
            if (data.valid && data.user) {
              setToken(storedToken);
              setIsAdmin(true);
              setIsAuthenticated(true);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn("Failed to verify admin token with backend:", err);
        }

        // If verification failed or returned non-200, invalidate the admin session
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_role");
        setIsAdmin(false);
        setToken(localStorage.getItem("customer_token") || null);
        setIsAuthenticated(!!storedPhone);
      } else {
        setIsAdmin(false);
        setToken(localStorage.getItem("customer_token") || null);
        setIsAuthenticated(!!storedPhone);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginWithPhone = async (phone: string, name?: string) => {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    setUserPhone(cleanPhone);
    localStorage.setItem("user_phone", cleanPhone);
    setCookie("saiyogi_user_phone", cleanPhone, 365);
    setCookie(SESSION_COOKIE_NAME, cleanPhone, 365);

    let cleanName: string | undefined = undefined;
    if (name && name.trim()) {
      cleanName = name.trim();
      setUserName(cleanName);
      localStorage.setItem("user_name", cleanName);
      setCookie("saiyogi_user_name", cleanName, 365);
    } else {
      const existingName = userName || localStorage.getItem("user_name") || getCookie("saiyogi_user_name");
      if (existingName && existingName !== "Customer") {
        cleanName = existingName;
        setUserName(existingName);
      } else {
        setUserName(null);
        localStorage.removeItem("user_name");
      }
    }
    setIsAuthenticated(true);

    try {
      const authRes = await customerPhoneLoginAPI(cleanPhone, cleanName);
      if (authRes && authRes.token) {
        setToken(authRes.token);
        localStorage.setItem("customer_token", authRes.token);
        if (authRes.user?.id) {
          localStorage.setItem("customer_id", authRes.user.id);
        }
      }
    } catch (err) {
      console.warn("Backend customer auth sync failed:", err);
    }

    trackCustomerAction({
      phone: cleanPhone,
      name: cleanName,
      source: "normal_login"
    }).catch((err) => console.warn("Failed to track login action:", err));
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const logoutUser = () => {
    setUserPhone(null);
    setUserName(null);
    if (!isAdmin) {
      setToken(null);
      localStorage.removeItem("customer_token");
      setIsAuthenticated(false);
    }
    deleteCookie("saiyogi_user_phone");
    deleteCookie("saiyogi_user_name");
    deleteCookie(SESSION_COOKIE_NAME);
    localStorage.removeItem("user_phone");
    localStorage.removeItem("user_name");
    localStorage.removeItem("customer_id");
    localStorage.removeItem("customer_token");
  };

  const login = async (email: string, password: string) => {
    const rawBase = isLocalhost ? "http://localhost:5005" : ((import.meta.env.VITE_API_URL as string) || "");
    const primaryBase = rawBase.trim().replace(/\/+$/, "");
    const urlsToTry = isLocalhost
      ? [
          "http://localhost:5005/api/auth/login",
          "http://127.0.0.1:5005/api/auth/login",
          `${primaryBase}/api/auth/login`,
        ].filter((v, i, a) => a.indexOf(v) === i && v.trim() !== "")
      : [`${primaryBase}/api/auth/login`].filter((v) => v.trim() !== "");

    let data: any = null;
    let lastError: any = null;

    for (const url of urlsToTry) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error?.message || error.message || "Invalid credentials");
        }

        data = await response.json();
        break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!data) {
      throw lastError || new Error("Login failed. Unable to connect to server.");
    }

    // Allow SUPER ADMIN and ADMIN roles
    const allowedRoles = ["admin", "SUPER ADMIN", "ADMIN"];
    if (data.user?.role && !allowedRoles.includes(data.user?.role)) {
      throw new Error("Only admin users can access this section");
    }

    setToken(data.token);
    setIsAdmin(true);
    setIsAuthenticated(true);

    localStorage.setItem("admin_token", data.token);
    if (data.user?.role) {
      localStorage.setItem("admin_role", data.user.role);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setToken(null);
    setUserPhone(null);
    setUserName(null);
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("user_phone");
    localStorage.removeItem("user_name");
  };

  const isUserLoggedIn = !!userPhone;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        token,
        loading,
        userPhone,
        userName,
        isUserLoggedIn,
        login,
        loginWithPhone,
        logout,
        logoutUser,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
