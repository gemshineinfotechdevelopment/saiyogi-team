import React, { createContext, useContext, useState, useEffect } from "react";

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("admin_token");
    const storedRole = localStorage.getItem("admin_role");

    if (storedToken && ["admin", "SUPER ADMIN", "ADMIN"].includes(storedRole || "")) {
      setToken(storedToken);
      setIsAdmin(true);
      setIsAuthenticated(true);
    } else {
      setToken(null);
      setIsAdmin(false);
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const API_BASE =
        (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";

      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      const allowedRoles = ["admin", "SUPER ADMIN", "ADMIN"];
      if (!allowedRoles.includes(data.user?.role)) {
        throw new Error("Only admin users can access this section");
      }

      setToken(data.token);
      setIsAdmin(true);
      setIsAuthenticated(true);

      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_role", data.user.role);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setToken(null);
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, token, loading, login, logout }}>
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
