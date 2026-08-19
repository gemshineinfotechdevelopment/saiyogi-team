export interface Product {
  _id?: string;
  id?: string | number;
  name: string;
  sku?: string;
  code?: string;
  category?: string;
  price: number;
  oldPrice?: number;
  originalPrice?: number;
  hasDiscount?: boolean;
  image?: string;
  brand?: string;
  stock?: number;
  rating?: number;
  reviews?: number;
  description?: string;
  quantity?: string;
  netRate?: number;
  displayNetRate?: boolean;
  wholesalePrice?: number;
  storeStockPieces?: number;
  godownStockCases?: number;
  piecesPerCase?: number;
  godownStockPieces?: number;
  minimumStock?: number;
  isSaiYogiVerified?: boolean;
  crackerType?: 'Day Crackers' | 'Night Crackers' | 'Kids Crackers' | 'Gift Box' | string;
}

export interface Category {
  _id?: string;
  id?: string;
  name: string;
  categoryCode?: string;
  productCount: number;
  image: string;
}

export interface Order {
  id: string;
  customer: string;
  email: string;
  items: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  date: string;
}

