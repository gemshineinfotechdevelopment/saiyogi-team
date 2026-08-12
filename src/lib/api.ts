import { Product, Category, Order } from "@/data/products";

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const rawEnvUrl = (import.meta.env.VITE_API_URL as string) || "";
export const API_BASE_URL = isLocalhost
  ? "http://localhost:5000" 
  : rawEnvUrl.trim().replace(/\/+$/, "");

function resolveAuthToken(path: string): string | null {
  const adminToken = localStorage.getItem("admin_token");
  const customerToken = localStorage.getItem("customer_token");

  const cleanPath = path.toLowerCase();
  const isCustomerRoute = cleanPath.includes('/my-enquiries') || cleanPath.includes('/my-orders') || cleanPath.includes('/customer');
  const isAdminOnlyRoute = cleanPath === '/api/orders' || cleanPath.startsWith('/api/orders/') || cleanPath === '/orders' || cleanPath === '/api/settings' || cleanPath.startsWith('/api/settings/') || cleanPath === '/settings' || cleanPath.includes('/admin/');

  if (isCustomerRoute) {
    return customerToken || adminToken;
  }
  if (isAdminOnlyRoute) {
    return adminToken; // Never send customer token to admin routes
  }
  return adminToken || customerToken;
}

async function fetchJSON<T>(path: string, method: string = 'GET', body?: any): Promise<T> {
  const token = resolveAuthToken(path);
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include',
    cache: 'no-store'
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const urlsToTry = path.startsWith('http')
    ? [path]
    : isLocalhost
      ? [
          `http://127.0.0.1:5000${cleanPath}`,
          `http://localhost:5000${cleanPath}`,
          `${API_BASE_URL}${cleanPath}`,
        ].filter((v, i, a) => a.indexOf(v) === i && !!v)
      : [`${API_BASE_URL}${cleanPath}`];

  let res: Response | null = null;
  let lastError: any = null;

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type') || '';
      // If server returned 200 OK HTML (SPA fallback), skip and try next API URL
      if (response.ok && contentType.includes('text/html') && isLocalhost) {
        lastError = new Error(`HTML response received for ${url}`);
        continue;
      }
      res = response;
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!res) {
    throw new Error(lastError?.message || "Failed to connect to backend server");
  }

  if (!res.ok) {
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
    const message = errorBody && typeof errorBody === 'object' ? (errorBody.error?.message || errorBody.message || JSON.stringify(errorBody)) : (errorBody || res.statusText);
    throw new Error(`API error ${res.status}: ${message}`);
  }
  return res.json();
}

