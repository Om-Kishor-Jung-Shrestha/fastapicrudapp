import { api } from "./api";
import { PaginatedProducts, Product, ProductFormValues } from "@/types";

export interface ProductQuery {
  search?: string;
  category_id?: number | null;
  page?: number;
  page_size?: number;
}

export async function fetchProducts(query: ProductQuery): Promise<PaginatedProducts> {
  const params: Record<string, string | number> = {
    page: query.page ?? 1,
    page_size: query.page_size ?? 10,
  };
  if (query.search) params.search = query.search;
  if (query.category_id) params.category_id = query.category_id;

  const { data } = await api.get<PaginatedProducts>("/products", { params });
  return data;
}

export async function fetchProduct(id: number): Promise<Product> {
  const { data } = await api.get<Product>(`/products/${id}`);
  return data;
}

export async function createProduct(payload: ProductFormValues): Promise<Product> {
  const { data } = await api.post<Product>("/products", normalize(payload));
  return data;
}

export async function updateProduct(
  id: number,
  payload: ProductFormValues
): Promise<Product> {
  const { data } = await api.put<Product>(`/products/${id}`, normalize(payload));
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ url: string }>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
}

function normalize(payload: ProductFormValues) {
  return {
    ...payload,
    description: payload.description || null,
    image_url: payload.image_url || null,
    category_id: payload.category_id || null,
  };
}
