export interface Product {
  _id?: string;
  id?: string | number;
  name: string;
  sku?: string;
  code?: string;
  category?: string;
  price: number;
  oldPrice?: number;
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
  oldPrice?: number;
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

