import { api } from "./api";
import { Category, CategoryFormValues } from "@/types";

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function createCategory(payload: CategoryFormValues): Promise<Category> {
  const { data } = await api.post<Category>("/categories", payload);
  return data;
}

export async function updateCategory(
  id: number,
  payload: CategoryFormValues
): Promise<Category> {
  const { data } = await api.put<Category>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}
