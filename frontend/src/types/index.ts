export type UserRole = "user" | "admin" | "super_admin";

export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  auth_provider: "local" | "google";
  google_linked: boolean;
  google_email: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface Invitation {
  id: number;
  email: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  category_id: number | null;
  category: Category | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProductFormValues {
  name: string;
  description: string;
  sku: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  category_id: number | null;
}

export interface CategoryFormValues {
  name: string;
  description: string;
}