export const FALLBACK_CATEGORIES: Category[] = [
  { id: "cat-1", _id: "cat-1", name: "Sparklers", productCount: 8, image: "/sky_rocket_box.png" },
  { id: "cat-2", _id: "cat-2", name: "Flower Pots", productCount: 6, image: "/flower_pots.png" },
  { id: "cat-3", _id: "cat-3", name: "Rockets & Sky Shots", productCount: 6, image: "/sky_rocket_box.png" },
  { id: "cat-4", _id: "cat-4", name: "Ground Chakkars", productCount: 6, image: "/flower_pots.png" },
  { id: "cat-5", _id: "cat-5", name: "Combo Packs", productCount: 4, image: "/family_star_kit.png" },
];

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    _id: "prod-1",
    name: "Whistling Birds",
    brand: "Standard",
    category: "Rockets & Sky Shots",
    price: 320,
    hasDiscount: true,
    image: "/sky_rocket_box.png",
    stock: 100,
    storeStockPieces: 100,
    rating: 4.8,
    reviews: 24,
    description: "High whistling aerial rocket box with vibrant color bursts.",
    quantity: "1 Box"
  },
  {
    id: "prod-2",
    _id: "prod-2",
    name: "Flower Pots Big",
    brand: "Standard",
    category: "Flower Pots",
    price: 450,
    hasDiscount: true,
    image: "/flower_pots.png",
    stock: 80,
    storeStockPieces: 80,
    rating: 4.9,
    reviews: 42,
    description: "Grand golden fountain with brilliant sparkles and height.",
    quantity: "1 Box (10 Pcs)"
  },
  {
    id: "prod-3",
    _id: "prod-3",
    name: "1000 Wala Red Garland",
    brand: "Standard",
    category: "Sparklers",
    price: 1200,
    hasDiscount: true,
    image: "/sky_rocket_box.png",
    stock: 50,
    storeStockPieces: 50,
    rating: 4.7,
    reviews: 18,
    description: "Loud festive 1000 cracker garland for grand celebrations.",
    quantity: "1 Box"
  },
  {
    id: "prod-4",
    _id: "prod-4",
    name: "King Of Kings Sky Shot",
    brand: "Ajanta",
    category: "Rockets & Sky Shots",
    price: 350,
    hasDiscount: false,
    image: "/flower_pots.png",
    stock: 60,
    storeStockPieces: 60,
    rating: 4.6,
    reviews: 15,
    description: "Multi-color aerial palm tree effect with loud burst.",
    quantity: "1 Pc"
  },
  {
    id: "prod-5",
    _id: "prod-5",
    name: "Twinkling Star Sparklers",
    brand: "Standard",
    category: "Sparklers",
    price: 150,
    hasDiscount: true,
    image: "/sky_rocket_box.png",
    stock: 120,
    storeStockPieces: 120,
    rating: 4.8,
    reviews: 30,
    description: "Long-lasting gold and silver sparklers for kids & family.",
    quantity: "1 Box (10 Pcs)"
  },
  {
    id: "prod-6",
    _id: "prod-6",
    name: "Chakkra Special Deluxe",
    brand: "Coronation",
    category: "Ground Chakkars",
    price: 280,
    hasDiscount: true,
    image: "/flower_pots.png",
    stock: 90,
    storeStockPieces: 90,
    rating: 4.9,
    reviews: 28,
    description: "Smooth high-speed spinning ground chakkars.",
    quantity: "1 Box (10 Pcs)"
  },
  {
    id: "combo-1",
    _id: "combo-1",
    name: "Family Star Kit",
    brand: "Standard",
    category: "Combo Packs",
    price: 2499,
    hasDiscount: true,
    image: "/family_star_kit.png",
    stock: 50,
    storeStockPieces: 50,
    rating: 5.0,
    reviews: 55,
    description: "A perfect mix of 45 items including Ground Spinners, Sparklers, and Flower Pots.",
    quantity: "1 Combo Pack"
  },
  {
    id: "combo-2",
    _id: "combo-2",
    name: "Grand Sky Delight",
    brand: "Standard",
    category: "Combo Packs",
    price: 4999,
    hasDiscount: true,
    image: "/grand_sky_delight.png",
    stock: 35,
    storeStockPieces: 35,
    rating: 4.9,
    reviews: 40,
    description: "Elite 75-item collection featuring heavy Aerial Shots and Premium Fancy items.",
    quantity: "1 Mega Pack"
  },
  {
    id: "combo-3",
    _id: "combo-3",
    name: "Kids Joy Bundle",
    brand: "Standard",
    category: "Combo Packs",
    price: 1899,
    hasDiscount: true,
    image: "/kids_joy_bundle.png",
    stock: 40,
    storeStockPieces: 40,
    rating: 4.9,
    reviews: 33,
    description: "Noise-free and light-focused 30-item kit designed specifically for young ones.",
    quantity: "1 Kids Pack"
  },
  {
    id: "combo-4",
    _id: "combo-4",
    name: "Royal Celebration",
    brand: "Standard",
    category: "Combo Packs",
    price: 8999,
    hasDiscount: true,
    image: "/royal_celebration.png",
    stock: 20,
    storeStockPieces: 20,
    rating: 5.0,
    reviews: 62,
    description: "Massive 120-item mega combo for large gatherings and community celebrations.",
    quantity: "1 Jumbo Pack"
  }
];

