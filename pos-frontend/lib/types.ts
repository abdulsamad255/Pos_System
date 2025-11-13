// lib/types.ts

export type User = {
  id: number;
  name: string;
  email: string;
  role: "manager" | "cashier";
  created_at: string;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
};

export type SaleItem = {
  id: number;
  sale_id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
};

export type Sale = {
  id: number;
  total_amount: number;
  paid_amount: number;
  payment_method: string;
  created_at: string;
  items?: SaleItem[];
};

export type LoginResponse = {
  token: string;
  user: User;
};


export type SalesSummary = {
  total_sales: number;
  total_revenue: number;
  total_items: number;
};

export type DailySalesRow = {
  date: string;
  total_sales: number;
  total_revenue: number;
};

export type TopProductRow = {
  product_id: number;
  product_name: string;
  quantity: number;
  revenue: number;
};

