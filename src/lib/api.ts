import { Product, Category, Order } from "@/data/products";

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";

async function fetchJSON<T>(path: string, method: string = 'GET', body?: any): Promise<T> {
  const token = localStorage.getItem("admin_token");
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include'
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    // Try to parse error body for more context
    let errorBody: any = null;
    try {
      errorBody = await res.json();
    } catch (e) {
      try {
        errorBody = await res.text();
      } catch (e2) {
        errorBody = null;
      }
    }
    const message = errorBody && typeof errorBody === 'object' ? (errorBody.message || JSON.stringify(errorBody)) : (errorBody || res.statusText);
    throw new Error(`API error ${res.status}: ${message}`);
  }
  return res.json();
}

export async function getProducts(): Promise<Product[]> {
  try {
    const data = await fetchJSON<{ products: Product[] } | Product[]>('/api/products?limit=10000');
    return Array.isArray(data) ? data : (data?.products || []);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product> {
  return fetchJSON<Product>(`/api/products/${id}`);
}

export async function getCategories(): Promise<Category[]> {
  try {
    const data = await fetchJSON<{ categories: Category[] } | Category[]>('/api/categories');
    return Array.isArray(data) ? data : (data?.categories || []);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export async function getOrders(): Promise<Order[]> {
  try {
    const data = await fetchJSON<{ orders: Order[] } | Order[]>('/api/orders');
    return Array.isArray(data) ? data : (data?.orders || []);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
}

export async function createOrder(orderData: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  alternatePhoneNumber?: string;
  deliveryAddress: string;
  state: string;
  district: string;
  items: Array<{ product: string; quantity: number; price: number; productName?: string }>;
  paymentMethod: string;
  shippingAddress: any;
}): Promise<any> {
  try {
    const response = await fetchJSON<{ order: Order; message?: string }>('/api/orders', 'POST', orderData);
    return { order: response.order || response, message: response.message };
  } catch (error) {
    console.error('Failed to create order:', error);
    throw error;
  }
}

export async function approveOrder(orderId: string): Promise<any> {
  try {
    const response = await fetchJSON<{ order: Order }>(`/api/orders/${orderId}/approve`, 'PUT', {});
    return response.order || response;
  } catch (error) {
    console.error('Failed to approve order:', error);
    throw error;
  }
}

export async function updatePackingStatus(orderId: string, packingStatus: 'packed' | 'unpacked'): Promise<any> {
  try {
    const response = await fetchJSON<{ order: Order }>(`/api/orders/${orderId}/packing-status`, 'PUT', { packingStatus });
    return response.order || response;
  } catch (error) {
    console.error('Failed to update packing status:', error);
    throw error;
  }
}

export async function updateHoldDays(orderId: string, holdDays: number): Promise<any> {
  try {
    const response = await fetchJSON<{ order: any }>(`/api/orders/${orderId}/hold-days`, 'PUT', { holdDays });
    return response.order || response;
  } catch (error) {
    console.error('Failed to update hold days:', error);
    throw error;
  }
}

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
  socialLinks: {
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
}

export async function getSettings(): Promise<SiteSettings> {
  try {
    return await fetchJSON<SiteSettings>('/api/settings');
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return {} as SiteSettings;
  }
}

export async function updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  try {
    const response = await fetchJSON<{ settings: SiteSettings }>('/api/settings', 'PUT', settings);
    return response.settings || settings as SiteSettings;
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
}

export async function getSiteInfo(): Promise<SiteSettings> {
  try {
    return await fetchJSON<SiteSettings>('/api/settings/public/info');
  } catch (error) {
    console.error('Failed to fetch site info:', error);
    return {} as SiteSettings;
  }
}

export const apiRequest = async (path: string, options: any = {}) => {
  const token = localStorage.getItem('admin_token');

  const headers: Record<string, string> = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let mappedPath = path;
  if (mappedPath.startsWith('/estimates')) {
    mappedPath = mappedPath.replace('/estimates', '/api/bills');
  }
  if (mappedPath.includes('/next-bill-no')) {
    mappedPath = mappedPath.replace('/next-bill-no', '/next-no');
  }
  if (mappedPath.startsWith('/reports')) {
    mappedPath = mappedPath.replace('/reports', '/api/reports');
  }
  if (!mappedPath.startsWith('http') && !mappedPath.startsWith('/api')) {
    mappedPath = `/api${mappedPath}`;
  }

  // Map frontend `type` to backend `billType` for /api/bills endpoints
  if (mappedPath.startsWith('/api/bills')) {
    // Map query parameters
    if (mappedPath.includes('type=')) {
       mappedPath = mappedPath.replace(/([?&])type=([^&]+)/g, (match, p1, p2) => {
         let uppercaseType = p2.toUpperCase();
         if (uppercaseType === 'NET-RATE') uppercaseType = 'NETRATE';
         return `${p1}type=${p2}&billType=${uppercaseType}`;
       });
    }
    
    // Map JSON body
    if (options.body && typeof options.body === 'string') {
      try {
        const parsedBody = JSON.parse(options.body);
        if (parsedBody && typeof parsedBody === 'object') {
          if (parsedBody.type && !parsedBody.billType) {
             parsedBody.billType = parsedBody.type.toUpperCase();
          }
          if (parsedBody.billType) {
             parsedBody.billType = parsedBody.billType.toUpperCase();
             if (parsedBody.billType === 'NET-RATE') parsedBody.billType = 'NETRATE';
          }
          options.body = JSON.stringify(parsedBody);
        }
      } catch(e) {
        // Not a JSON string, ignore
      }
    }
  }

  const url = `${API_BASE_URL}${mappedPath}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    let errorMessage = 'API Request failed';
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || JSON.stringify(errorBody);
    } catch(e) {
      try {
        errorMessage = await response.text() || errorMessage;
      } catch(e2) {}
    }
    throw new Error(errorMessage);
  }

  return response.json();
};