export async function getProducts(): Promise<Product[]> {
  try {
    const data = await fetchJSON<{ products: Product[] } | Product[]>('/api/products?limit=10000');
    const list = Array.isArray(data) ? data : (data?.products || []);
    return list.map(p => ({
      ...p,
      storeStockPieces: p.storeStockPieces !== undefined ? p.storeStockPieces : (p.stock !== undefined ? p.stock : 0)
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product> {
  return await fetchJSON<Product>(`/api/products/${id}`);
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

export async function getMyEnquiries(): Promise<Order[]> {
  try {
    const data = await fetchJSON<{ orders: Order[] } | Order[]>('/api/orders/my-enquiries');
    return Array.isArray(data) ? data : (data?.orders || []);
  } catch (error) {
    console.warn('Failed to fetch my enquiries from API:', error);
    return [];
  }
}

export async function customerPhoneLoginAPI(phone: string, name?: string): Promise<{ token: string; user: any }> {
  return await fetchJSON<{ token: string; user: any }>('/api/auth/customer-login', 'POST', { phone, name });
}

export async function createOrder(orderData: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  alternatePhoneNumber?: string;
  preferredTransport?: string;
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

export async function deleteOrder(orderId: string): Promise<any> {
  try {
    const response = await fetchJSON(`/api/orders/${orderId}`, 'DELETE');
    return response;
  } catch (error) {
    console.error('Failed to delete order:', error);
    throw error;
  }
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logo?: string;
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
  youtubeVideos?: { title: string; url: string }[];
  priceListPdf?: string;
  heroBanners?: string[];
  noticeBanners?: string[];
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
  const token = resolveAuthToken(path);

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

export interface Brand {
  _id?: string;
  id?: string;
  brandId: string; // Auto generated e.g. b0001, b0002
  name: string;
  phone?: string;
  logo?: string;
  description?: string;
  itemsCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function getBrands(): Promise<Brand[]> {
  try {
    return await fetchJSON<Brand[]>('/api/brands');
  } catch (error) {
    console.error("Failed to fetch brands:", error);
    return [];
  }
}

export async function getNextBrandId(): Promise<string> {
  try {
    const res = await fetchJSON<{ brandId: string }>('/api/brands/next-id');
    return res.brandId || 'B0001';
  } catch (error) {
    return 'B0001';
  }
}

export async function createBrand(data: Partial<Brand>): Promise<Brand> {
  return fetchJSON<Brand>('/api/brands', 'POST', data);
}

export async function updateBrand(id: string, data: Partial<Brand>): Promise<Brand> {
  return fetchJSON<Brand>(`/api/brands/${id}`, 'PUT', data);
}

export async function deleteBrand(id: string): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/brands/${id}`, 'DELETE');
}

export async function uploadImageToCloudinary(fileOrBase64: File | string, folder: string = "admin_uploads"): Promise<string> {
  const token = localStorage.getItem("admin_token");
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body: FormData | string;
  if (typeof fileOrBase64 === "string") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ base64: fileOrBase64, folder });
  } else {
    const fd = new FormData();
    fd.append("image", fileOrBase64);
    fd.append("folder", folder);
    body = fd;
  }

  const path = `/api/upload?folder=${encodeURIComponent(folder)}`;
  const urlsToTry = path.startsWith("http")
    ? [path]
    : isLocalhost
      ? [
          `http://127.0.0.1:5000${path}`,
          `http://localhost:5000${path}`,
          `${API_BASE_URL}${path}`,
        ].filter((v, i, a) => a.indexOf(v) === i && !!v)
      : [`${API_BASE_URL}${path}`];

  let res: Response | null = null;
  let lastError: any = null;

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        credentials: "include",
      });
      if (response.ok) {
        res = response;
        break;
      } else {
        const errorText = await response.text();
        lastError = new Error(errorText || response.statusText);
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!res) {
    throw new Error(lastError?.message || "Failed to upload image to Cloudinary");
  }

  const data = await res.json();
  if (data.url) {
    return data.url;
  }
  throw new Error("Invalid Cloudinary upload response");
}

export interface ChitSchemeItem {
  _id?: string;
  id?: string;
  title?: string;
  schemeName?: string;
  description?: string;
  url: string;
  public_id?: string;
  startDate?: string;
  totalMonths?: number;
  numberOfMonths?: number;
  dueDateDay?: number;
  paymentDueDay?: number;
  monthlyAmount?: number;
  totalAmount?: number;
  totalSchemeAmount?: number;
  status?: 'Upcoming' | 'Active' | 'Completed' | 'Closed';
  displayOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function getChitSchemes(): Promise<ChitSchemeItem[]> {
  return fetchJSON<ChitSchemeItem[]>('/api/chit-schemes', 'GET');
}

export async function createChitScheme(data: Partial<ChitSchemeItem>): Promise<ChitSchemeItem> {
  return fetchJSON<ChitSchemeItem>('/api/chit-schemes', 'POST', data);
}

export async function updateChitScheme(id: string, data: Partial<ChitSchemeItem>): Promise<ChitSchemeItem> {
  return fetchJSON<ChitSchemeItem>(`/api/chit-schemes/${id}`, 'PUT', data);
}

export async function deleteChitScheme(id: string): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/chit-schemes/${id}`, 'DELETE');
}

export interface MonthlyPaymentLog {
  monthNumber: number;
  monthName?: string;
  dueDate?: string;
  amount?: number;
  status?: 'Pending' | 'Paid' | 'Late Pay';
  paidAt?: string;
  paymentMethod?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other' | '';
  transactionNumber?: string;
  updatedBy?: string;
  markedAsRead?: boolean;
  notes?: string;
}

export interface ChitSubscriptionItem {
  _id?: string;
  id?: string;
  schemeId?: string;
  schemeName: string;
  name: string;
  customerName?: string;
  phone: string;
  mobileNumber?: string;
  email?: string;
  location: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
  stage?: 'Pending Approval' | 'Approved' | 'Payment Started' | 'In Progress' | 'Almost Completed' | 'Completed' | 'Rejected';
  monthsPaid?: number;
  monthlyPayments?: MonthlyPaymentLog[];
  paidAt?: string;
  createdAt?: string;
}

export async function submitChitSubscription(data: {
  schemeId?: string;
  schemeName: string;
  name: string;
  phone: string;
  email?: string;
  location: string;
}): Promise<ChitSubscriptionItem> {
  const cleanPhone = String(data.phone || "").replace(/\D/g, "").slice(-10);
  const newSub: ChitSubscriptionItem = {
    id: String(Date.now()),
    schemeId: data.schemeId,
    schemeName: data.schemeName,
    name: data.name,
    phone: cleanPhone,
    email: data.email || '',
    location: data.location,
    status: 'Pending',
    approvalStatus: 'Pending',
    monthsPaid: 0,
    monthlyPayments: [],
    createdAt: new Date().toISOString()
  };

  // Local storage fallback
  try {
    const existing = JSON.parse(localStorage.getItem('local_chit_subscriptions') || '[]');
    localStorage.setItem('local_chit_subscriptions', JSON.stringify([newSub, ...existing]));
  } catch (e) {
    console.warn("Could not save to local_chit_subscriptions:", e);
  }

  try {
    const res = await fetchJSON<any>('/api/chit-subscriptions', 'POST', data);
    return res.subscription || res;
  } catch (err) {
    console.warn("API submit chit subscription failed, returning fallback:", err);
    return newSub;
  }
}

export async function getChitSubscriptions(): Promise<ChitSubscriptionItem[]> {
  let apiData: ChitSubscriptionItem[] = [];
  try {
    apiData = await fetchJSON<ChitSubscriptionItem[]>('/api/chit-subscriptions', 'GET');
  } catch (err) {
    console.warn("Failed to fetch chit subscriptions from API, using fallback:", err);
  }

  // Merge with local storage fallback and deduplicate by phone + schemeName
  try {
    const localData = JSON.parse(localStorage.getItem('local_chit_subscriptions') || '[]');
    const map = new Map<string, ChitSubscriptionItem>();

    // 1. Process API data first (highest priority)
    (apiData || []).forEach(item => {
      const cleanPhone = String(item.phone || "").replace(/\D/g, "").slice(-10);
      const schemeKey = String(item.schemeName || "").trim().toLowerCase();
      const uniqueKey = (cleanPhone && schemeKey) ? `${cleanPhone}_${schemeKey}` : (item._id || item.id || '');
      
      const appStatus = item.approvalStatus || (item.status === 'Paid' || item.status === 'Approved' ? 'Approved' : (item.status === 'Rejected' ? 'Rejected' : 'Pending'));
      map.set(uniqueKey, {
        ...item,
        approvalStatus: appStatus,
        monthsPaid: item.monthsPaid !== undefined ? item.monthsPaid : (item.status === 'Paid' ? 1 : 0),
        monthlyPayments: item.monthlyPayments || []
      });
    });

    // 2. Process local storage fallback data (only add if not present in API data)
    (localData || []).forEach((item: ChitSubscriptionItem) => {
      const cleanPhone = String(item.phone || "").replace(/\D/g, "").slice(-10);
      const schemeKey = String(item.schemeName || "").trim().toLowerCase();
      const uniqueKey = (cleanPhone && schemeKey) ? `${cleanPhone}_${schemeKey}` : (item._id || item.id || '');

      if (!map.has(uniqueKey)) {
        const appStatus = item.approvalStatus || (item.status === 'Paid' || item.status === 'Approved' ? 'Approved' : (item.status === 'Rejected' ? 'Rejected' : 'Pending'));
        map.set(uniqueKey, {
          ...item,
          approvalStatus: appStatus,
          monthsPaid: item.monthsPaid !== undefined ? item.monthsPaid : (item.status === 'Paid' ? 1 : 0),
          monthlyPayments: item.monthlyPayments || []
        });
      }
    });

    // Clean up local storage items that are already synced with API
    if (apiData && apiData.length > 0) {
      const apiKeys = new Set((apiData || []).map(item => {
        const cleanPhone = String(item.phone || "").replace(/\D/g, "").slice(-10);
        const schemeKey = String(item.schemeName || "").trim().toLowerCase();
        return (cleanPhone && schemeKey) ? `${cleanPhone}_${schemeKey}` : (item._id || item.id || '');
      }));

      const remainingLocal = (localData || []).filter((item: ChitSubscriptionItem) => {
        const cleanPhone = String(item.phone || "").replace(/\D/g, "").slice(-10);
        const schemeKey = String(item.schemeName || "").trim().toLowerCase();
        const k = (cleanPhone && schemeKey) ? `${cleanPhone}_${schemeKey}` : (item._id || item.id || '');
        return !apiKeys.has(k);
      });
      localStorage.setItem('local_chit_subscriptions', JSON.stringify(remainingLocal));
    }

    return Array.from(map.values()).sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
  } catch (e) {
    return apiData || [];
  }
}

export async function approveChitSubscriptionApi(id: string): Promise<ChitSubscriptionItem> {
  // Update in local storage fallback
  try {
    const localData: ChitSubscriptionItem[] = JSON.parse(localStorage.getItem('local_chit_subscriptions') || '[]');
    const updatedLocal = localData.map(item => {
      if (item.id === id || item._id === id) {
        return { ...item, approvalStatus: 'Approved' as const, status: 'Approved' as const };
      }
      return item;
    });
    localStorage.setItem('local_chit_subscriptions', JSON.stringify(updatedLocal));
  } catch (e) {}

  try {
    const res = await fetchJSON<any>(`/api/chit-subscriptions/${id}/approve`, 'PUT', {});
    return res.subscription || res;
  } catch (err) {
    console.warn("API approve chit subscription failed, updated locally:", err);
    return { id, schemeName: '', name: '', phone: '', location: '', status: 'Approved', approvalStatus: 'Approved' };
  }
}

export async function rejectChitSubscriptionApi(id: string): Promise<ChitSubscriptionItem> {
  // Update in local storage fallback
  try {
    const localData: ChitSubscriptionItem[] = JSON.parse(localStorage.getItem('local_chit_subscriptions') || '[]');
    const updatedLocal = localData.map(item => {
      if (item.id === id || item._id === id) {
        return { ...item, approvalStatus: 'Rejected' as const, status: 'Rejected' as const };
      }
      return item;
    });
    localStorage.setItem('local_chit_subscriptions', JSON.stringify(updatedLocal));
  } catch (e) {}

  try {
    const res = await fetchJSON<any>(`/api/chit-subscriptions/${id}/reject`, 'PUT', {});
    return res.subscription || res;
  } catch (err) {
    console.warn("API reject chit subscription failed, updated locally:", err);
    return { id, schemeName: '', name: '', phone: '', location: '', status: 'Rejected', approvalStatus: 'Rejected' };
  }
}

export async function markMonthlyPaymentReadApi(id: string, notes?: string): Promise<ChitSubscriptionItem> {
  // Update in local storage fallback
  try {
    const localData: ChitSubscriptionItem[] = JSON.parse(localStorage.getItem('local_chit_subscriptions') || '[]');
    const updatedLocal = localData.map(item => {
      if (item.id === id || item._id === id) {
        const nextMonth = (item.monthsPaid || 0) + 1;
        const currentLogs = item.monthlyPayments || [];
        return {
          ...item,
          status: 'Paid' as const,
          paidAt: new Date().toISOString(),
          monthsPaid: nextMonth,
          monthlyPayments: [
            ...currentLogs,
            { monthNumber: nextMonth, status: 'Paid' as const, paidAt: new Date().toISOString(), markedAsRead: true, notes: notes || `Month ${nextMonth} payment marked as read` }
          ]
        };
      }
      return item;
    });
    localStorage.setItem('local_chit_subscriptions', JSON.stringify(updatedLocal));
  } catch (e) {}

  try {
    const res = await fetchJSON<any>(`/api/chit-subscriptions/${id}/mark-read`, 'PUT', { notes });
    return res.subscription || res;
  } catch (err) {
    console.warn("API mark monthly payment read failed, updated locally:", err);
    return { id, schemeName: '', name: '', phone: '', location: '', status: 'Paid' };
  }
}

export async function updateMonthPaymentStatusApi(
  id: string,
  params: {
    monthNumber: number;
    monthName?: string;
    dueDate?: string;
    amount?: number;
    status: 'Pending' | 'Paid' | 'Late Pay';
    paymentDate?: string;
    paymentMethod?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other' | '';
    transactionNumber?: string;
    notes?: string;
  }
): Promise<ChitSubscriptionItem> {
  try {
    const localData: ChitSubscriptionItem[] = JSON.parse(localStorage.getItem('local_chit_subscriptions') || '[]');
    const updatedLocal = localData.map(item => {
      if (item.id === id || item._id === id) {
        const currentLogs = item.monthlyPayments || [];
        const idx = currentLogs.findIndex(l => l.monthNumber === params.monthNumber);
        let newLogs = [...currentLogs];
        if (idx > -1) {
          newLogs[idx] = {
            ...newLogs[idx],
            monthName: params.monthName || newLogs[idx].monthName,
            dueDate: params.dueDate || newLogs[idx].dueDate,
            amount: params.amount !== undefined ? params.amount : newLogs[idx].amount,
            status: params.status,
            paidAt: params.status === 'Pending' ? undefined : (params.paymentDate || new Date().toISOString()),
            paymentMethod: params.paymentMethod || newLogs[idx].paymentMethod,
            transactionNumber: params.transactionNumber || newLogs[idx].transactionNumber,
            notes: params.notes ?? newLogs[idx].notes
          };
        } else {
          newLogs.push({
            monthNumber: params.monthNumber,
            monthName: params.monthName || `Month ${params.monthNumber}`,
            dueDate: params.dueDate || '',
            amount: params.amount || 0,
            status: params.status,
            paidAt: params.status === 'Pending' ? undefined : (params.paymentDate || new Date().toISOString()),
            paymentMethod: params.paymentMethod || '',
            transactionNumber: params.transactionNumber || '',
            markedAsRead: true,
            notes: params.notes || ''
          });
        }
        const paidCount = newLogs.filter(l => l.status === 'Paid' || l.status === 'Late Pay').length;
        return {
          ...item,
          monthsPaid: paidCount,
          monthlyPayments: newLogs
        };
      }
      return item;
    });
    localStorage.setItem('local_chit_subscriptions', JSON.stringify(updatedLocal));
  } catch (e) {}

  try {
    const res = await fetchJSON<any>(`/api/chit-subscriptions/${id}/month-status`, 'PUT', params);
    return res.subscription || res;
  } catch (err) {
    console.warn("API update month payment status failed, updated locally:", err);
    return { id, schemeName: '', name: '', phone: '', location: '', status: 'Paid' };
  }
}

export async function updateChitSubscriptionStatus(id: string, status: 'Pending' | 'Approved' | 'Rejected' | 'Paid'): Promise<ChitSubscriptionItem> {
  // Update in local storage fallback first
  try {
    const localData: ChitSubscriptionItem[] = JSON.parse(localStorage.getItem('local_chit_subscriptions') || '[]');
    const updatedLocal = localData.map(item => {
      if (item.id === id || item._id === id) {
        const updated = { ...item, status };
        if (status === 'Approved') updated.approvalStatus = 'Approved';
        if (status === 'Rejected') updated.approvalStatus = 'Rejected';
        if (status === 'Paid') updated.paidAt = new Date().toISOString();
        return updated;
      }
      return item;
    });
    localStorage.setItem('local_chit_subscriptions', JSON.stringify(updatedLocal));
  } catch (e) {}

  try {
    const res = await fetchJSON<any>(`/api/chit-subscriptions/${id}/status`, 'PUT', { status });
    return res.subscription || res;
  } catch (err) {
    console.warn("API update chit subscription status failed:", err);
    return { id, schemeName: '', name: '', phone: '', location: '', status };
  }
}

export async function deleteChitSubscription(id: string): Promise<{ message: string }> {
  try {
    const localData: ChitSubscriptionItem[] = JSON.parse(localStorage.getItem('local_chit_subscriptions') || '[]');
    const filtered = localData.filter(item => item.id !== id && item._id !== id);
    localStorage.setItem('local_chit_subscriptions', JSON.stringify(filtered));
  } catch (e) {}

  try {
    return await fetchJSON<{ message: string }>(`/api/chit-subscriptions/${id}`, 'DELETE');
  } catch (err) {
    return { message: "Deleted locally" };
  }
}

export interface ProductEnquiryItem {
  id?: string;
  productName: string;
  amount: number;
  status: string;
  enquiryDate: string;
}

export interface CustomerItem {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  deliveryAddress?: string;
  state?: string;
  district?: string;
  sources: ("normal_login" | "chit_scheme" | "product_enquiry")[];
  productEnquiries: ProductEnquiryItem[];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  purchases: any[];
  createdAt?: string;
}

export async function trackCustomerAction(data: {
  phone: string;
  name?: string;
  source: "normal_login" | "chit_scheme" | "product_enquiry";
  enquiry?: { productName: string; amount: number; status?: string; enquiryDate?: Date | string };
  deliveryAddress?: any;
}): Promise<any> {
  const cleanPhone = String(data.phone || "").replace(/\D/g, "").slice(-10);
  if (!cleanPhone) return;

  // Local Storage Fallback Sync
  try {
    const rawLocal = localStorage.getItem("local_customer_tracks");
    const tracksMap = rawLocal ? JSON.parse(rawLocal) : {};
    const existing = tracksMap[cleanPhone] || {
      phone: cleanPhone,
      name: data.name || "Customer",
      sources: [],
      productEnquiries: []
    };

    if (data.name && (existing.name === "Customer" || !existing.name)) {
      existing.name = data.name;
    }
    if (data.source === "chit_scheme" || data.source === "product_enquiry" || data.enquiry) {
      existing.sources = existing.sources.filter((s: string) => s !== "normal_login");
      if (!existing.sources.includes(data.source)) {
        existing.sources.push(data.source);
      }
    } else if (!existing.sources.includes(data.source)) {
      existing.sources.push(data.source);
    }
    if (data.enquiry) {
      existing.productEnquiries.push({
        id: String(Math.random()),
        productName: data.enquiry.productName,
        amount: Number(data.enquiry.amount) || 0,
        status: data.enquiry.status || "New",
        enquiryDate: data.enquiry.enquiryDate || new Date().toISOString()
      });
    }
    tracksMap[cleanPhone] = existing;
    localStorage.setItem("local_customer_tracks", JSON.stringify(tracksMap));
  } catch (e) {
    console.warn("Could not save to local_customer_tracks:", e);
  }

  try {
    return await fetchJSON("/api/customers/track", "POST", data);
  } catch (err) {
    console.warn("Failed to send customer track to backend, saved locally:", err);
  }
}

export async function getCustomers(): Promise<CustomerItem[]> {
  try {
    const data = await fetchJSON<CustomerItem[]>("/api/customers");
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn("Failed to fetch customers from API, building fallback:", err);
  }
  return [];
}

