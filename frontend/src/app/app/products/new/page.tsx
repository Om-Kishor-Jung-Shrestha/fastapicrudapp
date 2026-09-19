"use client";

import ProductForm from "@/components/ProductForm";
import { createProduct } from "@/lib/productApi";
import { ProductFormValues } from "@/types";

export default function NewProductPage() {
  async function handleCreate(values: ProductFormValues) {
    await createProduct(values);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Add Product</h1>
      <ProductForm onSubmit={handleCreate} submitLabel="Create Product" />
    </div>
  );
}
