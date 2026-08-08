import { Product, Category, Order } from "@/data/products";

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = isLocalhost
  ? "" 
  : ((import.meta.env.VITE_API_URL as string) || "");

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

  const urlsToTry = path.startsWith('http')
    ? [path]
    : isLocalhost
      ? [
          `${API_BASE_URL}${path}`,
          `http://127.0.0.1:5000${path}`,
          `http://localhost:5000${path}`,
        ].filter((v, i, a) => a.indexOf(v) === i)
      : [`${API_BASE_URL}${path}`];

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
    if (list.length > 0) {
      return list.map(p => ({
        ...p,
        storeStockPieces: p.storeStockPieces !== undefined ? p.storeStockPieces : (p.stock !== undefined ? p.stock : 0)
      }));
    }
    return FALLBACK_PRODUCTS;
  } catch (error) {
    console.error('Failed to fetch products, using fallback:', error);
    return FALLBACK_PRODUCTS;
  }
}

export async function getProductById(id: string): Promise<Product> {
  try {
    return await fetchJSON<Product>(`/api/products/${id}`);
  } catch (error) {
    const fallback = FALLBACK_PRODUCTS.find(p => p.id === id || p._id === id);
    if (fallback) return fallback;
    throw error;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const data = await fetchJSON<{ categories: Category[] } | Category[]>('/api/categories');
    const list = Array.isArray(data) ? data : (data?.categories || []);
    if (list.length > 0) return list;
    return FALLBACK_CATEGORIES;
  } catch (error) {
    console.error('Failed to fetch categories, using fallback:', error);
    return FALLBACK_CATEGORIES;
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
          `${API_BASE_URL}${path}`,
          `http://127.0.0.1:5000${path}`,
          `http://localhost:5000${path}`,
        ].filter((v, i, a) => a.indexOf(v) === i)
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
  description?: string;
  url: string;
  public_id?: string;
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
